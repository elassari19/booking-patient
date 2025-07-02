import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onReaction: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '👍',
  '👎',
  '❤️',
  '😂',
  '😮',
  '😢',
  '😡',
  '🎉',
  '👏',
  '🔥',
  '💯',
  '⭐',
  '✅',
  '❌',
  '❓',
  '💡',
];

export default function ReactionPicker({
  visible,
  onClose,
  onReaction,
}: ReactionPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.picker}>
          <Text style={styles.title}>Add Reaction</Text>
          <View style={styles.emojiGrid}>
            {COMMON_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => onReaction(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  emojiButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  emoji: {
    fontSize: 24,
  },
});
