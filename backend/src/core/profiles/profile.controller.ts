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

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error getting profile:', error);
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
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async getPractitioners(req: Request, res: Response) {
    try {
      const practitioners = await profileService.getPractitioners(req.query);
      res.json(practitioners);
    } catch (error) {
      console.error('Error getting practitioners:', error);
      res.status(500).json({ error: 'Failed to get practitioners' });
    }
  }

  async updateAvailability(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;
      const { availability } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      if (!availability || !Array.isArray(availability)) {
        return res
          .status(400)
          .json({ error: 'Valid availability data is required' });
      }

      const updatedAvailability = await profileService.updateAvailability(
        userId,
        availability
      );

      res.json({
        message: 'Availability updated successfully',
        data: updatedAvailability,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ error: 'Failed to update availability' });
    }
  }

  async uploadFiles(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { fileUrl, fileType } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!fileUrl) {
        return res.status(400).json({ error: 'File URL is required' });
      }

      let result;

      // Determine file type and handle accordingly
      if (fileType === 'profile_image') {
        result = await profileService.uploadProfileImage(userId, fileUrl);
      } else {
        result = await profileService.uploadDocument(
          userId,
          fileUrl,
          fileType || 'general'
        );
      }

      res.json({
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  async uploadProfileImage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { imageUrl } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
      }

      const result = await profileService.uploadProfileImage(userId, imageUrl);

      res.json({
        message: 'Profile image uploaded successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ error: 'Failed to upload profile image' });
    }
  }
}

export const profileController = new ProfileController();
