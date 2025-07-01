import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Session } from '@/store/api/sessionApi';

interface SessionCardProps {
  session: Session;
  onPress: () => void;
  onRate?: () => void;
}

export default function SessionCard({
  session,
  onPress,
  onRate,
}: SessionCardProps) {
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
      case 'COMPLETED':
        return '#28a745';
      case 'IN_PROGRESS':
        return '#007bff';
      case 'SCHEDULED':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
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

  const canRate = session.status === 'COMPLETED' && !session.patientRating;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.practitionerInfo}>
          <Text style={styles.practitionerName}>
            Dr. {session.booking.practitioner?.firstName}{' '}
            {session.booking.practitioner?.lastName}
          </Text>
          <View style={styles.specializations}>
            {session.booking.practitioner?.practitionerProfile?.specializations
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
            { backgroundColor: getStatusColor(session.status) },
          ]}
        >
          <Text style={styles.statusText}>{session.status}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <IconSymbol name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(session.booking.bookingDate)}
          </Text>
        </View>

        {session.startedAt && (
          <View style={styles.detailRow}>
            <IconSymbol name="clock" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(session.startedAt)}
              {session.endedAt && ` - ${formatTime(session.endedAt)}`}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <IconSymbol
            name={getSessionTypeIcon(session.booking.sessionType) as any}
            size={16}
            color="#666"
          />
          <Text style={styles.detailText}>
            {session.booking.sessionType.replace('_', ' ')}
          </Text>
        </View>

        {session.actualDuration && (
          <View style={styles.detailRow}>
            <IconSymbol name="timer" size={16} color="#666" />
            <Text style={styles.detailText}>
              {session.actualDuration} minutes
            </Text>
          </View>
        )}

        {session.patientRating && (
          <View style={styles.detailRow}>
            <IconSymbol name="star.fill" size={16} color="#ffc107" />
            <Text style={styles.detailText}>
              {session.patientRating}/5 stars
            </Text>
          </View>
        )}
      </View>

      {canRate && onRate && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={(e) => {
              e.stopPropagation();
              onRate();
            }}
          >
            <IconSymbol name="star" size={16} color="#ffc107" />
            <Text style={styles.rateText}>Rate Session</Text>
          </TouchableOpacity>
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffc107',
    backgroundColor: '#fffbf0',
    alignSelf: 'flex-start',
  },
  rateText: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: '500',
  },
});
