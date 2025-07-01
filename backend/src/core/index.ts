import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { errorHandler, notFoundHandler } from './errors';
import { prisma } from '../lib/prisma';
import { initializeSocketServer } from './socket/socket.server';

// Import passport configuration
import './auth/passport.config';

// Import routes
import usersRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import practitionersRoutes from './practitioners/practitioners.routes';
import profileRoutes from './profiles/profile.routes';
import adminRoutes from './admin/admin.routes';
import adminDirectRoutes from './admin/admin.routes';
import bookingRoutes from './bookings/booking.routes';
import sessionRoutes from './sessions/session.routes';

import { redisSession } from '../utils/redis.config';
import { redisClient } from '../lib/redis';

export const createApp = async () => {
  /* CONFIGURATIONS */
  const app = express();

  // Create HTTP server for Socket.IO
  const httpServer = createServer(app);

  app.use(express.json());
  app.use(cookieParser());

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }

  // Test Redis connection
  try {
    await redisClient.ping();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }

  // Middleware
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // CORS configuration
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      exposedHeaders: ['set-cookie'],
    })
  );

  // Add session middleware before passport
  app.use(redisSession);

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Initialize Socket.IO server
  const socketServer = initializeSocketServer(httpServer);
  console.log('✅ Socket.IO server initialized');

  // Routes
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/api/practitioners', practitionersRoutes);
  app.use('/api', profileRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/admin', adminDirectRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/sessions', sessionRoutes);

  // Root route should be defined before error handlers
  app.get('/', async (req, res) => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        message: 'Patient Booking Backend API',
        database: 'Connected to PostgreSQL',
        realtime: 'Socket.IO Ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server running but database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    console.log('Database disconnected');
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    console.log('Database disconnected');
  });

  return { app, httpServer, socketServer };
};
