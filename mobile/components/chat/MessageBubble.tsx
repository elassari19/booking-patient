import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Message } from '@/store/api/messagingApi';
import MessageReactions from './MessageReactions';
import ReactionPicker from './ReactionPicker';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isConsecutive: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  isConsecutive,
  onReaction,
  onReply,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  const handleReactionPress = () => {
    setShowReactionPicker(true);
    setShowActions(false);
  };

  const handleReplyPress = () => {
    onReply(message);
    setShowActions(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'TEXT':
        return (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.content}
          </Text>
        );

      case 'IMAGE':
        return (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: message.metadata?.fileUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text
                style={[
                  styles.messageText,
                  styles.imageCaption,
                  isOwnMessage
                    ? styles.ownMessageText
                    : styles.otherMessageText,
                ]}
              >
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'DOCUMENT':
        return (
          <TouchableOpacity style={styles.documentContainer}>
            <IconSymbol name="doc.fill" size={32} color="#666" />
            <View style={styles.documentInfo}>
              <Text
                style={[
                  styles.documentName,
                  isOwnMessage
                    ? styles.ownMessageText
                    : styles.otherMessageText,
                ]}
              >
                {message.metadata?.fileName || 'Document'}
              </Text>
              <Text style={styles.documentSize}>
                {message.metadata?.fileSize
                  ? `${(message.metadata.fileSize / 1024).toFixed(1)} KB`
                  : ''}
              </Text>
            </View>
            <IconSymbol name="arrow.down.circle" size={24} color="#666" />
          </TouchableOpacity>
        );

      default:
        return (
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            Unsupported message type
          </Text>
        );
    }
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <View style={styles.replyToContainer}>
        <View style={styles.replyToLine} />
        <View style={styles.replyToContent}>
          <Text style={styles.replyToSender}>
            {message.replyTo.sender.firstName}
          </Text>
          <Text style={styles.replyToText} numberOfLines={1}>
            {message.replyTo.content || 'Attachment'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      {/* Show sender name for group chats and if not consecutive */}
      {!isOwnMessage && !isConsecutive && (
        <Text style={styles.senderName}>
          {message.sender.firstName} {message.sender.lastName}
        </Text>
      )}

      <TouchableWithoutFeedback
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <View
          style={[
            styles.bubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isConsecutive && styles.consecutiveBubble,
          ]}
        >
          {renderReplyTo()}
          {renderMessageContent()}

          {/* Message status and time */}
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>
              {formatTime(message.createdAt)}
            </Text>
            {isOwnMessage && (
              <View style={styles.statusContainer}>
                {message.status === 'SENT' && (
                  <IconSymbol name="checkmark" size={12} color="#666" />
                )}
                {message.status === 'DELIVERED' && (
                  <IconSymbol name="checkmark" size={12} color="#666" />
                )}
                {message.status === 'READ' && (
                  <IconSymbol name="checkmark" size={12} color="#007bff" />
                )}
              </View>
            )}
          </View>

          {/* Edited indicator */}
          {message.isEdited && <Text style={styles.editedText}>edited</Text>}
        </View>
      </TouchableWithoutFeedback>

      {/* Message reactions */}
      {message.reactions.length > 0 && (
        <MessageReactions
          reactions={message.reactions}
          onReactionPress={(emoji) => onReaction(message.id, emoji)}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <Pressable
          style={styles.actionModalOverlay}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionModal}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReactionPress}
            >
              <IconSymbol name="heart" size={20} color="#666" />
              <Text style={styles.actionText}>React</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReplyPress}
            >
              <IconSymbol
                name="arrowshape.turn.up.left"
                size={20}
                color="#666"
              />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>

            {isOwnMessage && (
              <>
                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="pencil" size={20} color="#666" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol name="trash" size={20} color="#dc3545" />
                  <Text style={[styles.actionText, { color: '#dc3545' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Reaction Picker */}
      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onReaction={(emoji) => {
          onReaction(message.id, emoji);
          setShowReactionPicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  ownContainer: {
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 16,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  consecutiveBubble: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  imageContainer: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  imageCaption: {
    marginTop: 8,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    minWidth: 200,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  replyToContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyToLine: {
    width: 3,
    backgroundColor: '#007bff',
    borderRadius: 2,
    marginRight: 8,
  },
  replyToContent: {
    flex: 1,
  },
  replyToSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 2,
  },
  replyToText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  statusContainer: {
    marginLeft: 4,
  },
  editedText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
