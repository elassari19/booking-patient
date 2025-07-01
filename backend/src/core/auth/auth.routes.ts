import express from 'express';
import { AuthController } from './auth.controller';
import { isAuthenticated } from './auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from './auth.schema';

const router = express.Router();

// Authentication routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);

// Session management
router.get('/me', isAuthenticated, AuthController.getCurrentUser);
router.get('/session', AuthController.checkSession);

// Email verification routes
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);
router.post(
  '/resend-verification',
  validate(resendVerificationSchema),
  AuthController.resendVerification
);

// Password reset routes
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;
