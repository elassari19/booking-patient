import type { Request, Response } from 'express';
import { bookingService } from './booking.service';
import type { User } from '@prisma/client';

export class BookingController {
  // POST /bookings - Create booking
  async createBooking(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;

      // Only patients can create bookings
      if (userRole !== 'PATIENT') {
        return res
          .status(403)
          .json({ error: 'Only patients can create bookings' });
      }

      const booking = await bookingService.createBooking(userId, req.body);

      res.status(201).json({
        message: 'Booking created successfully',
        booking,
      });
    } catch (error) {
      console.error('Error creating booking:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('not available')
        ) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  // GET /bookings - List user bookings
  async getBookings(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;

      const queryParams = {
        status: req.query.status as any,
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

      const result = await bookingService.getBookings(
        userId,
        userRole,
        queryParams
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  // GET /bookings/:id - Get single booking
  async getBookingById(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: bookingId } = req.params;

      const booking = await bookingService.getBookingById(
        bookingId,
        userId,
        userRole
      );

      res.json(booking);
    } catch (error) {
      console.error('Error fetching booking:', error);

      if (error instanceof Error && error.message === 'Booking not found') {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: 'Failed to fetch booking' });
    }
  }

  // PUT /bookings/:id/status - Update booking status
  async updateBookingStatus(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: bookingId } = req.params;

      const booking = await bookingService.updateBookingStatus(
        bookingId,
        userId,
        userRole,
        req.body
      );

      res.json({
        message: 'Booking status updated successfully',
        booking,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('cannot')) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to update booking status' });
    }
  }

  // DELETE /bookings/:id - Cancel booking
  async cancelBooking(req: Request, res: Response) {
    try {
      const user = req.user as User;
      const userId = user.id;
      const userRole = user.role;
      const { id: bookingId } = req.params;
      const { cancellationReason } = req.body;

      await bookingService.cancelBooking(
        bookingId,
        userId,
        userRole,
        cancellationReason
      );

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling booking:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Cannot cancel')) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  }

  // GET /availability/:practitionerId - Get availability
  async getPractitionerAvailability(req: Request, res: Response) {
    try {
      const { practitionerId } = req.params;
      const date = req.query.date
        ? new Date(req.query.date as string)
        : undefined;

      const availability = await bookingService.getPractitionerAvailability(
        practitionerId,
        date
      );

      res.json(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ error: 'Failed to fetch availability' });
    }
  }
}

export const bookingController = new BookingController();
