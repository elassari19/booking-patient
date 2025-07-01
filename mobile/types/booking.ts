export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SessionType {
  VIDEO_CALL = 'VIDEO_CALL',
  IN_PERSON = 'IN_PERSON',
  PHONE_CALL = 'PHONE_CALL',
}

export interface Booking {
  id: string;
  patientId: string;
  practitionerId: string;
  bookingDate: string;
  duration: number;
  sessionType: SessionType;
  status: BookingStatus;
  fee: number;
  patientNotes?: string;
  practitionerNotes?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;

  // Related data
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
  session?: Session;
}

export interface Session {
  id: string;
  bookingId: string;
  status: SessionStatus;
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
}

export interface TimeSlot {
  id: string;
  practitionerId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurringType?: string;
  recurringUntil?: string;
  isBooked: boolean;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  practitionerId: string;
  bookingDate: string;
  duration?: number;
  sessionType?: SessionType;
  patientNotes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  practitionerNotes?: string;
  cancellationReason?: string;
}
