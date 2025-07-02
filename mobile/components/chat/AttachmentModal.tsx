import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface AttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  onImagePicker: () => void;
  onDocumentPicker: () => void;
  onCamera: () => void;
}

export default function AttachmentModal({
  visible,
  onClose,
  onImagePicker,
  onDocumentPicker,
  onCamera,
}: AttachmentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal}>
          <View style={styles.handle} />

          <Text style={styles.title}>Share</Text>

          <View style={styles.options}>
            <TouchableOpacity style={styles.option} onPress={onCamera}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}
              >
                <IconSymbol name="camera.fill" size={24} color="#2196f3" />
              </View>
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={onImagePicker}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#f3e5f5' }]}
              >
                <IconSymbol name="photo.fill" size={24} color="#9c27b0" />
              </View>
              <Text style={styles.optionText}>Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={onDocumentPicker}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#e8f5e8' }]}
              >
                <IconSymbol name="doc.fill" size={24} color="#4caf50" />
              </View>
              <Text style={styles.optionText}>Documents</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  option: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
});
