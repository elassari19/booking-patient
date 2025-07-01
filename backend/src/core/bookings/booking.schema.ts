import { z } from 'zod';

export const createBookingSchema = z.object({
  practitionerId: z.string().cuid('Invalid practitioner ID'),
  bookingDate: z.string().datetime('Invalid booking date'),
  duration: z.number().min(15).max(240).optional().default(60),
  sessionType: z
    .enum(['VIDEO_CALL', 'IN_PERSON', 'PHONE_CALL'])
    .optional()
    .default('VIDEO_CALL'),
  patientNotes: z.string().max(1000).optional(),
});

export const updateBookingSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
    .optional(),
  practitionerNotes: z.string().max(1000).optional(),
  cancellationReason: z.string().max(500).optional(),
});

export const createSessionSchema = z.object({
  notes: z.string().max(2000).optional(),
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  followUpDate: z.string().datetime().optional(),
});

export const sessionFeedbackSchema = z.object({
  patientRating: z.number().min(1).max(5).optional(),
  practitionerRating: z.number().min(1).max(5).optional(),
  patientFeedback: z.string().max(1000).optional(),
  practitionerFeedback: z.string().max(1000).optional(),
});

export const createTimeSlotSchema = z.object({
  date: z.string().datetime('Invalid date'),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  isRecurring: z.boolean().optional().default(false),
  recurringType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringUntil: z.string().datetime().optional(),
});

export const bookingQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
    .optional(),
  practitionerId: z.string().optional(),
  patientId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional()
    .default('10'),
});
