import { View, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function MessagesScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F3E5F5', dark: '#8E24AA' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#9C27B0"
          name="message.fill"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Messages</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedText>Your conversations will appear here.</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#9C27B0',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    gap: 8,
    marginBottom: 8,
  },
});
