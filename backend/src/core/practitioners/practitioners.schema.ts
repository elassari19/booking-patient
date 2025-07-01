import { z } from 'zod';

export const updateBioExperienceSchema = z.object({
  bio: z.string().max(2000).optional(),
  experience: z.number().min(0).max(50).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  consultationFee: z.number().min(0).optional(),
});

export const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.number().min(1950).max(new Date().getFullYear()),
});

export const updateEducationSchema = z.object({
  degree: z.string().min(1).optional(),
  institution: z.string().min(1).optional(),
  year: z.number().min(1950).max(new Date().getFullYear()).optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  issueDate: z.string().transform((str) => new Date(str)),
  expiryDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  documentUrl: z.string().url().optional(),
});

export const updateCertificationSchema = z.object({
  name: z.string().min(1).optional(),
  issuer: z.string().min(1).optional(),
  issueDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  expiryDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  documentUrl: z.string().url().optional(),
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

export const searchPractitionersSchema = z.object({
  specialization: z.string().optional(),
  location: z.string().optional(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
  minExperience: z.string().transform(Number).optional(),
  maxFee: z.string().transform(Number).optional(),
  language: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
  documentUrl: z.string().url('Valid document URL is required'),
});
