import { Router } from 'express';
import { userController } from './users.controllers';
import { cacheMiddleware, clearCache } from '../cache';
import { validate } from '../middleware/validation.middleware';
import { CreateUserDtoSchema, UpdateUserDtoSchema } from './users.schema';

const router = Router();

// Get all users
router.get('/', userController.getAllUsers.bind(userController));

// Get user by ID
router.get('/:id', userController.getUserById.bind(userController));

// Create new user
// Update routes to use validation middleware
router.post('/', userController.createUser.bind(userController));

router.put('/:id', userController.updateUser.bind(userController));

// Delete user
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;
