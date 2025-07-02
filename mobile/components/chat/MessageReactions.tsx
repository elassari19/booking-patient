import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageReaction } from '@/store/api/messagingApi';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReactionPress: (emoji: string) => void;
}

export default function MessageReactions({
  reactions,
  onReactionPress,
}: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  return (
    <View style={styles.container}>
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <TouchableOpacity
          key={emoji}
          style={styles.reactionBubble}
          onPress={() => onReactionPress(emoji)}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.count}>{reactionList.length}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginLeft: 16,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 123, 255, 0.2)',
  },
  emoji: {
    fontSize: 14,
    marginRight: 4,
  },
  count: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
});
