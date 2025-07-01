import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
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
      },
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check if account is suspended
        if (user.status === 'SUSPENDED') {
          return done(null, false, {
            message: 'Your account has been suspended. Please contact support.',
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Return user without sensitive fields and convert null to undefined
        const {
          password: _,
          emailVerifyToken,
          emailVerifyExpires,
          passwordResetToken,
          passwordResetExpires,
          ...userData
        } = user;

        // Convert null values to undefined for Passport compatibility
        const safeUser = {
          ...userData,
          firstName: userData.firstName ?? undefined,
          lastName: userData.lastName ?? undefined,
          name: userData.name ?? undefined,
          lastLoginAt: userData.lastLoginAt ?? undefined,
        };

        return done(null, safeUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
