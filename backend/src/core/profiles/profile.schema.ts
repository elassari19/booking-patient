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

export const updatePatientProfileSchema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  phoneNumber: z.string().optional(),
  profileImage: z.string().url().optional(),
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

export const updatePractitionerProfileSchema = z.object({
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional(),
  experience: z.number().min(0).max(50).optional(),
  profileImage: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  languages: z.array(z.string()).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const updateAdminProfileSchema = z.object({
  department: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  profileImage: z.string().url().optional(),
  phoneNumber: z.string().optional(),
});

export const availabilitySchema = z.object({
  availability: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Invalid time format (HH:MM)'
          ),
        endTime: z
          .string()
          .regex(
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Invalid time format (HH:MM)'
          ),
        isAvailable: z.boolean().optional().default(true),
      })
    )
    .min(1, 'At least one availability slot is required'),
});

export const uploadFileSchema = z.object({
  fileUrl: z.string().url('Valid file URL is required'),
  fileType: z
    .enum(['profile_image', 'document', 'certification', 'verification'])
    .optional()
    .default('document'),
});

export const uploadProfileImageSchema = z.object({
  imageUrl: z.string().url('Valid image URL is required'),
});

export const searchPractitionersSchema = z.object({
  specialization: z.string().optional(),
  location: z.string().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  minExperience: z.string().transform(Number).optional(),
  maxFee: z.string().transform(Number).optional(),
  language: z.string().optional(),
});
