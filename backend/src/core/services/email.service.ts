import nodemailer from 'nodemailer';
import type { UserRole } from '@prisma/client';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailVerificationData {
  firstName: string;
  verificationUrl: string;
}

interface PasswordResetData {
  firstName: string;
  resetUrl: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Patient Booking'}" <${
          process.env.SMTP_FROM || process.env.SMTP_USER
        }>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendEmailVerification(
    email: string,
    data: EmailVerificationData
  ): Promise<void> {
    const html = this.getEmailVerificationTemplate(data);

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text: `Hi ${data.firstName}, please verify your email by clicking: ${data.verificationUrl}`,
    });
  }

  async sendPasswordReset(
    email: string,
    data: PasswordResetData
  ): Promise<void> {
    const html = this.getPasswordResetTemplate(data);

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
      text: `Hi ${data.firstName}, reset your password by clicking: ${data.resetUrl}`,
    });
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    role: UserRole
  ): Promise<void> {
    const html = this.getWelcomeTemplate(firstName, role);

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Patient Booking!',
      html,
      text: `Welcome ${firstName}! Your account has been created successfully.`,
    });
  }

  private getEmailVerificationTemplate(data: EmailVerificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #007bff;">Verify Your Email Address</h2>
            <p>Hi ${data.firstName},</p>
            <p>Thank you for registering with Patient Booking. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${data.verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This email was sent by Patient Booking. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(data: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc3545;">Reset Your Password</h2>
            <p>Hi ${data.firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc3545;">${data.resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This email was sent by Patient Booking. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeTemplate(firstName: string, role: UserRole): string {
    const roleMessages = {
      PATIENT: 'You can now book appointments with our verified practitioners.',
      PRACTITIONER:
        "Your account is pending verification. We'll notify you once it's approved.",
      ADMIN: 'You have administrative access to manage the platform.',
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Patient Booking</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">Welcome to Patient Booking!</h2>
            <p>Hi ${firstName},</p>
            <p>Welcome to Patient Booking! Your account has been successfully created.</p>
            <p><strong>Account Type:</strong> ${role}</p>
            <p>${roleMessages[role]}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This email was sent by Patient Booking. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

export default new EmailService();
