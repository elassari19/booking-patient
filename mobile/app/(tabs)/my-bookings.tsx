import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import BookingCard from '@/components/bookings/BookingCard';
import BookingFilters from '@/components/bookings/BookingFilters';
import CancellationModal from '@/components/bookings/CancellationModal';
import {
  useGetBookingsQuery,
  useCancelBookingMutation,
} from '@/store/api/bookingApi';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: 'all',
    timeRange: 'all',
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );

  const { data: bookingsResponse, isLoading, refetch } = useGetBookingsQuery();

  const [cancelBooking, { isLoading: isCancelling }] =
    useCancelBookingMutation();

  const bookings = bookingsResponse?.data || [];

  // Filter bookings based on selected filters
  const filteredBookings = bookings.filter((booking) => {
    if (
      filters.status !== 'all' &&
      booking.status !== filters.status.toUpperCase()
    ) {
      return false;
    }

    if (filters.timeRange !== 'all') {
      const bookingDate = new Date(booking.bookingDate);
      const now = new Date();

      switch (filters.timeRange) {
        case 'upcoming':
          return bookingDate > now;
        case 'past':
          return bookingDate < now;
        case 'today':
          return bookingDate.toDateString() === now.toDateString();
        case 'this_week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return bookingDate >= weekStart && bookingDate <= weekEnd;
        default:
          return true;
      }
    }

    return true;
  });

  const handleBookingPress = (bookingId: string) => {
    router.push(`/booking-details/${bookingId}`);
  };

  const handleCancelPress = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

  const handleReschedulePress = (bookingId: string) => {
    router.push(`./reschedule/${bookingId}`);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedBookingId) return;

    try {
      await cancelBooking({
        id: selectedBookingId,
        cancellationReason: reason,
      }).unwrap();

      Alert.alert(
        'Booking Cancelled',
        'Your booking has been cancelled successfully.',
        [{ text: 'OK' }]
      );

      setShowCancelModal(false);
      setSelectedBookingId(null);
      refetch();
    } catch (error: any) {
      Alert.alert(
        'Cancellation Failed',
        error.data?.message || 'Unable to cancel booking. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const groupedBookings = {
    upcoming: filteredBookings.filter(
      (booking) =>
        new Date(booking.bookingDate) > new Date() &&
        ['PENDING', 'CONFIRMED'].includes(booking.status)
    ),
    past: filteredBookings.filter(
      (booking) =>
        new Date(booking.bookingDate) < new Date() ||
        ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status)
    ),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Bookings</ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your appointments and sessions
        </ThemedText>
      </View>

      <BookingFilters filters={filters} onFiltersChange={setFilters} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Bookings */}
        {groupedBookings.upcoming.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Upcoming Appointments ({groupedBookings.upcoming.length})
            </ThemedText>
            {groupedBookings.upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={() => handleBookingPress(booking.id)}
                onCancel={() => handleCancelPress(booking.id)}
                onReschedule={() => handleReschedulePress(booking.id)}
              />
            ))}
          </View>
        )}

        {/* Past Bookings */}
        {groupedBookings.past.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Past Appointments ({groupedBookings.past.length})
            </ThemedText>
            {groupedBookings.past.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={() => handleBookingPress(booking.id)}
              />
            ))}
          </View>
        )}

        {filteredBookings.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No bookings found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {filters.status !== 'all' || filters.timeRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Book your first appointment to get started'}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <CancellationModal
        visible={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBookingId(null);
        }}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
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
