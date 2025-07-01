import { PrismaClient, VerificationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class PractitionersService {
  async updateBioAndExperience(
    practitionerId: string,
    data: {
      bio?: string;
      experience?: number;
      specializations?: string[];
      languages?: string[];
      consultationFee?: number;
    }
  ) {
    return await prisma.practitionerProfile.update({
      where: { id: practitionerId },
      data,
    });
  }

  async addEducation(
    practitionerId: string,
    educationData: {
      degree: string;
      institution: string;
      year: number;
    }
  ) {
    return await prisma.education.create({
      data: {
        practitionerId,
        ...educationData,
      },
    });
  }

  async updateEducation(
    educationId: string,
    educationData: {
      degree?: string;
      institution?: string;
      year?: number;
    }
  ) {
    return await prisma.education.update({
      where: { id: educationId },
      data: educationData,
    });
  }

  async deleteEducation(educationId: string) {
    return await prisma.education.delete({
      where: { id: educationId },
    });
  }

  async addCertification(
    practitionerId: string,
    certificationData: {
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate?: Date;
      documentUrl?: string;
    }
  ) {
    return await prisma.certification.create({
      data: {
        practitionerId,
        ...certificationData,
      },
    });
  }

  async updateCertification(
    certificationId: string,
    certificationData: {
      name?: string;
      issuer?: string;
      issueDate?: Date;
      expiryDate?: Date;
      documentUrl?: string;
    }
  ) {
    return await prisma.certification.update({
      where: { id: certificationId },
      data: certificationData,
    });
  }

  async deleteCertification(certificationId: string) {
    return await prisma.certification.delete({
      where: { id: certificationId },
    });
  }

  async updateVerificationStatus(
    practitionerId: string,
    status: VerificationStatus
  ) {
    return await prisma.practitionerProfile.update({
      where: { id: practitionerId },
      data: {
        verificationStatus: status,
      },
    });
  }

  async uploadVerificationDocument(
    practitionerId: string,
    documentUrl: string
  ) {
    const practitioner = await prisma.practitionerProfile.findUnique({
      where: { id: practitionerId },
    });

    if (!practitioner) {
      throw new Error('Practitioner not found');
    }

    const updatedDocuments = [
      ...(practitioner.verificationDocuments || []),
      documentUrl,
    ];

    return await prisma.practitionerProfile.update({
      where: { id: practitionerId },
      data: {
        verificationDocuments: updatedDocuments,
      },
    });
  }

  async removeVerificationDocument(
    practitionerId: string,
    documentUrl: string
  ) {
    const practitioner = await prisma.practitionerProfile.findUnique({
      where: { id: practitionerId },
    });

    if (!practitioner) {
      throw new Error('Practitioner not found');
    }

    const updatedDocuments = practitioner.verificationDocuments.filter(
      (doc) => doc !== documentUrl
    );

    return await prisma.practitionerProfile.update({
      where: { id: practitionerId },
      data: {
        verificationDocuments: updatedDocuments,
      },
    });
  }

  async getSpecializations() {
    // Get all unique specializations from practitioners
    const practitioners = await prisma.practitionerProfile.findMany({
      select: { specializations: true },
    });

    const allSpecializations = practitioners.flatMap((p) => p.specializations);
    return Array.from(new Set(allSpecializations)).sort();
  }

  async searchPractitioners(filters: {
    specialization?: string;
    location?: string;
    verificationStatus?: VerificationStatus;
    minExperience?: number;
    maxFee?: number;
    language?: string;
  }) {
    const where: any = {
      role: 'PRACTITIONER',
      practitionerProfile: {
        is: {},
      },
    };

    if (filters.specialization) {
      where.practitionerProfile.is.specializations = {
        has: filters.specialization,
      };
    }

    if (filters.verificationStatus) {
      where.practitionerProfile.is.verificationStatus =
        filters.verificationStatus;
    }

    if (filters.minExperience !== undefined) {
      where.practitionerProfile.is.experience = {
        gte: filters.minExperience,
      };
    }

    if (filters.maxFee !== undefined) {
      where.practitionerProfile.is.consultationFee = {
        lte: filters.maxFee,
      };
    }

    if (filters.language) {
      where.practitionerProfile.is.languages = {
        has: filters.language,
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

  async getPractitionerById(practitionerId: string) {
    return await prisma.user.findUnique({
      where: {
        id: practitionerId,
        role: 'PRACTITIONER',
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

  async getPractitionerProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user?.practitionerProfile) {
      throw new Error('Practitioner profile not found');
    }

    return user;
  }
}

export const practitionersService = new PractitionersService();
