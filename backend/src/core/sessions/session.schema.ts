import { z } from 'zod';

export const sessionQuerySchema = z.object({
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  practitionerId: z.string().optional(),
  patientId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const sessionNotesSchema = z.object({
  notes: z.string().max(2000).optional(),
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  followUpDate: z.string().datetime().optional(),
});

export const sessionRatingSchema = z.object({
  patientRating: z.number().min(1).max(5).optional(),
  practitionerRating: z.number().min(1).max(5).optional(),
  patientFeedback: z.string().max(1000).optional(),
  practitionerFeedback: z.string().max(1000).optional(),
});

export const startSessionSchema = z.object({
  roomId: z.string().optional(),
});

export const createSessionSchema = z.object({
  bookingId: z.string(),
  notes: z.string().max(2000).optional(),
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  followUpDate: z.string().datetime().optional(),
});
