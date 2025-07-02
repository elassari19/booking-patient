import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { MessageInput } from '@/components/messaging/MessageInput';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';
import { EmojiPicker } from '@/components/messaging/EmojiPicker';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  Message,
} from '@/store/api/messagingApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, socketService } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<
    string | null
  >(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // API hooks
  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useGetMessagesQuery({
    conversationId: conversationId!,
    limit: 50,
  });

  const [sendMessage] = useSendMessageMutation();
  const [markAsRead] = useMarkMessageAsReadMutation();

  // Initialize messages
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages.reverse()); // Reverse to show newest at bottom
      setHasMoreMessages(messagesData.pagination.hasMore);
    }
  }, [messagesData]);

  // Join conversation room
  useEffect(() => {
    if (conversationId && socketService) {
      socketService.joinConversation(conversationId);
      return () => {
        socketService.leaveConversation(conversationId);
      };
    }
  }, [conversationId, socketService]);

  // Socket event listeners
  useEffect(() => {
    if (!socketService) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);

        // Auto-scroll to bottom for new messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Mark as read if not from current user
        if (message.senderId !== user?.id) {
          markAsRead(message.id);
        }
      }
    };

    const handleMessageUpdated = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.id ? message : msg))
        );
      }
    };

    const handleMessageDeleted = (data: {
      messageId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      }
    };

    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    };

    const handleTypingStop = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    const handleReactionAdded = (data: {
      messageId: string;
      reaction: any;
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, reactions: [...(msg.reactions || []), data.reaction] }
            : msg
        )
      );
    };

    const handleReactionRemoved = (data: {
      messageId: string;
      reactionId: string;
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? {
                ...msg,
                reactions:
                  msg.reactions?.filter((r) => r.id !== data.reactionId) || [],
              }
            : msg
        )
      );
    };

    socketService.on('message:sent', handleNewMessage);
    socketService.on('message:updated', handleMessageUpdated);
    socketService.on('message:deleted', handleMessageDeleted);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);
    socketService.on('message:reaction_added', handleReactionAdded);
    socketService.on('message:reaction_removed', handleReactionRemoved);

    return () => {
      socketService.off('message:sent', handleNewMessage);
      socketService.off('message:updated', handleMessageUpdated);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
      socketService.off('message:reaction_added', handleReactionAdded);
      socketService.off('message:reaction_removed', handleReactionRemoved);
    };
  }, [conversationId, socketService, user?.id, markAsRead]);

  const handleSendMessage = async (
    content: string,
    type: Message['type'] = 'TEXT',
    attachments?: any[]
  ) => {
    if (!content.trim() && type === 'TEXT') return;

    try {
      await sendMessage({
        conversationId: conversationId!,
        content: content.trim(),
        type,
        metadata: attachments ? { attachments } : undefined,
      }).unwrap();

      setNewMessage('');

      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketService?.stopTyping(conversationId!);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketService?.startTyping(conversationId!);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socketService?.stopTyping(conversationId!);
      }
    }, 3000);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // This would need to be implemented in the API
      // await addReaction({ messageId, emoji }).unwrap();
      setShowEmojiPicker(false);
      setSelectedMessageForReaction(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      // Load more messages - would need pagination
      // const oldestMessage = messages[0];
      // const result = await refetch({ before: oldestMessage.createdAt }).unwrap();
      // setMessages(prev => [...result.messages.reverse(), ...prev]);
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFromCurrentUser = item.senderId === user?.id;
    const showSender =
      index === 0 || messages[index - 1].senderId !== item.senderId;
    const showTimestamp =
      index === messages.length - 1 ||
      new Date(messages[index + 1].createdAt).getTime() -
        new Date(item.createdAt).getTime() >
        300000; // 5 minutes

    return (
      <MessageBubble
        message={item}
        isFromCurrentUser={isFromCurrentUser}
        showSender={showSender}
        showTimestamp={showTimestamp}
        onLongPress={() => {
          setSelectedMessageForReaction(item.id);
          setShowEmojiPicker(true);
        }}
        onReactionPress={(emoji) => handleReaction(item.id, emoji)}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <IconSymbol name="chevron.left" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <ThemedText style={styles.headerTitle}>Chat</ThemedText>
        <Text style={styles.connectionStatus}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </Text>
      </View>

      <TouchableOpacity style={styles.headerAction}>
        <IconSymbol name="phone" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
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
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
          ListFooterComponent={
            typingUsers.length > 0 ? (
              <TypingIndicator userIds={typingUsers} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />

        <MessageInput
          value={newMessage}
          onChangeText={handleTyping}
          onSend={handleSendMessage}
          placeholder="Type a message..."
          disabled={!isConnected}
        />

        {showEmojiPicker && (
          <EmojiPicker
            visible={showEmojiPicker}
            onSelectEmoji={(emoji) => {
              if (selectedMessageForReaction) {
                handleReaction(selectedMessageForReaction, emoji);
              }
            }}
            onClose={() => {
              setShowEmojiPicker(false);
              setSelectedMessageForReaction(null);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
