import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Reaction {
  id: string;
  emoji: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onPress?: (emoji: string) => void;
  isFromCurrentUser: boolean;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onPress,
  isFromCurrentUser,
}) => {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        isFromCurrentUser ? styles.sentReactions : styles.receivedReactions,
      ]}
    >
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => (
        <TouchableOpacity
          key={emoji}
          style={styles.reactionBubble}
          onPress={() => onPress?.(emoji)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          {emojiReactions.length > 1 && (
            <Text style={styles.count}>{emojiReactions.length}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  sentReactions: {
    justifyContent: 'flex-end',
  },
  receivedReactions: {
    justifyContent: 'flex-start',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
