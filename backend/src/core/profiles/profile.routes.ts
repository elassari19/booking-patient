import { Router } from 'express';
import { profileController } from './profile.controller';
import { validate } from '../middleware/validation.middleware';
import { updateProfileSchema } from '../auth/auth.schema';

const router = Router();

// Profile routes
router.get('/profile', profileController.getProfile);
router.put(
  '/profile',
  validate(updateProfileSchema),
  profileController.updateProfile
);
router.post('/profile/upload', profileController.uploadFiles);

// Practitioner specific routes
router.get('/practitioners', profileController.getPractitioners);
router.put('/availability', profileController.updateAvailability);

export default router;
