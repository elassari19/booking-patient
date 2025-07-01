import {
  PrismaClient,
  UserStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';

export class AdminService {
  async getAllUsers(filters?: {
    role?: UserRole;
    status?: UserStatus;
    verificationStatus?: VerificationStatus;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      role,
      status,
      verificationStatus,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters || {};

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle verification status filter for practitioners
    if (verificationStatus && role === 'PRACTITIONER') {
      where.practitionerProfile = {
        verificationStatus,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async updateUserStatus(userId: string, status: UserStatus, adminId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent admins from suspending other admins
    if (user.role === 'ADMIN' && status === 'SUSPENDED') {
      throw new Error('Cannot suspend admin users');
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        updatedAt: new Date(),
      },
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

    // Log the action
    await this.logAdminAction(adminId, 'UPDATE_USER_STATUS', {
      targetUserId: userId,
      previousStatus: user.status,
      newStatus: status,
    });

    return updatedUser;
  }

  async deleteUser(userId: string, adminId: string) {
    // Check if user exists
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

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent admins from deleting other admins
    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete admin users');
    }

    // Delete user and related profiles (cascade delete should handle this)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the action
    await this.logAdminAction(adminId, 'DELETE_USER', {
      targetUserId: userId,
      deletedUserData: {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    return { message: 'User deleted successfully' };
  }

  async updatePractitionerVerification(
    practitionerId: string,
    verificationStatus: VerificationStatus,
    adminId: string
  ) {
    // Check if practitioner exists
    const user = await prisma.user.findUnique({
      where: {
        id: practitionerId,
        role: 'PRACTITIONER',
      },
      include: {
        practitionerProfile: true,
      },
    });

    if (!user?.practitionerProfile) {
      throw new Error('Practitioner not found');
    }

    // Update verification status - removed verifiedAt since it doesn't exist in schema
    const updatedProfile = await prisma.practitionerProfile.update({
      where: { id: user.practitionerProfile.id },
      data: {
        verificationStatus,
        // Removed verifiedAt field as it doesn't exist in the current schema
        updatedAt: new Date(), // Use the existing updatedAt field instead
      },
    });

    // Log the action
    await this.logAdminAction(adminId, 'UPDATE_PRACTITIONER_VERIFICATION', {
      targetUserId: practitionerId,
      previousStatus: user.practitionerProfile.verificationStatus,
      newStatus: verificationStatus,
      verificationDate: new Date().toISOString(),
    });

    return updatedProfile;
  }

  async getUserStats() {
    const [
      totalUsers,
      totalPatients,
      totalPractitioners,
      totalAdmins,
      activeUsers,
      suspendedUsers,
      verifiedPractitioners,
      pendingPractitioners,
      recentUsers,
    ] = await Promise.all([
      // Total counts by role
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'PRACTITIONER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),

      // Status counts
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),

      // Practitioner verification stats
      prisma.practitionerProfile.count({
        where: { verificationStatus: 'VERIFIED' },
      }),
      prisma.practitionerProfile.count({
        where: { verificationStatus: 'PENDING' },
      }),

      // Recent registrations (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get user growth data for the last 12 months
    const userGrowthData = await this.getUserGrowthStats();

    return {
      overview: {
        totalUsers,
        totalPatients,
        totalPractitioners,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        recentUsers,
      },
      practitionerStats: {
        verified: verifiedPractitioners,
        pending: pendingPractitioners,
        rejected: await prisma.practitionerProfile.count({
          where: { verificationStatus: 'REJECTED' },
        }),
      },
      userGrowth: userGrowthData,
    };
  }

  private async getUserGrowthStats() {
    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth,
          },
        },
      });

      months.push({
        month: date.toLocaleString('default', {
          month: 'short',
          year: 'numeric',
        }),
        users: count,
      });
    }

    return months;
  }

  private async logAdminAction(adminId: string, action: string, details: any) {
    // Enhanced logging with better error handling
    try {
      console.log('Admin Action:', {
        adminId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });

      // TODO: Implement proper audit logging with database storage
      // You can add this to your Prisma schema if needed:
      /*
      model AdminLog {
        id        String   @id @default(cuid())
        adminId   String
        action    String
        details   Json
        timestamp DateTime @default(now())
        admin     User     @relation(fields: [adminId], references: [id])
      }
      */

      // await prisma.adminLog.create({
      //   data: {
      //     adminId,
      //     action,
      //     details: JSON.stringify(details),
      //     timestamp: new Date(),
      //   },
      // });
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getSystemStats() {
    try {
      const [dbSize, activeConnections, totalSessions] = await Promise.all([
        // Get database size (PostgreSQL specific) - with error handling
        prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size`.catch(
          () => [{ size: 'Unknown' }]
        ),

        // Get active connections - with error handling
        prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`.catch(
          () => [{ count: 0 }]
        ),

        // Get total active users
        prisma.user.count({ where: { status: 'ACTIVE' } }),
      ]);

      return {
        database: {
          size: (dbSize as any)[0]?.size || 'Unknown',
          activeConnections: Number((activeConnections as any)[0]?.count) || 0,
        },
        sessions: {
          total: totalSessions,
          active: totalSessions, // Placeholder - implement proper session tracking
        },
        uptime: Math.floor(process.uptime()),
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
          external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
        },
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        database: {
          size: 'Unknown',
          activeConnections: 0,
        },
        sessions: {
          total: 0,
          active: 0,
        },
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
      };
    }
  }

  // Additional helper method to get pending practitioners for admin review
  async getPendingPractitioners(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [practitioners, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'PRACTITIONER',
          practitionerProfile: {
            verificationStatus: 'PENDING',
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          practitionerProfile: {
            include: {
              education: true,
              certifications: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          role: 'PRACTITIONER',
          practitionerProfile: {
            verificationStatus: 'PENDING',
          },
        },
      }),
    ]);

    return {
      practitioners,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    };
  }
}

export const adminService = new AdminService();
