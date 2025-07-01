import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import emailService from '../services/email.service';
import type {
  RegisterInput,
  UpdateProfileInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from './auth.schema';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Register a new user with role-based profile creation
   */
  static async register(userData: RegisterInput) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Generate email verification token
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');
      const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with transaction to ensure data consistency
      const user = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: `${userData.firstName} ${userData.lastName}`, // For backward compatibility
            role: userData.role as UserRole,
            status: UserStatus.PENDING,
            emailVerifyToken,
            emailVerifyExpires,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            isEmailVerified: true,
            createdAt: true,
          },
        });

        // Create role-specific profile
        switch (userData.role) {
          case 'PATIENT':
            await tx.patientProfile.create({
              data: { userId: newUser.id },
            });
            break;
          case 'PRACTITIONER':
            await tx.practitionerProfile.create({
              data: { userId: newUser.id },
            });
            break;
          case 'ADMIN':
            await tx.adminProfile.create({
              data: { userId: newUser.id },
            });
            break;
        }

        // Create default subscription for patients
        if (userData.role === 'PATIENT') {
          await tx.subscription.create({
            data: {
              userId: newUser.id,
              plan: 'Basic',
              status: 'active',
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          });
        }

        return newUser;
      });

      // Send verification email
      await this.sendVerificationEmail(
        user.email,
        user.firstName!,
        emailVerifyToken
      );

      return user;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid input data');
      }
      throw error;
    }
  }

  /**
   * Validate user credentials and update last login
   */
  static async validateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: true,
        practitionerProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      return null;
    }

    // Check if user is active
    if (
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.INACTIVE
    ) {
      throw new Error('Account is suspended or inactive');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const {
      password: _,
      emailVerifyToken,
      emailVerifyExpires,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitive
    } = user;
    return userWithoutSensitive;
  }

  /**
   * Get user by ID with profile data
   */
  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        patientProfile: true,
        practitionerProfile: true,
        adminProfile: true,
        subscription: true,
      },
    });
  }

  /**
   * Send email verification
   */
  static async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string
  ) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await emailService.sendEmailVerification(email, {
      firstName,
      verificationUrl,
    });
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.firstName!, user.role);

    return { message: 'Email verified successfully' };
  }

  /**
   * Initiate password reset
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return {
        message:
          'If an account with that email exists, we sent a password reset link',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordReset(email, {
      firstName: user.firstName!,
      resetUrl,
    });

    return {
      message:
        'If an account with that email exists, we sent a password reset link',
    };
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Resend verification email
   */
  static async resendVerification(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new token
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken,
        emailVerifyExpires,
      },
    });

    await this.sendVerificationEmail(
      user.email,
      user.firstName!,
      emailVerifyToken
    );

    return { message: 'Verification email sent' };
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        name:
          data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return user;
  }
}
