import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { Message } from '@/store/api/messagingApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

interface MessageBubbleProps {
  message: Message;
  isFromCurrentUser: boolean; // Changed from isOwnMessage
  showSender?: boolean;
  showTimestamp?: boolean;
  onLongPress?: () => void;
  onReplyPress?: () => void;
  onReactionPress?: (emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFromCurrentUser, // Changed from isOwnMessage
  showSender = false,
  showTimestamp = false,
  onLongPress,
  onReplyPress,
  onReactionPress,
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'SENT':
        return <IconSymbol name="checkmark" size={14} color="#9E9E9E" />;
      case 'DELIVERED':
        return <IconSymbol name="checkmark.circle" size={14} color="#9E9E9E" />;
      case 'READ':
        return (
          <IconSymbol name="checkmark.circle.fill" size={14} color="#4CAF50" />
        );
      default:
        return null;
    }
  };

  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyBar} />
        <View style={styles.replyContent}>
          <ThemedText style={styles.replyAuthor}>
            {message.replyTo.sender.firstName} {message.replyTo.sender.lastName}
          </ThemedText>
          <ThemedText style={styles.replyText} numberOfLines={2}>
            {message.replyTo.content || 'Media message'}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        {message.attachments.map((attachment) => (
          <View key={attachment.id} style={styles.attachment}>
            {attachment.mimeType.startsWith('image/') ? (
              <Image
                source={{ uri: attachment.url }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.documentAttachment}>
                <IconSymbol name="doc.fill" size={24} color="#9C27B0" />
                <ThemedText style={styles.attachmentName} numberOfLines={1}>
                  {attachment.fileName}
                </ThemedText>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>);

    return (
      <View
        style={[
          styles.reactionsContainer,
          isFromCurrentUser ? styles.reactionsRight : styles.reactionsLeft,
        ]}
      >
        {Object.entries(groupedReactions).map(([emoji, reactions]) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionBubble}
            onPress={() => setShowReactions(!showReactions)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <ThemedText style={styles.reactionCount}>
              {reactions.length}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <View style={styles.deletedMessage}>
          <IconSymbol name="trash" size={16} color="#9E9E9E" />
          <ThemedText style={styles.deletedText}>
            This message was deleted
          </ThemedText>
        </View>
      );
    }

    return (
      <>
        {renderReplyTo()}
        {renderAttachments()}
        {message.content && (
          <ThemedText
            style={[
              styles.messageText,
              isFromCurrentUser
                ? styles.ownMessageText
                : styles.otherMessageText,
            ]}
          >
            {message.content}
          </ThemedText>
        )}
        {message.isEdited && (
          <ThemedText style={styles.editedLabel}>(edited)</ThemedText>
        )}
      </>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isFromCurrentUser // Changed from isOwnMessage
          ? styles.ownMessageContainer
          : styles.otherMessageContainer,
      ]}
    >
      {showSender &&
        !isFromCurrentUser && ( // Changed from isOwnMessage
          <ThemedText style={styles.senderName}>
            {message.sender.firstName} {message.sender.lastName}
          </ThemedText>
        )}

      <TouchableOpacity
        style={[
          styles.messageBubble,
          isFromCurrentUser ? styles.ownMessage : styles.otherMessage, // Changed from isOwnMessage
        ]}
        onLongPress={onLongPress}
        delayLongPress={500}
      >
        {renderContent()}

        <View
          style={[
            styles.messageFooter,
            isFromCurrentUser
              ? styles.ownMessageFooter
              : styles.otherMessageFooter, // Changed from isOwnMessage
          ]}
        >
          <ThemedText
            style={[
              styles.timestamp,
              isFromCurrentUser ? styles.ownTimestamp : styles.otherTimestamp, // Changed from isOwnMessage
            ]}
          >
            {formatTime(message.createdAt)}
          </ThemedText>
          {isFromCurrentUser && ( // Changed from isOwnMessage
            <View style={styles.statusContainer}>{getStatusIcon()}</View>
          )}
        </View>
      </TouchableOpacity>

      {renderReactions()}

      {/* Quick action buttons */}
      <TouchableOpacity
        style={[
          styles.replyButton,
          isFromCurrentUser ? styles.replyButtonRight : styles.replyButtonLeft, // Changed from isOwnMessage
        ]}
        onPress={onReplyPress}
      >
        <IconSymbol name="arrowshape.turn.up.left" size={16} color="#9C27B0" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 16,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: '100%',
    position: 'relative',
  },
  ownMessage: {
    backgroundColor: '#9C27B0',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ownMessageFooter: {
    justifyContent: 'flex-end',
  },
  otherMessageFooter: {
    justifyContent: 'flex-start',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#9E9E9E',
  },
  statusContainer: {
    marginLeft: 4,
  },
  deletedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  deletedText: {
    fontStyle: 'italic',
    marginLeft: 4,
    color: '#9E9E9E',
  },
  editedLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#9C27B0',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  attachment: {
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  attachmentName: {
    marginLeft: 8,
    color: '#9C27B0',
    fontSize: 14,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reactionsLeft: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  reactionsRight: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: '#666',
  },
  replyButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    opacity: 0.8,
  },
  replyButtonLeft: {
    right: -12,
  },
  replyButtonRight: {
    left: -12,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  sentContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageCaption: {
    marginTop: 8,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  documentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentSize: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 150,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waveform: {
    flex: 1,
    justifyContent: 'center',
  },
  voiceDuration: {
    fontSize: 12,
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginRight: 6,
  },
  sentEditedText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedEditedText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 'auto',
  },
  sentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTimestamp: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  timestampSeparator: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
});
