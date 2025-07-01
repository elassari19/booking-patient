import { View, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function BookingsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E3F2FD', dark: '#1E88E5' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#1976D2"
          name="calendar"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Bookings</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedText>Your upcoming appointments will appear here.</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#1976D2',
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
