/**
 * @fileoverview Admin endpoints for user management and system administration
 * @module AdminRoutes
 */

import { Router } from 'express';
import { adminController } from './admin.controller';
import { isAuthenticated } from '../auth/auth.middleware';
import { requireAdmin } from './admin.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updateUserStatusSchema,
  updateVerificationStatusSchema,
  getUsersQuerySchema,
} from './admin.schema';

const router = Router();

// All admin routes require authentication and admin role
router.use(isAuthenticated);
router.use(requireAdmin);

/**
 * @route GET /admin/users
 * @desc List all users with filtering and pagination
 * @access Admin
 * @query {string} [role] - Filter by user role (PATIENT, PRACTITIONER, ADMIN)
 * @query {string} [status] - Filter by user status (ACTIVE, SUSPENDED, INACTIVE)
 * @query {string} [verificationStatus] - Filter by verification status (PENDING, VERIFIED, REJECTED)
 * @query {string} [search] - Search in firstName, lastName, email
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of users per page
 * @response {Object[]} 200 - An array of user objects
 * @response {Error}  500 - Internal server error
 */
router.get(
  '/users',
  validate(getUsersQuerySchema, 'query'),
  adminController.getAllUsers
);

/**
 * @route PUT /admin/users/:id/status
 * @desc Update the status of a user
 * @access Admin
 * @param {string} id.path.required - User ID
 * @requestBody {Object} requestBody.required - Status update information
 * @requestBody {string} requestBody.status.required - New status of the user (ACTIVE, SUSPENDED, INACTIVE)
 * @response 204 - No Content
 * @response {Error}  400 - Bad request
 * @response {Error}  404 - User not found
 * @response {Error}  500 - Internal server error
 */
router.put(
  '/users/:id/status',
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

/**
 * @route DELETE /admin/users/:id
 * @desc Delete a user
 * @access Admin
 * @param {string} id.path.required - User ID
 * @response 204 - No Content
 * @response {Error}  404 - User not found
 * @response {Error}  500 - Internal server error
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route GET /admin/stats
 * @desc Get user statistics
 * @access Admin
 * @response {Object} 200 - An object containing user statistics
 * @response {Error}  500 - Internal server error
 */
router.get('/stats', adminController.getUserStats);

/**
 * @route GET /admin/dashboard
 * @desc Get dashboard data
 * @access Admin
 * @response {Object} 200 - An object containing dashboard data
 * @response {Error}  500 - Internal server error
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route GET /admin/system-stats
 * @desc Get system statistics
 * @access Admin
 * @response {Object} 200 - An object containing system statistics
 * @response {Error}  500 - Internal server error
 */
router.get('/system-stats', adminController.getSystemStats);

/**
 * @route PUT /admin/practitioners/:id/verification
 * @desc Update the verification status of a practitioner
 * @access Admin
 * @param {string} id.path.required - Practitioner ID
 * @requestBody {Object} requestBody.required - Verification update information
 * @requestBody {string} requestBody.verificationStatus.required - New verification status of the practitioner (PENDING, VERIFIED, REJECTED)
 * @response 204 - No Content
 * @response {Error}  400 - Bad request
 * @response {Error}  404 - Practitioner not found
 * @response {Error}  500 - Internal server error
 */
router.put(
  '/practitioners/:id/verification',
  validate(updateVerificationStatusSchema),
  adminController.updatePractitionerVerification
);

export { adminService } from './admin.service';
export { adminController } from './admin.controller';
export * from './admin.schema';
export * from './admin.middleware';

export default router;
