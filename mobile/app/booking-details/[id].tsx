import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  useGetBookingByIdQuery,
  useCancelBookingMutation,
} from '@/store/api/bookingApi';

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: booking,
    isLoading,
    error,
  } = useGetBookingByIdQuery(id!, {
    skip: !id,
  });

  const [cancelBooking, { isLoading: isCancelling }] =
    useCancelBookingMutation();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading booking details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText>Booking not found</ThemedText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
      case 'COMPLETED':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const canCancel =
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const canReschedule =
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const isPast = new Date(booking.bookingDate) < new Date();

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking({
                id: booking.id,
                cancellationReason: 'Cancelled by patient',
              }).unwrap();
              Alert.alert('Success', 'Booking cancelled successfully');
              router.back();
            } catch (error: any) {
              console.error('Cancel booking error:', error);
              Alert.alert(
                'Error',
                error.data?.message ||
                  'Failed to cancel booking. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleReschedule = () => {
    router.push(`./reschedule/${booking.id}`); // Fixed: Use absolute path
  };

  const handleSessionDetails = () => {
    if (booking.session?.id) {
      router.push(`./session-details/${booking.session.id}`); // Fixed: Use absolute path
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Booking Details</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(booking.status) },
              ]}
            >
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
            <Text style={styles.bookingId}>#{booking.id.slice(-8)}</Text>
          </View>
        </View>

        {/* Practitioner Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practitioner</Text>
          <View style={styles.practitionerCard}>
            <View style={styles.practitionerInfo}>
              <Text style={styles.practitionerName}>
                Dr. {booking.practitioner?.firstName}{' '}
                {booking.practitioner?.lastName}
              </Text>
              <View style={styles.specializations}>
                {booking.practitioner?.practitionerProfile?.specializations?.map(
                  (spec, index) => (
                    <Text key={index} style={styles.specialization}>
                      {spec}
                    </Text>
                  )
                )}
              </View>
              {booking.practitioner?.practitionerProfile?.bio && (
                <Text style={styles.practitionerBio}>
                  {booking.practitioner.practitionerProfile.bio}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <IconSymbol name="calendar" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(booking.bookingDate)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol name="clock" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(booking.bookingDate)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol name="timer" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {booking.duration} minutes
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol name="video" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Session Type</Text>
                <Text style={styles.detailValue}>
                  {booking.sessionType.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {booking.fee > 0 && (
              <View style={styles.detailRow}>
                <IconSymbol name="dollarsign" size={20} color="#666" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Fee</Text>
                  <Text style={styles.detailValue}>${booking.fee}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {booking.patientNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.patientNotes}</Text>
            </View>
          </View>
        )}

        {booking.practitionerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practitioner Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.practitionerNotes}</Text>
            </View>
          </View>
        )}

        {/* Cancellation Info */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cancellation Details</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{booking.cancellationReason}</Text>
              {booking.cancelledAt && (
                <Text style={styles.cancelledDate}>
                  Cancelled on: {formatDate(booking.cancelledAt)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Session Info */}
        {booking.session && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session</Text>
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={handleSessionDetails}
            >
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionStatus}>
                  Status: {booking.session.status}
                </Text>
                {booking.session.startedAt && (
                  <Text style={styles.sessionTime}>
                    Started: {formatTime(booking.session.startedAt)}
                  </Text>
                )}
                {booking.session.endedAt && (
                  <Text style={styles.sessionTime}>
                    Ended: {formatTime(booking.session.endedAt)}
                  </Text>
                )}
                {booking.session.actualDuration && (
                  <Text style={styles.sessionTime}>
                    Duration: {booking.session.actualDuration} minutes
                  </Text>
                )}
              </View>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      {!isPast && (canCancel || canReschedule) && (
        <View style={styles.actions}>
          {canReschedule && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={handleReschedule}
            >
              <IconSymbol
                name="calendar.badge.clock"
                size={20}
                color="#007bff"
              />
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              <IconSymbol name="xmark" size={20} color="#dc3545" />
              <Text style={styles.cancelText}>
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
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
  backButton: {
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  bookingId: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  practitionerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  practitionerInfo: {
    gap: 8,
  },
  practitionerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  practitionerBio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialization: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  cancelledDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionStatus: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  rescheduleButton: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  rescheduleText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  cancelText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
});
