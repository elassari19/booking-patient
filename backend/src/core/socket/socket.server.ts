import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { prisma } from '../../lib/prisma';
import { redisClient } from '../../lib/redis';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class SocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set<userId>

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Get session ID from socket handshake
        const sessionId =
          socket.handshake.auth?.sessionId ||
          socket.handshake.headers?.cookie?.match(/connect\.sid=([^;]+)/)?.[1];

        if (!sessionId) {
          return next(new Error('Authentication error: No session'));
        }

        // Get session data from Redis
        const sessionKey = `sess:${sessionId.replace('s:', '').split('.')[0]}`;
        const sessionData = await redisClient.get(sessionKey);

        if (!sessionData) {
          return next(new Error('Authentication error: Invalid session'));
        }

        const session = JSON.parse(sessionData);
        const userId = session.passport?.user;

        if (!userId) {
          return next(
            new Error('Authentication error: User not found in session')
          );
        }

        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Authentication error: User inactive'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Store connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        // Notify others that user is online
        this.broadcastUserStatus(socket.userId, 'online');

        // Join user's conversation rooms
        this.joinUserConversations(socket);
      }

      // Handle joining conversation rooms
      socket.on('conversation:join', async (conversationId: string) => {
        try {
          await this.joinConversation(socket, conversationId);
        } catch (error) {
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle leaving conversation rooms
      socket.on('conversation:leave', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        this.stopTyping(socket, conversationId);
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { conversationId: string }) => {
        this.handleTypingStart(socket, data.conversationId);
      });

      socket.on('typing:stop', (data: { conversationId: string }) => {
        this.handleTypingStop(socket, data.conversationId);
      });

      // Handle message events
      socket.on('message:send', async (data: any) => {
        try {
          await this.handleMessageSend(socket, data);
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('message:read', async (data: { messageId: string }) => {
        try {
          await this.handleMessageRead(socket, data.messageId);
        } catch (error) {
          socket.emit('error', { message: 'Failed to mark message as read' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);

        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.broadcastUserStatus(socket.userId, 'offline');

          // Stop typing in all conversations
          this.typingUsers.forEach((users, conversationId) => {
            if (users.has(socket.userId!)) {
              this.stopTyping(socket, conversationId);
            }
          });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    try {
      const conversations = await prisma.conversationMember.findMany({
        where: {
          userId: socket.userId,
          leftAt: null,
        },
        select: {
          conversationId: true,
        },
      });

      conversations.forEach(({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
      });
    } catch (error) {
      console.error('Error joining user conversations:', error);
    }
  }

  private async joinConversation(
    socket: AuthenticatedSocket,
    conversationId: string
  ) {
    if (!socket.userId) throw new Error('User not authenticated');

    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: socket.userId,
        },
      },
    });

    if (!membership || membership.leftAt) {
      throw new Error('User not authorized for this conversation');
    }

    socket.join(`conversation:${conversationId}`);
  }

  private handleTypingStart(
    socket: AuthenticatedSocket,
    conversationId: string
  ) {
    if (!socket.userId) return;

    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }

    const typingSet = this.typingUsers.get(conversationId)!;
    typingSet.add(socket.userId);

    // Broadcast to conversation members (except sender)
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId: socket.userId,
    });

    // Auto-stop typing after 3 seconds of inactivity
    setTimeout(() => {
      if (typingSet.has(socket.userId!)) {
        this.stopTyping(socket, conversationId);
      }
    }, 3000);
  }

  private handleTypingStop(
    socket: AuthenticatedSocket,
    conversationId: string
  ) {
    this.stopTyping(socket, conversationId);
  }

  private stopTyping(socket: AuthenticatedSocket, conversationId: string) {
    if (!socket.userId) return;

    const typingSet = this.typingUsers.get(conversationId);
    if (typingSet && typingSet.has(socket.userId)) {
      typingSet.delete(socket.userId);

      if (typingSet.size === 0) {
        this.typingUsers.delete(conversationId);
      }

      // Broadcast to conversation members (except sender)
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      });
    }
  }

  private async handleMessageSend(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId) throw new Error('User not authenticated');

    // The actual message creation should be handled by the HTTP API
    // This is just for real-time broadcasting
    const { conversationId, message } = data;

    // Verify user is member of conversation
    await this.joinConversation(socket, conversationId);

    // Broadcast to conversation members
    this.io.to(`conversation:${conversationId}`).emit('message:sent', {
      ...message,
      senderId: socket.userId,
    });

    // Stop typing for this user
    this.stopTyping(socket, conversationId);
  }

  private async handleMessageRead(
    socket: AuthenticatedSocket,
    messageId: string
  ) {
    if (!socket.userId) throw new Error('User not authenticated');

    try {
      // Create read receipt
      const readReceipt = await prisma.messageReadReceipt.create({
        data: {
          messageId,
          userId: socket.userId,
        },
        include: {
          message: {
            select: {
              conversationId: true,
              senderId: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Broadcast read receipt to conversation members
      this.io
        .to(`conversation:${readReceipt.message.conversationId}`)
        .emit('message:read', {
          messageId,
          userId: socket.userId,
          readAt: readReceipt.readAt,
          user: readReceipt.user,
        });
    } catch (error) {
      // Handle duplicate read receipt (user already read this message)
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        return; // Silently ignore
      }
      throw error;
    }
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.io.emit('user:status', { userId, status });
  }

  // Public methods for external use
  public async broadcastToConversation(
    conversationId: string,
    event: string,
    data: any
  ) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  public async broadcastToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getTypingUsers(conversationId: string): string[] {
    const typingSet = this.typingUsers.get(conversationId);
    return typingSet ? Array.from(typingSet) : [];
  }
}

export let socketServer: SocketServer;

export const initializeSocketServer = (httpServer: HTTPServer) => {
  socketServer = new SocketServer(httpServer);
  return socketServer;
};
