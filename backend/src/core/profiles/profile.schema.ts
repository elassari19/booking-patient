import { z } from 'zod';

export const patientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  phoneNumber: z.string().optional(),
  profileImage: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalHistory: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
});

export const practitionerProfileSchema = z.object({
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().optional(),
  experience: z.number().optional(),
  profileImage: z.string().optional(),
  phoneNumber: z.string().optional(),
  consultationFee: z.number().optional(),
  languages: z.array(z.string()).optional(),
});

export const availabilitySchema = z.object({
  availability: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean().optional(),
    })
  ),
});
