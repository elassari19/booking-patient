import { Router } from 'express';
import { profileController } from './profile.controller';
import { isAuthenticated } from '../auth/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updatePatientProfileSchema,
  updatePractitionerProfileSchema,
  updateAdminProfileSchema,
  availabilitySchema,
  uploadFileSchema,
  uploadProfileImageSchema,
  searchPractitionersSchema,
} from './profile.schema';
import type { User } from '@prisma/client';

const router = Router();

// All profile routes require authentication
router.use(isAuthenticated);

// Core profile routes
router.get('/profile', profileController.getProfile);

router.put(
  '/profile',
  (req, res, next) => {
    // Dynamic validation based on user role
    const userRole = (req.user as User)?.role;
    let schema;

    switch (userRole) {
      case 'PATIENT':
        schema = updatePatientProfileSchema;
        break;
      case 'PRACTITIONER':
        schema = updatePractitionerProfileSchema;
        break;
      case 'ADMIN':
        schema = updateAdminProfileSchema;
        break;
      default:
        return res.status(400).json({ error: 'Invalid user role' });
    }

    validate(schema)(req, res, next);
  },
  profileController.updateProfile
);

// File upload routes
router.post(
  '/profile/upload',
  validate(uploadFileSchema),
  profileController.uploadFiles
);
router.post(
  '/profile/upload-image',
  validate(uploadProfileImageSchema),
  profileController.uploadProfileImage
);

// Practitioner specific routes
router.get('/practitioners', profileController.getPractitioners);
router.put(
  '/availability',
  validate(availabilitySchema),
  profileController.updateAvailability
);

export default router;
