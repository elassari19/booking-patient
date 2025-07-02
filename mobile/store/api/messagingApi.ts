import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface ConversationMember {
  id: string;
  userId: string;
  isAdmin: boolean;
  isMuted: boolean;
  joinedAt: string;
  leftAt?: string;
  lastReadAt?: string;
  user: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VOICE' | 'VIDEO';
  status: 'SENT' | 'DELIVERED' | 'READ';
  metadata?: any;
  replyToId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
  replyTo?: Message;
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  readReceipts: MessageReadReceipt[];
  _count: {
    reactions: number;
    readReceipts: number;
    replies: number;
  };
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: User;
}

export interface MessageReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  user: User;
}

export interface Conversation {
  id: string;
  title?: string;
  type: 'DIRECT' | 'GROUP' | 'SUPPORT';
  isActive: boolean;
  description?: string;
  avatar?: string;
  createdBy?: string;
  isArchived: boolean;
  lastMessageId?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  messages?: Message[];
  _count: {
    messages: number;
    members: number;
  };
}

export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface MessageListResponse {
  messages: Message[];
  pagination: {
    hasMore: boolean;
    before?: string;
    after?: string;
  };
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.EXPO_PUBLIC_API_URL}/api`,
  credentials: 'include',
  prepareHeaders: async (headers) => {
    const sessionCookie = await AsyncStorage.getItem('sessionCookie');
    if (sessionCookie) {
      headers.set('Cookie', `connect.sid=${sessionCookie}`);
    }
    return headers;
  },
});

export const messagingApi = createApi({
  reducerPath: 'messagingApi',
  baseQuery,
  tagTypes: ['Conversation', 'Message'],
  endpoints: (builder) => ({
    // Conversations
    getConversations: builder.query<
      ConversationListResponse,
      {
        type?: 'DIRECT' | 'GROUP' | 'SUPPORT';
        isArchived?: boolean;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: '/conversations',
        params,
      }),
      providesTags: ['Conversation'],
    }),

    getConversation: builder.query<Conversation, string>({
      query: (id) => `/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Conversation', id }],
    }),

    createConversation: builder.mutation<
      Conversation,
      {
        title?: string;
        type: 'DIRECT' | 'GROUP' | 'SUPPORT';
        description?: string;
        memberIds: string[];
      }
    >({
      query: (data) => ({
        url: '/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),

    updateConversation: builder.mutation<
      Conversation,
      {
        id: string;
        title?: string;
        description?: string;
        avatar?: string;
        isArchived?: boolean;
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/conversations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Conversation', id },
      ],
    }),

    // Messages
    getMessages: builder.query<
      MessageListResponse,
      {
        conversationId: string;
        before?: string;
        after?: string;
        limit?: number;
        type?: string;
        search?: string;
      }
    >({
      query: (params) => ({
        url: '/messages',
        params,
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
      ],
    }),

    sendMessage: builder.mutation<
      Message,
      {
        conversationId: string;
        content?: string;
        type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VOICE' | 'VIDEO';
        replyToId?: string;
        metadata?: any;
      }
    >({
      query: (data) => ({
        url: '/messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        'Conversation',
      ],
    }),

    updateMessage: builder.mutation<
      Message,
      {
        id: string;
        content?: string;
        metadata?: any;
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/messages/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Message', id }],
    }),

    deleteMessage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/messages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Message'],
    }),

    markMessageAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/messages/${id}/read`,
        method: 'PUT',
      }),
    }),

    // Reactions
    addReaction: builder.mutation<
      void,
      {
        messageId: string;
        emoji: string;
      }
    >({
      query: (data) => ({
        url: '/messages/reactions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Message'],
    }),

    removeReaction: builder.mutation<
      void,
      {
        messageId: string;
        emoji: string;
      }
    >({
      query: ({ messageId, emoji }) => ({
        url: `/messages/${messageId}/reactions/${emoji}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Message'],
    }),

    // Members
    addMember: builder.mutation<
      void,
      {
        conversationId: string;
        userId: string;
        isAdmin?: boolean;
      }
    >({
      query: (data) => ({
        url: '/conversations/members',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Conversation'],
    }),

    removeMember: builder.mutation<
      void,
      {
        conversationId: string;
        userId: string;
      }
    >({
      query: ({ conversationId, userId }) => ({
        url: `/conversations/${conversationId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Conversation'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useMarkMessageAsReadMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
} = messagingApi;
