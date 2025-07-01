import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types matching your backend
export interface Booking {
  id: string;
  patientId: string;
  practitionerId: string;
  bookingDate: string;
  duration: number;
  sessionType: 'VIDEO_CALL' | 'IN_PERSON' | 'PHONE_CALL';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  fee: number;
  patientNotes?: string;
  practitionerNotes?: string;
  createdAt: string;
  updatedAt: string;

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
    };
  };
}

export interface TimeSlot {
  id: string;
  practitionerId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface CreateBookingRequest {
  practitionerId: string;
  bookingDate: string;
  duration?: number;
  sessionType?: 'VIDEO_CALL' | 'IN_PERSON' | 'PHONE_CALL';
  patientNotes?: string;
}

export const bookingApi = createApi({
  reducerPath: 'bookingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      // Add any auth headers if needed
      return headers;
    },
  }),
  tagTypes: ['Booking', 'TimeSlot', 'Availability'],
  endpoints: (builder) => ({
    // Get user bookings
    getBookings: builder.query<{ data: Booking[]; pagination: any }, void>({
      query: () => '/bookings',
      providesTags: ['Booking'],
    }),

    // Get single booking
    getBookingById: builder.query<Booking, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Booking', id }],
    }),

    // Get practitioner availability
    getPractitionerAvailability: builder.query<TimeSlot[], string>({
      query: (practitionerId) => `/bookings/availability/${practitionerId}`,
      providesTags: (result, error, practitionerId) => [
        { type: 'Availability', id: practitionerId },
      ],
    }),

    // Create booking
    createBooking: builder.mutation<{ booking: Booking }, CreateBookingRequest>(
      {
        query: (booking) => ({
          url: '/bookings',
          method: 'POST',
          body: booking,
        }),
        invalidatesTags: ['Booking', 'Availability'],
      }
    ),

    // Update booking status
    updateBookingStatus: builder.mutation<
      { booking: Booking },
      { id: string; status: string; practitionerNotes?: string }
    >({
      query: ({ id, ...patch }) => ({
        url: `/bookings/${id}/status`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Booking', id },
        'Booking',
      ],
    }),

    // Cancel booking
    cancelBooking: builder.mutation<
      void,
      { id: string; cancellationReason?: string }
    >({
      query: ({ id, cancellationReason }) => ({
        url: `/bookings/${id}`,
        method: 'DELETE',
        body: { cancellationReason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Booking', id },
        'Booking',
        'Availability',
      ],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingByIdQuery,
  useGetPractitionerAvailabilityQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
  useCancelBookingMutation,
} = bookingApi;
