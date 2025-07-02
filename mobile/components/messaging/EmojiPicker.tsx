import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EMOJI_CATEGORIES = [
  {
    name: 'Frequently Used',
    emojis: ['👍', '❤️', '😂', '😮', '😢', '😡'],
  },
  {
    name: 'Smileys & People',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😝',
      '😜',
      '🤪',
      '🤨',
      '🧐',
      '🤓',
      '😎',
      '🤩',
      '🥳',
    ],
  },
  {
    name: 'Hearts',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
    ],
  },
  {
    name: 'Gestures',
    emojis: [
      '👍',
      '👎',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👏',
      '🙌',
      '🤲',
      '🤝',
      '🙏',
    ],
  },
];

interface EmojiPickerProps {
  visible: boolean;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onSelectEmoji,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState(0);

  const renderEmoji = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiButton}
      onPress={() => {
        onSelectEmoji(item);
        onClose();
      }}
    >
      <Text style={styles.emoji}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCategoryTab = (
    category: (typeof EMOJI_CATEGORIES)[0],
    index: number
  ) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.categoryTab,
        selectedCategory === index && styles.activeCategoryTab,
      ]}
      onPress={() => setSelectedCategory(index)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === index && styles.activeCategoryText,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} />

        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Reaction</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <IconSymbol name="xmark" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryTabs}>
            {EMOJI_CATEGORIES.map(renderCategoryTab)}
          </View>

          <FlatList
            data={EMOJI_CATEGORIES[selectedCategory].emojis}
            renderItem={renderEmoji}
            keyExtractor={(item) => item}
            numColumns={8}
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeCategoryTab: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#fff',
  },
  emojiGrid: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emojiButton: {
    width: SCREEN_WIDTH / 8 - 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 8,
  },
  emoji: {
    fontSize: 24,
  },
});
