import type { BookingStatus, SessionStatus, SessionType } from '@prisma/client';

export interface CreateBookingInput {
  practitionerId: string;
  bookingDate: Date;
  duration?: number;
  sessionType?: SessionType;
  patientNotes?: string;
}

export interface UpdateBookingInput {
  status?: BookingStatus;
  practitionerNotes?: string;
  cancellationReason?: string;
}

export interface CreateSessionInput {
  bookingId: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  followUpDate?: Date;
}

export interface SessionFeedbackInput {
  patientRating?: number;
  practitionerRating?: number;
  patientFeedback?: string;
  practitionerFeedback?: string;
}

export interface CreateTimeSlotInput {
  practitionerId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  recurringUntil?: Date;
}

export interface UpdateTimeSlotInput {
  isAvailable?: boolean;
  isBooked?: boolean;
  bookingId?: string;
}

export interface BookingQueryParams {
  status?: BookingStatus;
  practitionerId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Additional helpful types for API responses
export interface BookingWithRelations {
  id: string;
  patientId: string;
  practitionerId: string;
  bookingDate: Date;
  duration: number;
  sessionType: SessionType;
  status: BookingStatus;
  fee: number;
  patientNotes?: string;
  practitionerNotes?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    patientProfile?: {
      profileImage?: string;
      phone?: string;
    };
  };
  practitioner: {
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
  session?: SessionWithDetails;
}

export interface SessionWithDetails {
  id: string;
  bookingId: string;
  status: SessionStatus;
  startedAt?: Date;
  endedAt?: Date;
  actualDuration?: number;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  followUpDate?: Date;
  roomId?: string;
  recordingUrl?: string;
  patientRating?: number;
  practitionerRating?: number;
  patientFeedback?: string;
  practitionerFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlotWithAvailability {
  id: string;
  practitionerId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurringType?: string;
  recurringUntil?: Date;
  isBooked: boolean;
  bookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// For API pagination responses
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type BookingListResponse = PaginatedResponse<BookingWithRelations>;
export type SessionListResponse = PaginatedResponse<SessionWithDetails>;
export type TimeSlotListResponse = PaginatedResponse<TimeSlotWithAvailability>;

// Validation constraints
export const BOOKING_CONSTRAINTS = {
  MIN_DURATION: 15, // minutes
  MAX_DURATION: 240, // minutes
  DEFAULT_DURATION: 60, // minutes
  MAX_NOTES_LENGTH: 1000,
  MAX_CANCELLATION_REASON_LENGTH: 500,
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

// Time slot constraints
export const TIME_SLOT_CONSTRAINTS = {
  TIME_FORMAT_REGEX: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  VALID_RECURRING_TYPES: ['daily', 'weekly', 'monthly'] as const,
} as const;
