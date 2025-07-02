import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TypingIndicatorProps {
  userIds: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userIds,
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ]);

    animation.start();

    return () => animation.stop();
  }, []);

  if (userIds.length === 0) return null;

  const getTypingText = () => {
    if (userIds.length === 1) {
      return 'Someone is typing';
    } else if (userIds.length === 2) {
      return '2 people are typing';
    } else {
      return 'Several people are typing';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot1, transform: [{ scale: dot1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot2, transform: [{ scale: dot2 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { opacity: dot3, transform: [{ scale: dot3 }] },
            ]}
          />
        </View>
      </View>
      <Text style={styles.typingText}>{getTypingText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bubble: {
    backgroundColor: '#e9ecef',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 12,
  },
});
