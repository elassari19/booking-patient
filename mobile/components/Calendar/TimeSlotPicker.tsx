import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { TimeSlot } from '@/store/api/bookingApi';

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  selectedSlot?: string;
  onSlotSelect: (slotId: string) => void;
  loading?: boolean;
  date: Date;
}

export default function TimeSlotPicker({
  timeSlots,
  selectedSlot,
  onSlotSelect,
  loading = false,
  date,
}: TimeSlotPickerProps) {
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

  const availableSlots = timeSlots.filter(
    (slot) => slot.isAvailable && !slot.isBooked
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading available times...</Text>
      </View>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.dateTitle}>{formatDate(date)}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No available time slots for this date
          </Text>
          <Text style={styles.emptySubtext}>
            Please select a different date
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateTitle}>{formatDate(date)}</Text>
      <Text style={styles.subtitle}>Available Times</Text>

      <ScrollView
        style={styles.slotsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.slotsGrid}>
          {availableSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotButton,
                selectedSlot === slot.id && styles.selectedSlot,
              ]}
              onPress={() => onSlotSelect(slot.id)}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedSlot === slot.id && styles.selectedSlotText,
                ]}
              >
                {formatTime(slot.startTime)}
              </Text>
              <Text
                style={[
                  styles.slotDuration,
                  selectedSlot === slot.id && styles.selectedSlotDuration,
                ]}
              >
                {slot.endTime ? `- ${formatTime(slot.endTime)}` : '1 hour'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  slotsContainer: {
    maxHeight: 300,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedSlot: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  slotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedSlotText: {
    color: 'white',
  },
  slotDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedSlotDuration: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
