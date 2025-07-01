import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be ACTIVE, SUSPENDED, or INACTIVE',
  }),
});

export const updateVerificationStatusSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED'], {
    required_error: 'Verification status is required',
    invalid_type_error:
      'Verification status must be PENDING, VERIFIED, or REJECTED',
  }),
});

export const getUsersQuerySchema = z.object({
  role: z.enum(['PATIENT', 'PRACTITIONER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  sortBy: z
    .enum(['createdAt', 'firstName', 'lastName', 'email', 'status'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
