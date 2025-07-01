import type {
  ConversationType,
  MessageType,
  MessageStatus,
  Conversation,
  ConversationMember,
  Message,
  MessageAttachment,
  MessageReaction,
  MessageReadReceipt,
  User,
} from '@prisma/client';

// Extended types with relationships
export interface ConversationWithDetails extends Conversation {
  members: (ConversationMember & {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>;
  })[];
  messages?: MessageWithDetails[];
  _count?: {
    messages: number;
    members: number;
  };
}

export interface MessageWithDetails extends Message {
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>;
  conversation?: Pick<Conversation, 'id' | 'title' | 'type'>;
  replyTo?: MessageWithDetails;
  replies?: MessageWithDetails[];
  attachments: MessageAttachment[];
  reactions: (MessageReaction & {
    user: Pick<User, 'id' | 'firstName' | 'lastName'>;
  })[];
  readReceipts: (MessageReadReceipt & {
    user: Pick<User, 'id' | 'firstName' | 'lastName'>;
  })[];
  _count?: {
    reactions: number;
    readReceipts: number;
    replies: number;
  };
}

export interface ConversationMemberWithUser extends ConversationMember {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'>;
}

// Input types for API requests
export interface CreateConversationInput {
  title?: string;
  type: ConversationType;
  description?: string;
  memberIds: string[];
}

export interface UpdateConversationInput {
  title?: string;
  description?: string;
  avatar?: string;
  isArchived?: boolean;
}

export interface CreateMessageInput {
  conversationId: string;
  content?: string;
  type: MessageType;
  replyToId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMessageInput {
  content?: string;
  metadata?: Record<string, any>;
}

export interface MessageAttachmentInput {
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface AddMemberInput {
  conversationId: string;
  userId: string;
  isAdmin?: boolean;
}

export interface UpdateMemberInput {
  isAdmin?: boolean;
  isMuted?: boolean;
  notificationsEnabled?: boolean;
}

export interface MessageReactionInput {
  messageId: string;
  emoji: string;
}

// Query parameters
export interface ConversationQueryParams {
  type?: ConversationType;
  isArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MessageQueryParams {
  conversationId: string;
  before?: string; // Message ID for pagination
  after?: string; // Message ID for pagination
  limit?: number;
  type?: MessageType;
  search?: string;
}

// Response types
export interface ConversationListResponse {
  conversations: ConversationWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface MessageListResponse {
  messages: MessageWithDetails[];
  pagination: {
    hasMore: boolean;
    before?: string;
    after?: string;
  };
}

// Real-time event types
export interface SocketEvents {
  // Conversation events
  'conversation:created': ConversationWithDetails;
  'conversation:updated': ConversationWithDetails;
  'conversation:deleted': { conversationId: string };
  'conversation:member_added': {
    conversationId: string;
    member: ConversationMemberWithUser;
  };
  'conversation:member_removed': { conversationId: string; userId: string };
  'conversation:member_updated': {
    conversationId: string;
    member: ConversationMemberWithUser;
  };

  // Message events
  'message:sent': MessageWithDetails;
  'message:updated': MessageWithDetails;
  'message:deleted': { messageId: string; conversationId: string };
  'message:reaction_added': {
    messageId: string;
    reaction: MessageReaction & {
      user: Pick<User, 'id' | 'firstName' | 'lastName'>;
    };
  };
  'message:reaction_removed': { messageId: string; reactionId: string };
  'message:read': { messageId: string; userId: string; readAt: Date };

  // Typing indicators
  'typing:start': { conversationId: string; userId: string };
  'typing:stop': { conversationId: string; userId: string };

  // Connection events
  'user:online': { userId: string };
  'user:offline': { userId: string };
}

// Validation constraints
export const MESSAGING_CONSTRAINTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CONVERSATION_TITLE_LENGTH: 100,
  MAX_CONVERSATION_DESCRIPTION_LENGTH: 500,
  MAX_MEMBERS_PER_CONVERSATION: 50,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  SUPPORTED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  MESSAGE_PAGINATION_LIMIT: 50,
  CONVERSATION_PAGINATION_LIMIT: 20,
} as const;

// Utility types
export type MessageContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document';
export type ConversationRole = 'admin' | 'member';
export type OnlineStatus = 'online' | 'away' | 'offline';

// Error types
export interface MessagingError {
  code: string;
  message: string;
  field?: string;
}

export const MESSAGING_ERRORS = {
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INVALID_MESSAGE_TYPE: 'INVALID_MESSAGE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  MEMBER_ALREADY_EXISTS: 'MEMBER_ALREADY_EXISTS',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CONVERSATION_ARCHIVED: 'CONVERSATION_ARCHIVED',
  MAX_MEMBERS_EXCEEDED: 'MAX_MEMBERS_EXCEEDED',
} as const;

export type MessagingErrorCode = keyof typeof MESSAGING_ERRORS;
