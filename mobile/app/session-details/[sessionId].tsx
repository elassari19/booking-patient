import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import RatingModal from '@/components/sessions/RatingModal';
import {
  useGetSessionByIdQuery,
  useRateSessionMutation,
} from '@/store/api/sessionApi';

export default function SessionDetailsScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [showRatingModal, setShowRatingModal] = useState(false);

  const {
    data: sessionResponse,
    isLoading,
    error,
  } = useGetSessionByIdQuery(sessionId!, {
    skip: !sessionId,
  });

  const [rateSession, { isLoading: isRating }] = useRateSessionMutation();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading session details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !sessionResponse) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText>Session not found</ThemedText>
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

  const session = sessionResponse.session;

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

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    try {
      await rateSession({
        id: session.id,
        rating: {
          patientRating: rating,
          patientFeedback: feedback,
        },
      }).unwrap();

      Alert.alert('Rating Submitted', 'Thank you for your feedback!', [
        { text: 'OK' },
      ]);

      setShowRatingModal(false);
    } catch (error: any) {
      Alert.alert(
        'Rating Failed',
        error.data?.message || 'Unable to submit rating. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleExportSession = async () => {
    const sessionSummary = `
Session Summary
==============

Practitioner: Dr. ${session.booking.practitioner?.firstName} ${
      session.booking.practitioner?.lastName
    }
Date: ${formatDate(session.booking.bookingDate)}
${session.startedAt ? `Start Time: ${formatTime(session.startedAt)}` : ''}
${session.endedAt ? `End Time: ${formatTime(session.endedAt)}` : ''}
${session.actualDuration ? `Duration: ${session.actualDuration} minutes` : ''}
Session Type: ${session.booking.sessionType.replace('_', ' ')}
Status: ${session.status}

${session.notes ? `Notes:\n${session.notes}\n\n` : ''}
${session.diagnosis ? `Diagnosis:\n${session.diagnosis}\n\n` : ''}
${session.prescription ? `Prescription:\n${session.prescription}\n\n` : ''}
${
  session.followUpDate
    ? `Follow-up Date: ${formatDate(session.followUpDate)}\n\n`
    : ''
}
${
  session.patientRating ? `Your Rating: ${session.patientRating}/5 stars\n` : ''
}
${session.patientFeedback ? `Your Feedback: ${session.patientFeedback}` : ''}
`;

    try {
      await Share.share({
        message: sessionSummary,
        title: 'Session Summary',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export session details.');
    }
  };

  const canRate = session.status === 'COMPLETED' && !session.patientRating;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#333" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Session Details</ThemedText>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportSession}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color="#007bff" />
        </TouchableOpacity>
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
                { backgroundColor: getStatusColor(session.status) },
              ]}
            >
              <Text style={styles.statusText}>{session.status}</Text>
            </View>
            <Text style={styles.sessionId}>#{session.id.slice(-8)}</Text>
          </View>
        </View>

        {/* Practitioner Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practitioner</Text>
          <View style={styles.practitionerCard}>
            <View style={styles.practitionerInfo}>
              <Text style={styles.practitionerName}>
                Dr. {session.booking.practitioner?.firstName}{' '}
                {session.booking.practitioner?.lastName}
              </Text>
              <View style={styles.specializations}>
                {session.booking.practitioner?.practitionerProfile?.specializations?.map(
                  (spec, index) => (
                    <Text key={index} style={styles.specialization}>
                      {spec}
                    </Text>
                  )
                )}
              </View>
              {session.booking.practitioner?.practitionerProfile?.bio && (
                <Text style={styles.practitionerBio}>
                  {session.booking.practitioner.practitionerProfile.bio}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Session Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <IconSymbol name="calendar" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(session.booking.bookingDate)}
                </Text>
              </View>
            </View>

            {session.startedAt && (
              <View style={styles.detailRow}>
                <IconSymbol name="clock" size={20} color="#666" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Start Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(session.startedAt)}
                  </Text>
                </View>
              </View>
            )}

            {session.endedAt && (
              <View style={styles.detailRow}>
                <IconSymbol
                  name="clock.badge.checkmark"
                  size={20}
                  color="#666"
                />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>End Time</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(session.endedAt)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <IconSymbol name="timer" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {session.actualDuration || session.booking.duration} minutes
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol name="video" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Session Type</Text>
                <Text style={styles.detailValue}>
                  {session.booking.sessionType.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {session.booking.fee > 0 && (
              <View style={styles.detailRow}>
                <IconSymbol name="dollarsign" size={20} color="#666" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Fee</Text>
                  <Text style={styles.detailValue}>${session.booking.fee}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Session Notes */}
        {session.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{session.notes}</Text>
            </View>
          </View>
        )}

        {/* Diagnosis */}
        {session.diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{session.diagnosis}</Text>
            </View>
          </View>
        )}

        {/* Prescription */}
        {session.prescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{session.prescription}</Text>
            </View>
          </View>
        )}

        {/* Follow-up Date */}
        {session.followUpDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow-up Appointment</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                Recommended date: {formatDate(session.followUpDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Your Rating */}
        {session.patientRating && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.ratingCard}>
              <View style={styles.ratingHeader}>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <IconSymbol
                      key={index}
                      name={
                        index < session.patientRating! ? 'star.fill' : 'star'
                      }
                      size={20}
                      color={
                        index < session.patientRating! ? '#ffc107' : '#e9ecef'
                      }
                    />
                  ))}
                </View>
                <Text style={styles.ratingValue}>
                  {session.patientRating}/5 stars
                </Text>
              </View>
              {session.patientFeedback && (
                <Text style={styles.feedbackText}>
                  {session.patientFeedback}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      {canRate && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => setShowRatingModal(true)}
          >
            <IconSymbol name="star" size={20} color="#ffc107" />
            <Text style={styles.rateButtonText}>Rate Session</Text>
          </TouchableOpacity>
        </View>
      )}

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        isLoading={isRating}
        practitionerName={
          session.booking.practitioner
            ? `Dr. ${session.booking.practitioner.firstName} ${session.booking.practitioner.lastName}`
            : 'the practitioner'
        }
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
  exportButton: {
    padding: 8,
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
  sessionId: {
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
  ratingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ffc107',
  },
  rateButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
});
