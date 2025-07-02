import React, { useState, useRef } from 'react';
import {
  View,
  Text, // Add this import
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define a more specific type for attachments
interface AttachmentData {
  uri: string;
  url?: string;
  type?: string;
  mimeType?: string;
  name: string;
  fileName?: string;
  size?: number;
  fileSize?: number;
}

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (
    content: string,
    type?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VOICE',
    attachments?: AttachmentData[]
  ) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording>();
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim());
    }
  };

  const handleAttachmentPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Camera', 'Photo Library', 'Document'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              openCamera();
              break;
            case 2:
              openImagePicker();
              break;
            case 3:
              openDocumentPicker();
              break;
          }
        }
      );
    } else {
      // Android implementation would use a custom modal
      Alert.alert('Add Attachment', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImagePicker },
        { text: 'Document', onPress: openDocumentPicker },
      ]);
    }
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Camera permission is required to take photos'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onSend('', 'IMAGE', [
          {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: `image_${Date.now()}.jpg`,
            size: asset.fileSize || 0,
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openImagePicker = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Photo library permission is required to select images'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onSend('', 'IMAGE', [
          {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `image_${Date.now()}.jpg`,
            size: asset.fileSize || 0,
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onSend('', 'DOCUMENT', [
          {
            uri: asset.uri,
            type: asset.mimeType || 'application/octet-stream',
            name: asset.name,
            size: asset.size || 0,
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Microphone permission is required to record voice messages'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      if (uri) {
        onSend('', 'VOICE', [
          {
            uri,
            type: 'audio/m4a',
            name: `voice_${Date.now()}.m4a`,
          },
        ]);
      }

      setRecording(undefined);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={handleAttachmentPress}
          disabled={disabled}
        >
          <IconSymbol name="paperclip" size={24} color="#666" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          maxLength={4000}
          editable={!disabled}
          textAlignVertical="center"
        />

        {value.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={disabled}
          >
            <IconSymbol name="arrow.up" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording,
            ]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={disabled}
          >
            <IconSymbol
              name={isRecording ? 'stop.fill' : 'mic.fill'}
              size={20}
              color={isRecording ? '#ff3b30' : '#666'}
            />
          </TouchableOpacity>
        )}
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <IconSymbol name="waveform" size={16} color="#ff3b30" />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 6,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 6,
  },
  voiceButtonRecording: {
    backgroundColor: '#ffebee',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffebee',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#ff3b30',
    marginLeft: 8,
  },
});
