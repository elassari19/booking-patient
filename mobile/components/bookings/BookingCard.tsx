import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Booking } from '@/store/api/bookingApi';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}

export default function BookingCard({
  booking,
  onPress,
  onCancel,
  onReschedule,
}: BookingCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO_CALL':
        return 'video';
      case 'IN_PERSON':
        return 'person.2';
      case 'PHONE_CALL':
        return 'phone';
      default:
        return 'questionmark';
    }
  };

  const canCancel =
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const canReschedule =
    booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  const bookingDate = new Date(booking.bookingDate);
  const now = new Date();
  const isPast = bookingDate < now;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.practitionerInfo}>
          <Text style={styles.practitionerName}>
            Dr. {booking.practitioner?.firstName}{' '}
            {booking.practitioner?.lastName}
          </Text>
          <View style={styles.specializations}>
            {booking.practitioner?.practitionerProfile?.specializations
              ?.slice(0, 2)
              .map((spec, index) => (
                <Text key={index} style={styles.specialization}>
                  {spec}
                </Text>
              ))}
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <IconSymbol name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(booking.bookingDate)} at{' '}
            {formatTime(booking.bookingDate)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <IconSymbol
            name={getSessionTypeIcon(booking.sessionType) as any}
            size={16}
            color="#666"
          />
          <Text style={styles.detailText}>
            {booking.sessionType.replace('_', ' ')} • {booking.duration} minutes
          </Text>
        </View>

        {booking.fee > 0 && (
          <View style={styles.detailRow}>
            <IconSymbol name="dollarsign" size={16} color="#666" />
            <Text style={styles.detailText}>${booking.fee}</Text>
          </View>
        )}
      </View>

      {!isPast && (canCancel || canReschedule) && (
        <View style={styles.actions}>
          {canReschedule && onReschedule && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={(e) => {
                e.stopPropagation();
                onReschedule();
              }}
            >
              <IconSymbol
                name="calendar.badge.clock"
                size={16}
                color="#007bff"
              />
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
          )}

          {canCancel && onCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <IconSymbol name="xmark" size={16} color="#dc3545" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  practitionerInfo: {
    flex: 1,
  },
  practitionerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  specializations: {
    flexDirection: 'row',
    gap: 8,
  },
  specialization: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  rescheduleButton: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  rescheduleText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  cancelButton: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  cancelText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '500',
  },
});
