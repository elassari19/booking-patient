import { prisma } from '../../lib/prisma';
import { socketServer } from '../socket/socket.server';
import type {
  CreateConversationInput,
  UpdateConversationInput,
  ConversationWithDetails,
  ConversationListResponse,
  ConversationQueryParams,
  AddMemberInput,
  UpdateMemberInput,
} from '../../types/messaging';

export class ConversationService {
  // Create a new conversation
  async createConversation(
    userId: string,
    userRole: string,
    conversationData: CreateConversationInput
  ): Promise<ConversationWithDetails> {
    const { title, type, description, memberIds } = conversationData;

    // Validate member IDs
    const validMembers = await prisma.user.findMany({
      where: {
        id: { in: memberIds },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (validMembers.length !== memberIds.length) {
      throw new Error('Some members are invalid or inactive');
    }

    // For direct conversations, ensure only 2 members
    if (type === 'DIRECT' && memberIds.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 members');
    }

    // Check if direct conversation already exists
    if (type === 'DIRECT') {
      const existingConversation = await this.findDirectConversation(
        memberIds[0],
        memberIds[1]
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create conversation with members
    const conversation = await prisma.conversation.create({
      data: {
        title,
        type,
        description,
        createdBy: userId,
        members: {
          create: memberIds.map((memberId, index) => ({
            userId: memberId,
            isAdmin: memberId === userId || index === 0, // Creator is admin
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    // Broadcast conversation creation to all members
    if (socketServer) {
      memberIds.forEach(async (memberId) => {
        await socketServer.broadcastToUser(
          memberId,
          'conversation:created',
          conversation
        );
      });
    }

    return conversation as ConversationWithDetails;
  }

  // Get user's conversations
  async getConversations(
    userId: string,
    userRole: string,
    queryParams: ConversationQueryParams
  ): Promise<ConversationListResponse> {
    const {
      type,
      isArchived = false,
      search,
      page = 1,
      limit = 20,
    } = queryParams;

    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {
      members: {
        some: {
          userId,
          leftAt: null,
        },
      },
      isArchived,
    };

    if (type) {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
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
          _count: {
            select: {
              messages: true,
              members: true,
            },
          },
        },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    return {
      conversations: conversations as ConversationWithDetails[],
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + conversations.length < total,
      },
    };
  }

  // Get single conversation
  async getConversationById(
    conversationId: string,
    userId: string,
    userRole: string
  ): Promise<ConversationWithDetails> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is member
    const isMember = conversation.members.some(
      (member) => member.userId === userId && !member.leftAt
    );

    if (!isMember && userRole !== 'ADMIN') {
      throw new Error('Access denied');
    }

    return conversation as ConversationWithDetails;
  }

  // Update conversation
  async updateConversation(
    conversationId: string,
    userId: string,
    userRole: string,
    updateData: UpdateConversationInput
  ): Promise<ConversationWithDetails> {
    const conversation = await this.getConversationById(
      conversationId,
      userId,
      userRole
    );

    // Check if user is admin of conversation
    const membershipData = conversation.members.find(
      (member) => member.userId === userId
    );
    if (!membershipData?.isAdmin && userRole !== 'ADMIN') {
      throw new Error(
        'Only conversation admins can update conversation details'
      );
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    // Broadcast update to conversation members
    if (socketServer) {
      await socketServer.broadcastToConversation(
        conversationId,
        'conversation:updated',
        updatedConversation
      );
    }

    return updatedConversation as ConversationWithDetails;
  }

  // Add member to conversation
  async addMember(
    userId: string,
    userRole: string,
    memberData: AddMemberInput
  ): Promise<void> {
    const { conversationId, userId: newUserId, isAdmin = false } = memberData;

    const conversation = await this.getConversationById(
      conversationId,
      userId,
      userRole
    );

    // Check permissions
    const membershipData = conversation.members.find(
      (member) => member.userId === userId
    );
    if (!membershipData?.isAdmin && userRole !== 'ADMIN') {
      throw new Error('Only conversation admins can add members');
    }

    // Check if user is already a member
    const existingMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: newUserId,
        },
      },
    });

    if (existingMember && !existingMember.leftAt) {
      throw new Error('User is already a member of this conversation');
    }

    // Add or re-add member
    const member = await prisma.conversationMember.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: newUserId,
        },
      },
      update: {
        leftAt: null,
        isAdmin,
        joinedAt: new Date(),
      },
      create: {
        conversationId,
        userId: newUserId,
        isAdmin,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Broadcast member addition
    if (socketServer) {
      await socketServer.broadcastToConversation(
        conversationId,
        'conversation:member_added',
        {
          conversationId,
          member,
        }
      );

      // Notify new member
      await socketServer.broadcastToUser(
        newUserId,
        'conversation:created',
        conversation
      );
    }
  }

  // Remove member from conversation
  async removeMember(
    conversationId: string,
    targetUserId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const conversation = await this.getConversationById(
      conversationId,
      userId,
      userRole
    );

    // Check permissions
    const membershipData = conversation.members.find(
      (member) => member.userId === userId
    );
    const targetMemberData = conversation.members.find(
      (member) => member.userId === targetUserId
    );

    if (!targetMemberData || targetMemberData.leftAt) {
      throw new Error('User is not a member of this conversation');
    }

    // Users can remove themselves, or admins can remove others
    if (
      userId !== targetUserId &&
      !membershipData?.isAdmin &&
      userRole !== 'ADMIN'
    ) {
      throw new Error('Insufficient permissions to remove member');
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        },
      },
      data: {
        leftAt: new Date(),
      },
    });

    // Broadcast member removal
    if (socketServer) {
      await socketServer.broadcastToConversation(
        conversationId,
        'conversation:member_removed',
        {
          conversationId,
          userId: targetUserId,
        }
      );
    }
  }

  // Update member permissions
  async updateMember(
    conversationId: string,
    targetUserId: string,
    userId: string,
    userRole: string,
    updateData: UpdateMemberInput
  ): Promise<void> {
    const conversation = await this.getConversationById(
      conversationId,
      userId,
      userRole
    );

    // Check permissions
    const membershipData = conversation.members.find(
      (member) => member.userId === userId
    );
    if (!membershipData?.isAdmin && userRole !== 'ADMIN') {
      throw new Error('Only conversation admins can update member permissions');
    }

    const updatedMember = await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Broadcast member update
    if (socketServer) {
      await socketServer.broadcastToConversation(
        conversationId,
        'conversation:member_updated',
        {
          conversationId,
          member: updatedMember,
        }
      );
    }
  }

  // Helper method to find existing direct conversation
  private async findDirectConversation(
    userId1: string,
    userId2: string
  ): Promise<ConversationWithDetails | null> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
            leftAt: null,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
            members: true,
          },
        },
      },
    });

    return conversation ? (conversation as ConversationWithDetails) : null;
  }
}

export const conversationService = new ConversationService();
