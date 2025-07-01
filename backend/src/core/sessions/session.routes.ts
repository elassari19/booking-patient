import { Router } from 'express';
import { sessionController } from './session.controller';
import { isAuthenticated } from '../auth/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  sessionQuerySchema,
  sessionNotesSchema,
  sessionRatingSchema,
  startSessionSchema,
} from './session.schema';

const router = Router();

// All session routes require authentication
router.use(isAuthenticated);

/**
 * @route GET /sessions
 * @desc List sessions with filtering and pagination
 * @access Patient (own), Practitioner (own), Admin (all)
 */
router.get(
  '/',
  validate(sessionQuerySchema, 'query'),
  sessionController.getSessions
);

/**
 * @route GET /sessions/:id/details
 * @desc Get session details
 * @access Patient (own), Practitioner (own), Admin (all)
 */
router.get('/:id/details', sessionController.getSessionDetails);

/**
 * @route POST /sessions/:id/notes
 * @desc Add session notes
 * @access Practitioner (own), Admin (all)
 */
router.post(
  '/:id/notes',
  validate(sessionNotesSchema),
  sessionController.addSessionNotes
);

/**
 * @route POST /sessions/:id/rating
 * @desc Rate session
 * @access Patient (own), Practitioner (own)
 */
router.post(
  '/:id/rating',
  validate(sessionRatingSchema),
  sessionController.rateSession
);

/**
 * @route POST /sessions/:id/start
 * @desc Start session
 * @access Practitioner (own)
 */
router.post(
  '/:id/start',
  validate(startSessionSchema),
  sessionController.startSession
);

/**
 * @route POST /sessions/:id/end
 * @desc End session
 * @access Practitioner (own)
 */
router.post('/:id/end', sessionController.endSession);

export default router;
