import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;

  // Conversation events
  'conversation:created': (conversation: any) => void;
  'conversation:updated': (conversation: any) => void;
  'conversation:deleted': (data: { conversationId: string }) => void;
  'conversation:member_added': (data: {
    conversationId: string;
    member: any;
  }) => void;
  'conversation:member_removed': (data: {
    conversationId: string;
    userId: string;
  }) => void;
  'conversation:member_updated': (data: {
    conversationId: string;
    member: any;
  }) => void;

  // Message events
  'message:sent': (message: any) => void;
  'message:updated': (message: any) => void;
  'message:deleted': (data: {
    messageId: string;
    conversationId: string;
  }) => void;
  'message:reaction_added': (data: {
    messageId: string;
    reaction: any;
  }) => void;
  'message:reaction_removed': (data: {
    messageId: string;
    reactionId: string;
  }) => void;
  'message:read': (data: {
    messageId: string;
    userId: string;
    readAt: Date;
  }) => void;

  // Typing indicators
  'typing:start': (data: { conversationId: string; userId: string }) => void;
  'typing:stop': (data: { conversationId: string; userId: string }) => void;

  // User status
  'user:status': (data: {
    userId: string;
    status: 'online' | 'offline';
  }) => void;

  // Error handling
  error: (error: { message: string }) => void;
}

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval: NodeJS.Timeout | number | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  async connect(): Promise<void> {
    try {
      // Get session cookie for authentication
      const sessionCookie = await AsyncStorage.getItem('sessionCookie');

      if (!sessionCookie) {
        throw new Error('No session cookie found');
      }

      const socketUrl =
        process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          sessionId: sessionCookie,
        },
        timeout: 20000,
        forceNew: true,
      });

      this.setupSocketListeners();

      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          console.log('✅ Socket connected:', this.socket!.id);
          this.reconnectAttempts = 0;
          if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
          }
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Socket connection failed:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    console.log('Socket disconnected');
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('disconnect', reason);

      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }

      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emit('connect_error', error);
      this.handleReconnection();
    });

    // Message events
    this.socket.on('message:sent', (message) => {
      this.emit('message:sent', message);
    });

    this.socket.on('message:updated', (message) => {
      this.emit('message:updated', message);
    });

    this.socket.on('message:deleted', (data) => {
      this.emit('message:deleted', data);
    });

    this.socket.on('message:reaction_added', (data) => {
      this.emit('message:reaction_added', data);
    });

    this.socket.on('message:reaction_removed', (data) => {
      this.emit('message:reaction_removed', data);
    });

    this.socket.on('message:read', (data) => {
      this.emit('message:read', data);
    });

    // Conversation events
    this.socket.on('conversation:created', (conversation) => {
      this.emit('conversation:created', conversation);
    });

    this.socket.on('conversation:updated', (conversation) => {
      this.emit('conversation:updated', conversation);
    });

    this.socket.on('conversation:deleted', (data) => {
      this.emit('conversation:deleted', data);
    });

    this.socket.on('conversation:member_added', (data) => {
      this.emit('conversation:member_added', data);
    });

    this.socket.on('conversation:member_removed', (data) => {
      this.emit('conversation:member_removed', data);
    });

    this.socket.on('conversation:member_updated', (data) => {
      this.emit('conversation:member_updated', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data) => {
      this.emit('typing:stop', data);
    });

    // User status
    this.socket.on('user:status', (data) => {
      this.emit('user:status', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
      Alert.alert('Connection Error', error.message);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      Alert.alert(
        'Connection Lost',
        'Unable to reconnect to the server. Please check your internet connection and restart the app.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (this.reconnectInterval) return; // Already trying to reconnect

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    console.log(
      `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectInterval = setTimeout(async () => {
      this.reconnectInterval = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        // handleReconnection will be called again by connect_error event
      }
    }, delay);
  }

  // Event handling methods
  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  private setupEventHandlers(): void {
    // Set up default event handlers that don't need external listeners
  }

  // Messaging methods
  joinConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('conversation:join', conversationId);
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  startTyping(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('typing:start', { conversationId });
    }
  }

  stopTyping(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('typing:stop', { conversationId });
    }
  }

  markMessageAsRead(messageId: string): void {
    if (this.socket) {
      this.socket.emit('message:read', { messageId });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
