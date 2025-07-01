import { Router } from 'express';
import { practitionersController } from './practitioners.controller';
import { isAuthenticated } from '../auth/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updateBioExperienceSchema,
  educationSchema,
  updateEducationSchema,
  certificationSchema,
  updateCertificationSchema,
  availabilitySchema,
  uploadDocumentSchema,
} from './practitioners.schema';

const router = Router();

// Practitioner profile management
router.get('/profile', isAuthenticated, practitionersController.getProfile);

// Bio and Experience
router.put(
  '/bio-experience',
  isAuthenticated,
  validate(updateBioExperienceSchema),
  practitionersController.updateBioAndExperience
);

// Education Management
router.post(
  '/education',
  isAuthenticated,
  validate(educationSchema),
  practitionersController.addEducation
);

router.put(
  '/education/:educationId',
  isAuthenticated,
  validate(updateEducationSchema),
  practitionersController.updateEducation
);

router.delete(
  '/education/:educationId',
  isAuthenticated,
  practitionersController.deleteEducation
);

// Certification Management
router.post(
  '/certifications',
  isAuthenticated,
  validate(certificationSchema),
  practitionersController.addCertification
);

router.put(
  '/certifications/:certificationId',
  isAuthenticated,
  validate(updateCertificationSchema),
  practitionersController.updateCertification
);

router.delete(
  '/certifications/:certificationId',
  isAuthenticated,
  practitionersController.deleteCertification
);

// Availability Management
router.put(
  '/availability',
  isAuthenticated,
  validate(availabilitySchema),
  practitionersController.updateAvailability
);

// Document Upload
router.post(
  '/upload-document',
  isAuthenticated,
  validate(uploadDocumentSchema),
  practitionersController.uploadVerificationDocument
);

// Public endpoints
router.get('/specializations', practitionersController.getSpecializations);
router.get('/search', practitionersController.searchPractitioners);
router.get('/:practitionerId', practitionersController.getPractitionerById);

export default router;
