import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Session interfaces matching backend
export interface Session {
  id: string;
  bookingId: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startedAt?: string;
  endedAt?: string;
  actualDuration?: number;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
  roomId?: string;
  recordingUrl?: string;
  patientRating?: number;
  practitionerRating?: number;
  patientFeedback?: string;
  practitionerFeedback?: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingDate: string;
    duration: number;
    sessionType: 'VIDEO_CALL' | 'IN_PERSON' | 'PHONE_CALL';
    fee: number;
    patient?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    practitioner?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      practitionerProfile?: {
        specializations: string[];
        profileImage?: string;
        bio?: string;
      };
    };
  };
}

export interface SessionsResponse {
  data: Session[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SessionRatingRequest {
  patientRating?: number;
  practitionerRating?: number;
  patientFeedback?: string;
  practitionerFeedback?: string;
}

export interface SessionNotesRequest {
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
}

export const sessionApi = createApi({
  reducerPath: 'sessionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    // Get sessions
    getSessions: builder.query<
      SessionsResponse,
      {
        status?: string;
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `/sessions?${searchParams.toString()}`;
      },
      providesTags: ['Session'],
    }),

    // Get single session details
    getSessionById: builder.query<{ session: Session }, string>({
      query: (id) => `/sessions/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    // Rate session
    rateSession: builder.mutation<
      { session: Session },
      { id: string; rating: SessionRatingRequest }
    >({
      query: ({ id, rating }) => ({
        url: `/sessions/${id}/rating`,
        method: 'POST',
        body: rating,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Session', id },
        'Session',
      ],
    }),

    // Add session notes (practitioner only)
    addSessionNotes: builder.mutation<
      { session: Session },
      { id: string; notes: SessionNotesRequest }
    >({
      query: ({ id, notes }) => ({
        url: `/sessions/${id}/notes`,
        method: 'POST',
        body: notes,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Session', id },
        'Session',
      ],
    }),

    // Start session (practitioner only)
    startSession: builder.mutation<
      { session: Session },
      { id: string; roomId?: string }
    >({
      query: ({ id, roomId }) => ({
        url: `/sessions/${id}/start`,
        method: 'POST',
        body: { roomId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Session', id },
        'Session',
      ],
    }),

    // End session (practitioner only)
    endSession: builder.mutation<{ session: Session }, string>({
      query: (id) => ({
        url: `/sessions/${id}/end`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Session', id },
        'Session',
      ],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionByIdQuery,
  useRateSessionMutation,
  useAddSessionNotesMutation,
  useStartSessionMutation,
  useEndSessionMutation,
} = sessionApi;
