import { Router } from 'express';
import { adminController } from './admin.controller';
import { isAuthenticated } from '../auth/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updateUserStatusSchema,
  updateVerificationStatusSchema,
  getUsersQuerySchema,
} from './admin.schema';

const router = Router();

// All admin routes require authentication
router.use(isAuthenticated);

// User Management
router.get(
  '/users',
  validate(getUsersQuerySchema, 'query'),
  adminController.getAllUsers
);

router.put(
  '/users/:id/status',
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

router.delete('/users/:id', adminController.deleteUser);

// Practitioner Management
router.put(
  '/practitioners/:id/verification',
  validate(updateVerificationStatusSchema),
  adminController.updatePractitionerVerification
);

// Statistics & Analytics
router.get('/stats', adminController.getUserStats);
router.get('/system-stats', adminController.getSystemStats);
router.get('/dashboard', adminController.getDashboard);

export default router;
