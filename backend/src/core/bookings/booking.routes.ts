import { Router } from 'express';
import { bookingController } from './booking.controller';
import { isAuthenticated } from '../auth/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema,
} from './booking.schema';

const router = Router();

// All booking routes require authentication
router.use(isAuthenticated);

/**
 * @route POST /bookings
 * @desc Create a new booking
 * @access Patient
 */
router.post(
  '/',
  validate(createBookingSchema),
  bookingController.createBooking
);

/**
 * @route GET /bookings
 * @desc Get user bookings with filtering and pagination
 * @access Patient, Practitioner, Admin
 */
router.get(
  '/',
  validate(bookingQuerySchema, 'query'),
  bookingController.getBookings
);

/**
 * @route GET /bookings/:id
 * @desc Get single booking details
 * @access Patient (own), Practitioner (own), Admin (all)
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @route PUT /bookings/:id/status
 * @desc Update booking status
 * @access Practitioner, Admin
 */
router.put(
  '/:id/status',
  validate(updateBookingSchema),
  bookingController.updateBookingStatus
);

/**
 * @route DELETE /bookings/:id
 * @desc Cancel booking
 * @access Patient (own), Practitioner (own), Admin (all)
 */
router.delete('/:id', bookingController.cancelBooking);

/**
 * @route GET /availability/:practitionerId
 * @desc Get practitioner availability
 * @access Authenticated users
 */
router.get(
  '/availability/:practitionerId',
  bookingController.getPractitionerAvailability
);

export default router;
