import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  useGetConversationsQuery,
  Conversation,
} from '@/store/api/messagingApi';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, socketService } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useGetConversationsQuery({
    search: searchQuery,
    limit: 50,
  });

  // Initialize conversations
  useEffect(() => {
    if (conversationsData?.conversations) {
      setConversations(conversationsData.conversations);
    }
  }, [conversationsData]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socketService || !user?.id) return;

    const handleNewMessage = (message: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessageAt: message.createdAt,
                lastMessageId: message.id,
                messages: [message], // Store last message for display
              }
            : conv
        )
      );
    };

    const handleConversationCreated = (conversation: Conversation) => {
      setConversations((prev) => [conversation, ...prev]);
    };

    const handleConversationUpdated = (conversation: Conversation) => {
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversation.id ? conversation : conv))
      );
    };

    socketService.on('message:sent', handleNewMessage);
    socketService.on('conversation:created', handleConversationCreated);
    socketService.on('conversation:updated', handleConversationUpdated);

    return () => {
      socketService.off('message:sent', handleNewMessage);
      socketService.off('conversation:created', handleConversationCreated);
      socketService.off('conversation:updated', handleConversationUpdated);
    };
  }, [socketService, user?.id]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessage = (conversation: Conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[0];
      if (lastMessage.isDeleted) {
        return 'Message deleted';
      }
      if (lastMessage.type === 'TEXT') {
        return lastMessage.content || '';
      }
      return `${lastMessage.type.toLowerCase()} message`;
    }
    return 'No messages yet';
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) {
      return conversation.title;
    }

    if (conversation.type === 'DIRECT') {
      // Find the other user in direct conversation
      const otherMember = conversation.members.find(
        (member) => member.userId !== user?.id
      );
      if (otherMember) {
        return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
      }
    }

    return 'Conversation';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.avatar) {
      return conversation.avatar;
    }

    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(
        (member) => member.userId !== user?.id
      );
      return otherMember?.user.firstName?.charAt(0) || '?';
    }

    return conversation.title?.charAt(0) || 'G';
  };

  const isUnread = (conversation: Conversation) => {
    const currentUserMember = conversation.members.find(
      (member) => member.userId === user?.id
    );

    if (!currentUserMember || !conversation.lastMessageAt) {
      return false;
    }

    if (!currentUserMember.lastReadAt) {
      return true;
    }

    return (
      new Date(conversation.lastMessageAt) >
      new Date(currentUserMember.lastReadAt)
    );
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
  };

  const filteredConversations =
    filter === 'all'
      ? conversations
      : conversations.filter((conv) => isUnread(conv));

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        isUnread(item) && styles.unreadConversation,
      ]}
      onPress={() => router.push(`../chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        {typeof getConversationAvatar(item) === 'string' &&
        getConversationAvatar(item).startsWith('http') ? (
          <Image
            source={{ uri: getConversationAvatar(item) as string }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{getConversationAvatar(item)}</Text>
          </View>
        )}
        {isConnected && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text
            style={[
              styles.conversationTitle,
              isUnread(item) && styles.unreadTitle,
            ]}
          >
            {getConversationTitle(item)}
          </Text>
          <Text style={styles.timestamp}>
            {item.lastMessageAt && formatTime(item.lastMessageAt)}
          </Text>
        </View>

        <View style={styles.lastMessageContainer}>
          <Text
            style={[styles.lastMessage, isUnread(item) && styles.unreadMessage]}
            numberOfLines={1}
          >
            {getLastMessage(item)}
          </Text>
          {isUnread(item) && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="title">Messages</ThemedText>
          {!isConnected && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={() => router.push('../chat/new')}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilter,
            ]}
            onPress={() => handleFilterChange('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.activeFilterText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'unread' && styles.activeFilter,
            ]}
            onPress={() => handleFilterChange('unread')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'unread' && styles.activeFilterText,
              ]}
            >
              Unread
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={48}
            color="#FF5722"
          />
          <Text style={styles.errorText}>Failed to load conversations</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="message" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new conversation to begin messaging
          </Text>
          <TouchableOpacity
            style={styles.startChatButton}
            onPress={() => router.push('../chat/new')}
          >
            <Text style={styles.startChatText}>Start New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#9C27B0"
              colors={['#9C27B0']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offlineIndicator: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  newMessageButton: {
    backgroundColor: '#9C27B0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilter: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadConversation: {
    backgroundColor: '#F8F4FF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#333',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9C27B0',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5722',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  startChatButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  startChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
});
