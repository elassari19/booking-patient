import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachment: () => void;
  isSending: boolean;
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChangeText,
  onSend,
  onAttachment,
  isSending,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [inputHeight, setInputHeight] = useState(40);
  const sendButtonScale = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(sendButtonScale, {
      toValue: value.trim().length > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [value]);

  const handleContentSizeChange = (event: any) => {
    const { height } = event.nativeEvent.contentSize;
    const newHeight = Math.max(40, Math.min(120, height));
    setInputHeight(newHeight);
  };

  const handleSend = () => {
    if (value.trim().length > 0 && !isSending) {
      onSend();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={onAttachment}
        >
          <IconSymbol name="plus" size={24} color="#666" />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={[styles.textInput, { height: inputHeight }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          onContentSizeChange={handleContentSizeChange}
          scrollEnabled={inputHeight >= 120}
          maxLength={4000}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        {/* Send Button */}
        <Animated.View
          style={[
            styles.sendButtonContainer,
            {
              transform: [{ scale: sendButtonScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isSending || value.trim().length === 0}
          >
            {isSending ? (
              <IconSymbol name="clock" size={20} color="white" />
            ) : (
              <IconSymbol name="arrow.up" size={20} color="white" />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlignVertical: 'top',
    maxHeight: 120,
  },
  sendButtonContainer: {
    marginLeft: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});
