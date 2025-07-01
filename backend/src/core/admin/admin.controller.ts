import type { Request, Response } from 'express';
import { adminService } from './admin.service';
import type { User } from '@prisma/client';

export class AdminController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;

      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const filters = {
        role: req.query.role as any,
        status: req.query.status as any,
        verificationStatus: req.query.verificationStatus as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await adminService.getAllUsers(filters);
      res.json(result);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  async updateUserStatus(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;
      const adminId = req.user?.id;

      if (userRole !== 'ADMIN' || !adminId) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const { id: userId } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
        return res.status(400).json({
          error: 'Valid status is required (ACTIVE, SUSPENDED, INACTIVE)',
        });
      }

      const updatedUser = await adminService.updateUserStatus(
        userId,
        status,
        adminId
      );

      res.json({
        message: 'User status updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating user status:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Cannot suspend admin')) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to update user status' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;
      const adminId = req.user?.id;

      if (userRole !== 'ADMIN' || !adminId) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const { id: userId } = req.params;

      const result = await adminService.deleteUser(userId, adminId);
      res.json(result);
    } catch (error) {
      console.error('Error deleting user:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Cannot delete admin')) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  async updatePractitionerVerification(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;
      const adminId = req.user?.id;

      if (userRole !== 'ADMIN' || !adminId) {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const { id: practitionerId } = req.params;
      const { verificationStatus } = req.body;

      if (
        !verificationStatus ||
        !['PENDING', 'VERIFIED', 'REJECTED'].includes(verificationStatus)
      ) {
        return res.status(400).json({
          error:
            'Valid verification status is required (PENDING, VERIFIED, REJECTED)',
        });
      }

      const updatedProfile = await adminService.updatePractitionerVerification(
        practitionerId,
        verificationStatus,
        adminId
      );

      res.json({
        message: 'Practitioner verification status updated successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      console.error('Error updating practitioner verification:', error);

      if (
        error instanceof Error &&
        error.message === 'Practitioner not found'
      ) {
        return res.status(404).json({ error: error.message });
      }

      res
        .status(500)
        .json({ error: 'Failed to update practitioner verification' });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;

      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const stats = await adminService.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Failed to get user statistics' });
    }
  }

  async getSystemStats(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;

      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      const stats = await adminService.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting system stats:', error);
      res.status(500).json({ error: 'Failed to get system statistics' });
    }
  }

  async getDashboard(req: Request, res: Response) {
    try {
      const userRole = (req.user as User)?.role;

      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
      }

      // Get combined dashboard data
      const [userStats, systemStats] = await Promise.all([
        adminService.getUserStats(),
        adminService.getSystemStats(),
      ]);

      res.json({
        userStats,
        systemStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  }
}

export const adminController = new AdminController();
