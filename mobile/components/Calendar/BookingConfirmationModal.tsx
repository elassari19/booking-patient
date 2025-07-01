import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCreateBookingMutation } from '@/store/api/bookingApi';

interface BookingConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  practitionerId: string;
  practitionerName: string;
  selectedDate: Date;
  selectedTimeSlot: { id: string; startTime: string; endTime: string } | null;
  onSuccess?: () => void;
}

export default function BookingConfirmationModal({
  visible,
  onClose,
  practitionerId,
  practitionerName,
  selectedDate,
  selectedTimeSlot,
  onSuccess,
}: BookingConfirmationModalProps) {
  const [sessionType, setSessionType] = useState<
    'VIDEO_CALL' | 'IN_PERSON' | 'PHONE_CALL'
  >('VIDEO_CALL');
  const [notes, setNotes] = useState('');
  const [createBooking, { isLoading }] = useCreateBookingMutation();

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) return;

    try {
      // Create booking date string
      const bookingDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.startTime.split(':');
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await createBooking({
        practitionerId,
        bookingDate: bookingDateTime.toISOString(),
        sessionType,
        patientNotes: notes.trim() || undefined,
      }).unwrap();

      Alert.alert(
        'Booking Confirmed!',
        'Your appointment has been booked successfully. You will receive a confirmation notification shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.data?.message || 'Unable to book appointment. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const sessionTypeOptions = [
    { value: 'VIDEO_CALL', label: 'Video Call', icon: 'video' },
    { value: 'IN_PERSON', label: 'In Person', icon: 'person.2' },
    { value: 'PHONE_CALL', label: 'Phone Call', icon: 'phone' },
  ] as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Booking Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Details</Text>

            <View style={styles.detailRow}>
              <IconSymbol name="person.circle" size={20} color="#666" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Practitioner</Text>
                <Text style={styles.detailValue}>{practitionerName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol name="calendar" size={20} color="#666" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
            </View>

            {selectedTimeSlot && (
              <View style={styles.detailRow}>
                <IconSymbol name="clock" size={20} color="#666" />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(selectedTimeSlot.startTime)} -{' '}
                    {formatTime(selectedTimeSlot.endTime)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Session Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Type</Text>
            <View style={styles.sessionTypeContainer}>
              {sessionTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sessionTypeButton,
                    sessionType === option.value && styles.selectedSessionType,
                  ]}
                  onPress={() => setSessionType(option.value)}
                >
                  <IconSymbol
                    name={option.icon as any}
                    size={20}
                    color={sessionType === option.value ? 'white' : '#666'}
                  />
                  <Text
                    style={[
                      styles.sessionTypeText,
                      sessionType === option.value &&
                        styles.selectedSessionTypeText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes for your practitioner..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{notes.length}/500</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isLoading && styles.disabledButton]}
            onPress={handleConfirmBooking}
            disabled={isLoading || !selectedTimeSlot}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sessionTypeContainer: {
    gap: 8,
  },
  sessionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedSessionType: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  sessionTypeText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  selectedSessionTypeText: {
    color: 'white',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
