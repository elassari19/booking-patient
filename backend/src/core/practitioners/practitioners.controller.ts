import type { Request, Response } from 'express';
import { practitionersService } from './practitioners.service';
import { prisma } from '../../lib/prisma';
import type { User } from '@prisma/client';

export class PractitionersController {
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;

      if (!userId || userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      const profile = await practitionersService.getPractitionerProfile(userId);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get practitioner profile' });
    }
  }

  async updateBioAndExperience(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;

      if (!userId || userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      const user = await practitionersService.getPractitionerProfile(userId);

      const updatedProfile = await practitionersService.updateBioAndExperience(
        user.practitionerProfile!.id,
        req.body
      );

      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update bio and experience' });
    }
  }

  async addEducation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;

      if (!userId || userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      const user = await practitionersService.getPractitionerProfile(userId);

      const education = await practitionersService.addEducation(
        user.practitionerProfile!.id,
        req.body
      );

      res.status(201).json(education);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add education' });
    }
  }

  async updateEducation(req: Request, res: Response) {
    try {
      const { educationId } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const education = await prisma.education.findUnique({
        where: { id: educationId },
        include: {
          practitioner: {
            include: { user: true },
          },
        },
      });

      if (!education || education.practitioner.user.id !== userId) {
        return res.status(404).json({ error: 'Education record not found' });
      }

      const updatedEducation = await practitionersService.updateEducation(
        educationId,
        req.body
      );

      res.json(updatedEducation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update education' });
    }
  }

  async deleteEducation(req: Request, res: Response) {
    try {
      const { educationId } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const education = await prisma.education.findUnique({
        where: { id: educationId },
        include: {
          practitioner: {
            include: { user: true },
          },
        },
      });

      if (!education || education.practitioner.user.id !== userId) {
        return res.status(404).json({ error: 'Education record not found' });
      }

      await practitionersService.deleteEducation(educationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete education' });
    }
  }

  async addCertification(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;

      if (!userId || userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      const user = await practitionersService.getPractitionerProfile(userId);

      const certification = await practitionersService.addCertification(
        user.practitionerProfile!.id,
        req.body
      );

      res.status(201).json(certification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add certification' });
    }
  }

  async updateCertification(req: Request, res: Response) {
    try {
      const { certificationId } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const certification = await prisma.certification.findUnique({
        where: { id: certificationId },
        include: {
          practitioner: {
            include: { user: true },
          },
        },
      });

      if (!certification || certification.practitioner.user.id !== userId) {
        return res.status(404).json({ error: 'Certification not found' });
      }

      const updatedCertification =
        await practitionersService.updateCertification(
          certificationId,
          req.body
        );

      res.json(updatedCertification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update certification' });
    }
  }

  async deleteCertification(req: Request, res: Response) {
    try {
      const { certificationId } = req.params;
      const userId = req.user?.id;

      // Verify ownership
      const certification = await prisma.certification.findUnique({
        where: { id: certificationId },
        include: {
          practitioner: {
            include: { user: true },
          },
        },
      });

      if (!certification || certification.practitioner.user.id !== userId) {
        return res.status(404).json({ error: 'Certification not found' });
      }

      await practitionersService.deleteCertification(certificationId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete certification' });
    }
  }

  async updateAvailability(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;
      const { availability } = req.body;

      if (!userId || userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      const user = await practitionersService.getPractitionerProfile(userId);

      const updatedAvailability = await practitionersService.updateAvailability(
        user.practitionerProfile!.id,
        availability
      );

      res.json(updatedAvailability);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update availability' });
    }
  }

  async uploadVerificationDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = (req.user as User)?.role;

      if (!userId || userRole !== 'PRACTITIONER') {
        return res
          .status(403)
          .json({ error: 'Access denied. Practitioners only.' });
      }

      const user = await practitionersService.getPractitionerProfile(userId);

      // This is a placeholder - implement actual file upload logic
      // You would typically use multer middleware and cloud storage here
      const documentUrl = req.body.documentUrl || 'placeholder-url';

      const updatedProfile =
        await practitionersService.uploadVerificationDocument(
          user.practitionerProfile!.id,
          documentUrl
        );

      res.json({
        message: 'Document uploaded successfully',
        profile: updatedProfile,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }

  // Public endpoints
  async getSpecializations(req: Request, res: Response) {
    try {
      const specializations = await practitionersService.getSpecializations();
      res.json(specializations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get specializations' });
    }
  }

  async searchPractitioners(req: Request, res: Response) {
    try {
      const filters = {
        specialization: req.query.specialization as string,
        location: req.query.location as string,
        verificationStatus: req.query.verificationStatus as any,
        minExperience: req.query.minExperience
          ? parseInt(req.query.minExperience as string)
          : undefined,
        maxFee: req.query.maxFee
          ? parseFloat(req.query.maxFee as string)
          : undefined,
        language: req.query.language as string,
      };

      const practitioners = await practitionersService.searchPractitioners(
        filters
      );
      res.json(practitioners);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search practitioners' });
    }
  }

  async getPractitionerById(req: Request, res: Response) {
    try {
      const { practitionerId } = req.params;

      const practitioner = await practitionersService.getPractitionerById(
        practitionerId
      );

      if (!practitioner) {
        return res.status(404).json({ error: 'Practitioner not found' });
      }

      res.json(practitioner);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get practitioner' });
    }
  }
}

export const practitionersController = new PractitionersController();
