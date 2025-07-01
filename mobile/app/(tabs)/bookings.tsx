import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import Calendar from '@/components/Calendar/Calendar';
import TimeSlotPicker from '@/components/Calendar/TimeSlotPicker';
import BookingConfirmationModal from '@/components/Calendar/BookingConfirmationModal';
import {
  useGetBookingsQuery,
  useGetPractitionerAvailabilityQuery,
} from '@/store/api/bookingApi';

export default function BookingsScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // For demo purposes - you'll need to get this from practitioner selection
  const selectedPractitionerId = 'demo-practitioner-id';
  const selectedPractitionerName = 'Dr. John Smith';

  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetBookingsQuery();

  const {
    data: availableSlots = [],
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useGetPractitionerAvailabilityQuery(selectedPractitionerId, {
    skip: !selectedPractitionerId,
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
  };

  const handleBookNow = () => {
    if (!selectedTimeSlot) {
      Alert.alert('Please select a time slot');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleBookingSuccess = () => {
    refetchBookings();
    refetchSlots();
    setSelectedTimeSlot(null);
  };

  const onRefresh = async () => {
    await Promise.all([refetchBookings(), refetchSlots()]);
  };

  // Create marked dates from bookings
  const markedDates = bookings.reduce((acc, booking) => {
    const dateKey = booking.bookingDate.split('T')[0];
    acc[dateKey] = { marked: true, color: '#28a745' };
    return acc;
  }, {} as Record<string, { marked: boolean; color: string }>);

  // Filter slots for selected date
  const slotsForSelectedDate = availableSlots.filter((slot) => {
    const slotDate = new Date(slot.date);
    return slotDate.toDateString() === selectedDate.toDateString();
  });

  const selectedSlotData = slotsForSelectedDate.find(
    (slot) => slot.id === selectedTimeSlot
  );

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3); // 3 months ahead

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={bookingsLoading || slotsLoading}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title">Book Appointment</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select a date and time for your appointment
          </ThemedText>
        </View>

        <Calendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          markedDates={markedDates}
          minDate={minDate}
          maxDate={maxDate}
        />

        <TimeSlotPicker
          timeSlots={slotsForSelectedDate}
          selectedSlot={selectedTimeSlot ?? undefined}
          onSlotSelect={handleSlotSelect}
          loading={slotsLoading}
          date={selectedDate}
        />

        {selectedTimeSlot && (
          <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <ThemedText style={styles.bookButtonText}>
              Book Appointment
            </ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BookingConfirmationModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        practitionerId={selectedPractitionerId}
        practitionerName={selectedPractitionerName}
        selectedDate={selectedDate}
        selectedTimeSlot={
          selectedSlotData
            ? {
                id: selectedSlotData.id,
                startTime: selectedSlotData.startTime,
                endTime: selectedSlotData.endTime,
              }
            : null
        }
        onSuccess={handleBookingSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
