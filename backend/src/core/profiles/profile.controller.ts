import type { Request, Response } from 'express';
import { profileService } from './profile.services';
import type { User } from '@prisma/client';

export class ProfileController {
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const profile = await profileService.getProfile(userId);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let updatedProfile;
      switch (userRole) {
        case 'PATIENT':
          updatedProfile = await profileService.updatePatientProfile(
            userId,
            req.body
          );
          break;
        case 'PRACTITIONER':
          updatedProfile = await profileService.updatePractitionerProfile(
            userId,
            req.body
          );
          break;
        case 'ADMIN':
          updatedProfile = await profileService.updateAdminProfile(
            userId,
            req.body
          );
          break;
        default:
          return res.status(400).json({ error: 'Invalid user role' });
      }

      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async getPractitioners(req: Request, res: Response) {
    try {
      const practitioners = await profileService.getPractitioners(req.query);
      res.json(practitioners);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get practitioners' });
    }
  }

  async updateAvailability(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { availability } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updatedAvailability = await profileService.updateAvailability(
        userId,
        availability
      );
      res.json(updatedAvailability);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update availability' });
    }
  }

  async uploadFiles(req: Request, res: Response) {
    try {
      // Implement file upload logic here
      // This would typically involve multer middleware and cloud storage
      res.json({ message: 'File upload endpoint - to be implemented' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload files' });
    }
  }
}

export const profileController = new ProfileController();
