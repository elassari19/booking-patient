import type { Request, Response } from 'express';
import { userService } from './users.services';
import { AppError } from '../errors';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
const SALT_ROUNDS = 10;

export class UserController {
  async createUser(req: Request, res: Response) {
    try {
      const userData: User = req.body;

      // Validate required fields
      if (
        !userData.email ||
        !userData.firstName ||
        !userData.lastName ||
        !userData.password
      ) {
        throw new AppError(400, 'Missing required fields');
      }

      // Hash password before saving
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
      const newUser = await userService.create({
        ...userData,
        password: hashedPassword,
      });

      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create user' });
      }
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json(user);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch user' });
      }
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userData: User = req.body;

      // Hash password if it's being updated
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, SALT_ROUNDS);
      }

      const updatedUser = await userService.update(id, userData);

      if (!updatedUser) {
        throw new AppError(404, 'User not found');
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update user' });
      }
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await userService.delete(id);

      if (!deleted) {
        throw new AppError(404, 'User not found');
      }

      res.status(204).end();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    }
  }
}

export const userController = new UserController();
