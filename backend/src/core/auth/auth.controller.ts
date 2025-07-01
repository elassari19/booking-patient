import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from './auth.service';
import type {
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from './auth.schema';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData: RegisterInput = req.body;
      const user = await AuthService.register(userData);

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({
          user,
          message:
            'Registration successful. Please check your email to verify your account.',
        });
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        return res.status(409).json({ message: error.message });
      }
      if (error.message === 'Invalid input data') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message });
      }

      req.login(user, (err) => {
        if (err) return next(err);

        const { password, ...userWithoutPassword } = user;
        return res.json({
          user: userWithoutPassword,
          message: 'Login successful',
        });
      });
    })(req, res, next);
  }

  static logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        console.log('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          console.log('Session destruction error:', err);
          return res.status(500).json({ error: 'Session destruction failed' });
        }

        // Clear all possible session cookies
        res.clearCookie('connect.sid', { path: '/' });
        res.clearCookie('session', { path: '/' });
        res.clearCookie('user', { path: '/' });
        res.clearCookie('session.sig', { path: '/' });
        res.clearCookie('user.sig', { path: '/' });

        return res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  }

  static async getCurrentUser(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await AuthService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  }

  static checkSession(req: Request, res: Response) {
    if (req.isAuthenticated()) {
      res.json({ authenticated: true, user: req.user });
    } else {
      res.json({ authenticated: false });
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email }: ForgotPasswordInput = req.body;
      const result = await AuthService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password }: ResetPasswordInput = req.body;
      const result = await AuthService.resetPassword(token, password);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Invalid or expired reset token') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token }: VerifyEmailInput = req.body;
      const result = await AuthService.verifyEmail(token);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Invalid or expired verification token') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  static async resendVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email }: ResendVerificationInput = req.body;
      const result = await AuthService.resendVerification(email);
      res.json(result);
    } catch (error: any) {
      if (
        error.message === 'User not found' ||
        error.message === 'Email already verified'
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
}
