import { prisma } from '../../lib/prisma';
import { socketServer } from '../socket/socket.server';
import type {
  CreateMessageInput,
  UpdateMessageInput,
  MessageWithDetails,
  MessageListResponse,
  MessageQueryParams,
  MessageAttachmentInput,
  MessageReactionInput,
} from '../../types/messaging';

export class MessageService {
  // Send a new message
  async sendMessage(
    userId: string,
    userRole: string,
    messageData: CreateMessageInput
  ): Promise<MessageWithDetails> {
    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: messageData.conversationId,
          userId,
        },
      },
    });

    if (!membership || membership.leftAt) {
      throw new Error('You are not a member of this conversation');
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: messageData.conversationId,
        senderId: userId,
        content: messageData.content,
        type: messageData.type,
        replyToId: messageData.replyToId,
        metadata: messageData.metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            readReceipts: true,
            replies: true,
          },
        },
      },
    });

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: messageData.conversationId },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
      },
    });

    // Broadcast message to conversation members via Socket.IO
    if (socketServer) {
      await socketServer.broadcastToConversation(
        messageData.conversationId,
        'message:sent',
        message
      );
    }

    return message as MessageWithDetails;
  }

  // Get messages for a conversation
  async getMessages(
    userId: string,
    userRole: string,
    queryParams: MessageQueryParams
  ): Promise<MessageListResponse> {
    const {
      conversationId,
      before,
      after,
      limit = 50,
      type,
      search,
    } = queryParams;

    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!membership || membership.leftAt) {
      throw new Error('You are not a member of this conversation');
    }

    // Build where clause
    let whereClause: any = {
      conversationId,
      isDeleted: false,
    };

    if (type) {
      whereClause.type = type;
    }

    if (search) {
      whereClause.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Handle pagination
    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    } else if (after) {
      whereClause.createdAt = { gt: new Date(after) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            readReceipts: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const hasMore = messages.length === limit;

    return {
      messages: messages as MessageWithDetails[],
      pagination: {
        hasMore,
        before: hasMore
          ? messages[messages.length - 1].createdAt.toISOString()
          : undefined,
        after:
          messages.length > 0 ? messages[0].createdAt.toISOString() : undefined,
      },
    };
  }

  // Update a message
  async updateMessage(
    messageId: string,
    userId: string,
    userRole: string,
    updateData: UpdateMessageInput
  ): Promise<MessageWithDetails> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only sender can edit their own messages (or admins)
    if (message.senderId !== userId && userRole !== 'ADMIN') {
      throw new Error('You can only edit your own messages');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        ...updateData,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        conversation: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            readReceipts: true,
            replies: true,
          },
        },
      },
    });

    // Broadcast update to conversation members
    if (socketServer) {
      await socketServer.broadcastToConversation(
        message.conversationId,
        'message:updated',
        updatedMessage
      );
    }

    return updatedMessage as MessageWithDetails;
  }

  // Delete a message
  async deleteMessage(
    messageId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Only sender can delete their own messages (or admins)
    if (message.senderId !== userId && userRole !== 'ADMIN') {
      throw new Error('You can only delete your own messages');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: null, // Clear content for privacy
      },
    });

    // Broadcast deletion to conversation members
    if (socketServer) {
      await socketServer.broadcastToConversation(
        message.conversationId,
        'message:deleted',
        {
          messageId,
          conversationId: message.conversationId,
        }
      );
    }
  }

  // Add message reaction
  async addReaction(
    userId: string,
    reactionData: MessageReactionInput
  ): Promise<void> {
    const { messageId, emoji } = reactionData;

    // Verify user can access the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message || message.conversation.members.length === 0) {
      throw new Error('Message not found or access denied');
    }

    try {
      const reaction = await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Broadcast reaction to conversation members
      if (socketServer) {
        await socketServer.broadcastToConversation(
          message.conversationId,
          'message:reaction_added',
          {
            messageId,
            reaction,
          }
        );
      }
    } catch (error) {
      // Handle duplicate reaction (user already reacted with this emoji)
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        throw new Error('You have already reacted with this emoji');
      }
      throw error;
    }
  }

  // Remove message reaction
  async removeReaction(
    userId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const reaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      include: {
        message: true,
      },
    });

    if (!reaction) {
      throw new Error('Reaction not found');
    }

    await prisma.messageReaction.delete({
      where: { id: reaction.id },
    });

    // Broadcast reaction removal to conversation members
    if (socketServer) {
      await socketServer.broadcastToConversation(
        reaction.message.conversationId,
        'message:reaction_removed',
        {
          messageId,
          reactionId: reaction.id,
        }
      );
    }
  }

  // Add message attachment
  async addAttachment(
    messageId: string,
    userId: string,
    attachmentData: MessageAttachmentInput
  ): Promise<void> {
    // Verify user owns the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      throw new Error('Message not found or access denied');
    }

    await prisma.messageAttachment.create({
      data: {
        messageId,
        ...attachmentData,
        uploadedBy: userId,
      },
    });
  }
}

export const messageService = new MessageService();
