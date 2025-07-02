import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface MessageStatusProps {
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'SENT':
        return (
          <IconSymbol
            name="checkmark"
            size={12}
            color="rgba(255, 255, 255, 0.7)"
          />
        );
      case 'DELIVERED':
        return (
          <View style={styles.doubleCheck}>
            <IconSymbol
              name="checkmark"
              size={12}
              color="rgba(255, 255, 255, 0.7)"
            />
            <IconSymbol
              name="checkmark"
              size={12}
              color="rgba(255, 255, 255, 0.7)"
              style={styles.secondCheck}
            />
          </View>
        );
      case 'READ':
        return (
          <View style={styles.doubleCheck}>
            <IconSymbol name="checkmark" size={12} color="#4CAF50" />
            <IconSymbol
              name="checkmark"
              size={12}
              color="#4CAF50"
              style={styles.secondCheck}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{getStatusIcon()}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
  doubleCheck: {
    flexDirection: 'row',
    position: 'relative',
  },
  secondCheck: {
    position: 'absolute',
    left: 6,
  },
});
