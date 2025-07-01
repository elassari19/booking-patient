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
import SessionCard from '@/components/sessions/SessionCard';
import SessionFilters from '@/components/sessions/SessionFilters';
import RatingModal from '@/components/sessions/RatingModal';
import {
  useGetSessionsQuery,
  useRateSessionMutation,
} from '@/store/api/sessionApi';

export default function SessionsScreen() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    status: 'all',
    timeRange: 'all',
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Build query parameters based on filters
  const getQueryParams = () => {
    const params: any = {};

    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      switch (filters.timeRange) {
        case 'this_month':
          params.startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          ).toISOString();
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          params.startDate = lastMonth.toISOString();
          params.endDate = lastMonthEnd.toISOString();
          break;
        case 'last_3_months':
          params.startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            1
          ).toISOString();
          break;
        case 'this_year':
          params.startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          break;
      }
    }

    return params;
  };

  const {
    data: sessionsResponse,
    isLoading,
    refetch,
  } = useGetSessionsQuery(getQueryParams());

  const [rateSession, { isLoading: isRating }] = useRateSessionMutation();

  const sessions = sessionsResponse?.data || [];

  const handleSessionPress = (sessionId: string) => {
    router.push(`./session-details/${sessionId}`);
  };

  const handleRatePress = (sessionId: string) => {
    setSelectedSession(sessionId);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!selectedSession) return;

    try {
      await rateSession({
        id: selectedSession,
        rating: {
          patientRating: rating,
          patientFeedback: feedback,
        },
      }).unwrap();

      Alert.alert('Rating Submitted', 'Thank you for your feedback!', [
        { text: 'OK' },
      ]);

      setShowRatingModal(false);
      setSelectedSession(null);
      refetch();
    } catch (error: any) {
      Alert.alert(
        'Rating Failed',
        error.data?.message || 'Unable to submit rating. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getRatingModalName = () => {
    if (!selectedSession) return '';
    const session = sessions.find((s) => s.id === selectedSession);
    return session?.booking.practitioner
      ? `Dr. ${session.booking.practitioner.firstName} ${session.booking.practitioner.lastName}`
      : 'the practitioner';
  };

  // Group sessions by status
  const groupedSessions = {
    completed: sessions.filter((session) => session.status === 'COMPLETED'),
    upcoming: sessions.filter((session) => session.status === 'SCHEDULED'),
    cancelled: sessions.filter((session) => session.status === 'CANCELLED'),
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Session History</ThemedText>
        <ThemedText style={styles.subtitle}>
          View your past and upcoming sessions
        </ThemedText>
      </View>

      <SessionFilters filters={filters} onFiltersChange={setFilters} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Completed Sessions */}
        {(filters.status === 'all' || filters.status === 'COMPLETED') &&
          groupedSessions.completed.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Completed Sessions ({groupedSessions.completed.length})
              </ThemedText>
              {groupedSessions.completed.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => handleSessionPress(session.id)}
                  onRate={() => handleRatePress(session.id)}
                />
              ))}
            </View>
          )}

        {/* Upcoming Sessions */}
        {(filters.status === 'all' || filters.status === 'SCHEDULED') &&
          groupedSessions.upcoming.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Upcoming Sessions ({groupedSessions.upcoming.length})
              </ThemedText>
              {groupedSessions.upcoming.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => handleSessionPress(session.id)}
                />
              ))}
            </View>
          )}

        {/* Cancelled Sessions */}
        {(filters.status === 'all' || filters.status === 'CANCELLED') &&
          groupedSessions.cancelled.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>
                Cancelled Sessions ({groupedSessions.cancelled.length})
              </ThemedText>
              {groupedSessions.cancelled.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => handleSessionPress(session.id)}
                />
              ))}
            </View>
          )}

        {sessions.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No sessions found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {filters.status !== 'all' || filters.timeRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Your session history will appear here'}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedSession(null);
        }}
        onSubmit={handleRatingSubmit}
        isLoading={isRating}
        practitionerName={getRatingModalName()}
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
