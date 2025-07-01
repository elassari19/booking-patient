import { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class ProfileService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        practitionerProfile: {
          include: {
            education: true,
            certifications: true,
            availability: true,
          },
        },
        adminProfile: true,
      },
    });
    return user;
  }

  async updatePatientProfile(userId: string, data: any) {
    return await prisma.patientProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async updatePractitionerProfile(userId: string, data: any) {
    return await prisma.practitionerProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async updateAdminProfile(userId: string, data: any) {
    return await prisma.adminProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getPractitioners(filters?: any) {
    const where: any = {
      role: 'PRACTITIONER',
    };

    // Add filters
    if (filters?.specialization) {
      where.practitionerProfile = {
        specializations: {
          has: filters.specialization,
        },
      };
    }

    if (filters?.verificationStatus) {
      where.practitionerProfile = {
        ...where.practitionerProfile,
        verificationStatus: filters.verificationStatus,
      };
    }

    return await prisma.user.findMany({
      where,
      include: {
        practitionerProfile: {
          include: {
            education: true,
            certifications: true,
            availability: true,
          },
        },
      },
    });
  }

  async updateAvailability(userId: string, availabilityData: any[]) {
    // First, find the practitioner profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { practitionerProfile: true },
    });

    if (!user?.practitionerProfile) {
      throw new Error('Practitioner profile not found');
    }

    const practitionerId = user.practitionerProfile.id;

    // Delete existing availability
    await prisma.availability.deleteMany({
      where: { practitionerId },
    });

    // Create new availability
    return await prisma.availability.createMany({
      data: availabilityData.map((item) => ({
        practitionerId,
        ...item,
      })),
    });
  }

  async uploadProfileImage(userId: string, imageUrl: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    switch (user.role) {
      case 'PATIENT':
        return await prisma.patientProfile.upsert({
          where: { userId },
          update: { profileImage: imageUrl },
          create: { userId, profileImage: imageUrl },
        });
      case 'PRACTITIONER':
        return await prisma.practitionerProfile.upsert({
          where: { userId },
          update: { profileImage: imageUrl },
          create: { userId, profileImage: imageUrl, licenseNumber: '' },
        });
      case 'ADMIN':
        return await prisma.adminProfile.upsert({
          where: { userId },
          update: { profileImage: imageUrl },
          create: { userId, profileImage: imageUrl },
        });
      default:
        throw new Error('Invalid user role');
    }
  }

  async uploadDocument(
    userId: string,
    documentUrl: string,
    documentType: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        practitionerProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'PRACTITIONER' && user.practitionerProfile) {
      // For practitioners, add to verification documents
      const currentDocs = user.practitionerProfile.verificationDocuments || [];
      const updatedDocs = [...currentDocs, documentUrl];

      return await prisma.practitionerProfile.update({
        where: { id: user.practitionerProfile.id },
        data: {
          verificationDocuments: updatedDocs,
        },
      });
    }

    // For other roles or general documents, you might want to create a separate Document model
    // For now, we'll return a success message
    return { message: 'Document uploaded successfully', documentUrl };
  }
}

export const profileService = new ProfileService();
