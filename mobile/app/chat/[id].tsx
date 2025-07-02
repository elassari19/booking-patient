import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  useGetConversationQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  Message,
  MessageReaction,
} from '@/store/api/messagingApi';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { socketService } = useSocket();
  const conversationId = id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // API hooks
  const { data: conversation, isLoading: conversationLoading } =
    useGetConversationQuery(conversationId);
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery({
    conversationId,
    limit: 50,
  });
  const [sendMessage, { isLoading: sendingMessage }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessageAsReadMutation();
  const [addReaction] = useAddReactionMutation();
  const [removeReaction] = useRemoveReactionMutation();

  // Initialize messages
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages.reverse()); // Reverse to show oldest first
    }
  }, [messagesData]);

  // Join conversation room
  useEffect(() => {
    if (socketService && conversationId) {
      socketService.joinConversation(conversationId);
      return () => {
        socketService.leaveConversation(conversationId);
      };
    }
  }, [socketService, conversationId]);

  // Socket event handlers
  useEffect(() => {
    if (!socketService) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if not sent by current user
        if (message.senderId !== user?.id) {
          markAsRead(message.id);
        }

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    const handleMessageUpdate = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    };

    const handleMessageDelete = (data: {
      messageId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, isDeleted: true, content: undefined }
              : m
          )
        );
      }
    };

    const handleReactionAdded = (data: {
      messageId: string;
      reaction: MessageReaction;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                reactions: [...m.reactions, data.reaction],
                _count: { ...m._count, reactions: m._count.reactions + 1 },
              }
            : m
        )
      );
    };

    const handleReactionRemoved = (data: {
      messageId: string;
      reactionId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? {
                ...m,
                reactions: m.reactions.filter((r) => r.id !== data.reactionId),
                _count: {
                  ...m._count,
                  reactions: Math.max(0, m._count.reactions - 1),
                },
              }
            : m
        )
      );
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

    socketService.on('message:sent', handleNewMessage);
    socketService.on('message:updated', handleMessageUpdate);
    socketService.on('message:deleted', handleMessageDelete);
    socketService.on('message:reaction_added', handleReactionAdded);
    socketService.on('message:reaction_removed', handleReactionRemoved);
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);

    return () => {
      socketService.off('message:sent', handleNewMessage);
      socketService.off('message:updated', handleMessageUpdate);
      socketService.off('message:deleted', handleMessageDelete);
      socketService.off('message:reaction_added', handleReactionAdded);
      socketService.off('message:reaction_removed', handleReactionRemoved);
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
    };
  }, [socketService, conversationId, user?.id, markAsRead]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMessage) return;

    const text = messageText.trim();
    setMessageText('');

    // Stop typing
    if (isTyping) {
      handleStopTyping();
    }

    try {
      await sendMessage({
        conversationId,
        content: text,
        type: 'TEXT',
        replyToId: replyToMessage?.id,
      }).unwrap();

      setReplyToMessage(null);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setMessageText(text); // Restore text on error
    }
  };

  const handleStartTyping = () => {
    if (!isTyping && socketService) {
      setIsTyping(true);
      socketService.startTyping(conversationId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    }
  };

  const handleStopTyping = () => {
    if (isTyping && socketService) {
      setIsTyping(false);
      socketService.stopTyping(conversationId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.isDeleted) return;

    setSelectedMessageId(message.id);
    setReactionModalVisible(true);
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessageId) return;

    try {
      const message = messages.find((m) => m.id === selectedMessageId);
      if (!message) return;

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        (r) => r.userId === user?.id && r.emoji === emoji
      );

      if (existingReaction) {
        await removeReaction({ messageId: selectedMessageId, emoji }).unwrap();
      } else {
        await addReaction({ messageId: selectedMessageId, emoji }).unwrap();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add reaction');
    } finally {
      setReactionModalVisible(false);
      setSelectedMessageId(null);
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Chat';

    if (conversation.title) {
      return conversation.title;
    }

    if (conversation.type === 'DIRECT') {
      const otherMember = conversation.members.find(
        (member) => member.userId !== user?.id
      );
      if (otherMember) {
        return `${otherMember.user.firstName} ${otherMember.user.lastName}`;
      }
    }

    return 'Chat';
  };

  const renderMessage = ({
    item: message,
    index,
  }: {
    item: Message;
    index: number;
  }) => {
    const isOwnMessage = message.senderId === user?.id;
    const showAvatar =
      !isOwnMessage &&
      (index === messages.length - 1 ||
        messages[index + 1]?.senderId !== message.senderId);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            <View style={styles.messageAvatar}>
              <Text style={styles.avatarText}>
                {message.sender.firstName.charAt(0)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
          onLongPress={() => handleLongPressMessage(message)}
          onPress={() => {
            if (!message.isDeleted) {
              handleReplyToMessage(message);
            }
          }}
        >
          {message.replyTo && (
            <View style={styles.replyContainer}>
              <View style={styles.replyBar} />
              <View style={styles.replyContent}>
                <Text style={styles.replyAuthor}>
                  {message.replyTo.sender.firstName}
                </Text>
                <Text style={styles.replyText} numberOfLines={1}>
                  {message.replyTo.isDeleted
                    ? 'Message deleted'
                    : message.replyTo.content}
                </Text>
              </View>
            </View>
          )}

          {message.isDeleted ? (
            <Text style={styles.deletedMessage}>This message was deleted</Text>
          ) : (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {message.content}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatTime(message.createdAt)}
            </Text>
            {message.isEdited && (
              <Text style={styles.editedIndicator}>edited</Text>
            )}
          </View>

          {message.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(
                message.reactions.reduce((acc, reaction) => {
                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBubble}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (conversationLoading || messagesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#9C27B0" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getConversationTitle()}</Text>
          {typingUsers.length > 0 && (
            <Text style={styles.typingIndicator}>
              {typingUsers.length === 1
                ? 'Typing...'
                : `${typingUsers.length} people typing...`}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name="ellipsis" size={24} color="#9C27B0" />
        </TouchableOpacity>
      </View>

      {replyToMessage && (
        <View style={styles.replyPreview}>
          <View style={styles.replyPreviewBar} />
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyPreviewAuthor}>
              Replying to {replyToMessage.sender.firstName}
            </Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              {replyToMessage.content}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cancelReplyButton}
            onPress={() => setReplyToMessage(null)}
          >
            <IconSymbol name="xmark" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              if (text.length > 0 && !isTyping) {
                handleStartTyping();
              } else if (text.length === 0 && isTyping) {
                handleStopTyping();
              }
            }}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={4000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sendingMessage) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Reaction Modal */}
      <Modal
        visible={reactionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setReactionModalVisible(false)}
        >
          <View style={styles.reactionModal}>
            <Text style={styles.reactionModalTitle}>Add Reaction</Text>
            <View style={styles.emojiContainer}>
              {EMOJI_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiButton}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#9C27B0',
    marginTop: 2,
  },
  menuButton: {
    marginLeft: 12,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  replyPreviewBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#9C27B0',
    marginRight: 12,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C27B0',
  },
  replyPreviewText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelReplyButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: screenWidth * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    position: 'relative',
  },
  ownMessageBubble: {
    backgroundColor: '#9C27B0',
    alignSelf: 'flex-end',
  },
  otherMessageBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    opacity: 0.8,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderRadius: 2,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  deletedMessage: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#999',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#999',
  },
  editedIndicator: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#999',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#9C27B0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 32,
    alignItems: 'center',
  },
  reactionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emojiContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  emojiText: {
    fontSize: 24,
  },
});
