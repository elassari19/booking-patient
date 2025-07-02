import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';
import { MessageInput } from '@/components/messaging/MessageInput';
import { EmojiPicker } from '@/components/messaging/EmojiPicker';
import {
  useGetConversationQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  Message,
} from '@/store/api/messagingApi';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { socketService, isConnected } = useSocket();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // API hooks
  const {
    data: conversation,
    isLoading: isLoadingConversation,
    error: conversationError,
  } = useGetConversationQuery(conversationId!);

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetMessagesQuery({
    conversationId: conversationId!,
    limit: 50,
  });

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessageAsReadMutation();

  // Initialize messages
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages.reverse()); // Reverse to show newest at bottom
    }
  }, [messagesData]);

  // Socket event handlers
  useEffect(() => {
    if (!socketService || !conversationId) return;

    // Join conversation room
    socketService.joinConversation(conversationId);

    // Message events
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Mark as read if not from current user
        if (message.senderId !== user?.id) {
          markAsRead(message.id);
        }

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    const handleMessageUpdated = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        )
      );
    };

    const handleReactionAdded = ({ messageId, reaction }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...(m.reactions || []), reaction] }
            : m
        )
      );
    };

    const handleReactionRemoved = ({ messageId, reactionId }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: (m.reactions || []).filter(
                  (r) => r.id !== reactionId
                ),
              }
            : m
        )
      );
    };

    const handleTypingStart = ({ userId }: { userId: string }) => {
      if (userId !== user?.id) {
        setTypingUsers((prev) =>
          prev.includes(userId) ? prev : [...prev, userId]
        );
      }
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    // Register event listeners
    socketService.on('message:sent', handleNewMessage);
    socketService.on('message:updated', handleMessageUpdated);
    socketService.on('message:deleted', handleMessageDeleted);
    socketService.on('message:reaction_added', handleReactionAdded);
    socketService.on('message:reaction_removed', handleReactionRemoved);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);

    return () => {
      // Cleanup
      socketService.off('message:sent', handleNewMessage);
      socketService.off('message:updated', handleMessageUpdated);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('message:reaction_added', handleReactionAdded);
      socketService.off('message:reaction_removed', handleReactionRemoved);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);

      socketService.leaveConversation(conversationId);
    };
  }, [socketService, conversationId, user?.id, markAsRead]);

  // Handle typing indicators
  const handleTyping = useCallback(
    (text: string) => {
      setMessageText(text);

      if (text.length > 0) {
        socketService?.startTyping(conversationId!);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
          socketService?.stopTyping(conversationId!);
        }, 1000);
      } else {
        socketService?.stopTyping(conversationId!);
      }
    },
    [socketService, conversationId]
  );

  const handleSendMessage = async (
    content: string,
    type: Message['type'] = 'TEXT',
    attachments?: any[]
  ) => {
    if (!content.trim() && type === 'TEXT') return;

    try {
      if (editingMessage) {
        // Handle edit message
        // TODO: Implement edit functionality
        setEditingMessage(null);
      } else {
        // Send new message
        await sendMessage({
          conversationId: conversationId!,
          content: content.trim(),
          type,
          replyToId: replyingTo?.id,
          metadata: attachments ? { attachments } : undefined,
        }).unwrap();
      }

      setMessageText('');
      setReplyingTo(null);
      socketService?.stopTyping(conversationId!);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    // Show action sheet or context menu
    Alert.alert('Message Actions', '', [
      { text: 'Reply', onPress: () => setReplyingTo(message) },
      { text: 'React', onPress: () => setShowEmojiPicker(true) },
      ...(message.senderId === user?.id
        ? [
            { text: 'Edit', onPress: () => setEditingMessage(message) },
            {
              text: 'Delete',
              onPress: () => handleDeleteMessage(message),
              style: 'destructive' as const,
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleDeleteMessage = (message: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement delete message API
              console.log('Delete message:', message.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (selectedMessage) {
      try {
        // TODO: Implement add reaction API
        console.log('Add reaction:', emoji, 'to message:', selectedMessage.id);
      } catch (error) {
        Alert.alert('Error', 'Failed to add reaction');
      }
    }
    setShowEmojiPicker(false);
    setSelectedMessage(null);
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !messagesData?.pagination?.hasMore) return;

    setIsLoadingMore(true);
    try {
      // TODO: Implement pagination
      console.log('Load more messages');
    } catch (error) {
      console.error('Load more messages error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFromCurrentUser = item.senderId === user?.id;
    const showSender =
      !isFromCurrentUser &&
      (index === 0 || messages[index - 1]?.senderId !== item.senderId);
    const showTimestamp =
      index === messages.length - 1 ||
      new Date(messages[index + 1]?.createdAt).getTime() -
        new Date(item.createdAt).getTime() >
        300000; // 5 minutes

    return (
      <MessageBubble
        message={item}
        isFromCurrentUser={isFromCurrentUser}
        showSender={showSender}
        showTimestamp={showTimestamp}
        onLongPress={() => handleLongPress(item)}
        onReactionPress={(emoji) => handleEmojiSelect(emoji)}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return <TypingIndicator userIds={typingUsers} />;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <IconSymbol name="chevron.left" size={24} color="#000" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          {conversation?.title || 'Chat'}
        </ThemedText>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' },
            ]}
          />
          <ThemedText style={styles.connectionText}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => router.push(`../messages/${conversationId}/info`)}
      >
        <IconSymbol name="info.circle" size={24} color="#9C27B0" />
      </TouchableOpacity>
    </View>
  );

  if (isLoadingConversation || isLoadingMessages) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <ThemedText style={styles.loadingText}>
            Loading conversation...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (conversationError || messagesError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Failed to load conversation
          </ThemedText>
          <TouchableOpacity
            onPress={refetchMessages}
            style={styles.retryButton}
          >
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color="#9C27B0"
                style={styles.loadMoreIndicator}
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />

        {renderTypingIndicator()}

        <MessageInput
          value={messageText}
          onChangeText={handleTyping}
          onSend={handleSendMessage}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
      </KeyboardAvoidingView>

      {showEmojiPicker && (
        <EmojiPicker
          visible={showEmojiPicker}
          onSelectEmoji={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    color: '#000',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadMoreIndicator: {
    paddingVertical: 16,
  },
});
