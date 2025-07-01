import type { Request, Response } from 'express';
import { sessionService } from './session.service';
import type { User } from '@prisma/client';

export class SessionController {
  // GET /sessions - List sessions
  async getSessions(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;

      const queryParams = {
        status: req.query.status as string,
        practitionerId: req.query.practitionerId as string,
        patientId: req.query.patientId as string,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const result = await sessionService.getSessions(
        userId,
        userRole,
        queryParams
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching sessions:', error);

      if (error instanceof Error) {
        if (error.message.includes('access')) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  // GET /sessions/:id/details - Get session details
  async getSessionDetails(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: sessionId } = req.params;

      const session = await sessionService.getSessionById(
        sessionId,
        userId,
        userRole
      );

      res.json({ session });
    } catch (error) {
      console.error('Error fetching session details:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('access')) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to fetch session details' });
    }
  }

  // POST /sessions/:id/notes - Add session notes
  async addSessionNotes(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: sessionId } = req.params;

      const session = await sessionService.addSessionNotes(
        sessionId,
        userId,
        userRole,
        req.body
      );

      res.json({
        message: 'Session notes added successfully',
        session,
      });
    } catch (error) {
      console.error('Error adding session notes:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message.includes('access') ||
          error.message.includes('Only')
        ) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to add session notes' });
    }
  }

  // POST /sessions/:id/rating - Rate session
  async rateSession(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: sessionId } = req.params;

      const session = await sessionService.rateSession(
        sessionId,
        userId,
        userRole,
        req.body
      );

      res.json({
        message: 'Session rating added successfully',
        session,
      });
    } catch (error) {
      console.error('Error rating session:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message.includes('access') ||
          error.message.includes('Only')
        ) {
          return res.status(403).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to rate session' });
    }
  }

  // POST /sessions/:id/start - Start session
  async startSession(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: sessionId } = req.params;
      const { roomId } = req.body;

      const session = await sessionService.startSession(
        sessionId,
        userId,
        userRole,
        roomId
      );

      res.json({
        message: 'Session started successfully',
        session,
      });
    } catch (error) {
      console.error('Error starting session:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message.includes('access') ||
          error.message.includes('Only')
        ) {
          return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('must be')) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to start session' });
    }
  }

  // POST /sessions/:id/end - End session
  async endSession(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: sessionId } = req.params;

      const session = await sessionService.endSession(
        sessionId,
        userId,
        userRole
      );

      res.json({
        message: 'Session ended successfully',
        session,
      });
    } catch (error) {
      console.error('Error ending session:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (
          error.message.includes('access') ||
          error.message.includes('Only')
        ) {
          return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('must be')) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to end session' });
    }
  }
}

export const sessionController = new SessionController();
