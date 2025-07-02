import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Conversation } from '@/store/api/messagingApi';

interface TypingIndicatorProps {
  users: string[];
  conversation: Conversation;
}

export default function TypingIndicator({
  users,
  conversation,
}: TypingIndicatorProps) {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      const duration = 600;
      const delay = 200;

      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);

      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay * 2);
    };

    const interval = setInterval(animate, 1800);
    animate(); // Start immediately

    return () => clearInterval(interval);
  }, []);

  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      const user = conversation.members.find((m) => m.userId === users[0]);
      return `${user?.user.firstName || 'Someone'} is typing`;
    } else if (users.length === 2) {
      const user1 = conversation.members.find((m) => m.userId === users[0]);
      const user2 = conversation.members.find((m) => m.userId === users[1]);
      return `${user1?.user.firstName || 'Someone'} and ${
        user2?.user.firstName || 'someone'
      } are typing`;
    } else {
      return `${users.length} people are typing`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{getTypingText()}</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 8,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 1,
  },
});
