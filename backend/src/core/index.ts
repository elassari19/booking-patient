import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { errorHandler, notFoundHandler } from './errors';
import { prisma } from '../lib/prisma';

// Import passport configuration
import './auth/passport.config';

// Import routes
import usersRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import practitionersRoutes from './practitioners/practitioners.routes';
import profileRoutes from './profiles/profile.routes';
import adminRoutes from './admin/admin.routes';
import adminDirectRoutes from './admin/admin.routes'; // New direct routes

import { redisSession } from '../utils/redis.config';
import { redisClient } from '../lib/redis';

export const createApp = async () => {
  /* CONFIGURATIONS */
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    })
  );
  app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
  app.use(morgan('common'));
  app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for screenshots
  app.use(bodyParser.urlencoded({ extended: false }));

  // CORS configuration - remove the previous app.use(cors()) call
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

  // Routes
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/api/practitioners', practitionersRoutes);
  app.use('/api', profileRoutes);
  app.use('/api/admin', adminRoutes); // Existing admin routes with /api prefix
  app.use('/admin', adminDirectRoutes); // New direct admin routes to match task requirements

  // Initialize Apollo Server - await it properly
  // await createApolloServer(app);
  // console.log('GraphQL server initialized');

  // Root route should be defined before error handlers
  app.get('/', async (req, res) => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        message:
          'Greetings from scrapper backend! Visit /graphql to access the GraphQL playground.',
        database: 'Connected to PostgreSQL',
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

  return app;
};
