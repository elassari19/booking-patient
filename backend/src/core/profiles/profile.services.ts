import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    return await prisma.user.findMany({
      where: {
        role: 'PRACTITIONER',
        ...filters,
      },
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

  async updateAvailability(practitionerId: string, availabilityData: any[]) {
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
}

export const profileService = new ProfileService();
