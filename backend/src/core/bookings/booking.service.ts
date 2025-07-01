import { prisma } from '../../lib/prisma';
import type {
  CreateBookingInput,
  UpdateBookingInput,
  BookingQueryParams,
  BookingWithRelations,
  PaginatedResponse,
} from '../../types/booking';
import { sessionService } from '../sessions/session.service';

export class BookingService {
  // Create a new booking
  async createBooking(
    patientId: string,
    bookingData: CreateBookingInput
  ): Promise<BookingWithRelations> {
    const {
      practitionerId,
      bookingDate,
      duration = 60,
      sessionType = 'VIDEO_CALL',
      patientNotes,
    } = bookingData;

    // Check if practitioner exists and is verified
    const practitioner = await prisma.user.findFirst({
      where: {
        id: practitionerId,
        role: 'PRACTITIONER',
        practitionerProfile: {
          verificationStatus: 'VERIFIED',
        },
      },
      include: {
        practitionerProfile: true,
      },
    });

    if (!practitioner) {
      throw new Error('Practitioner not found or not verified');
    }

    // Check if the time slot is available
    const bookingDateTime = new Date(bookingDate);
    const existingBooking = await prisma.booking.findFirst({
      where: {
        practitionerId,
        bookingDate: bookingDateTime,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (existingBooking) {
      throw new Error('Time slot is not available');
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        patientId,
        practitionerId,
        bookingDate: bookingDateTime,
        duration,
        sessionType,
        patientNotes,
        fee: practitioner.practitionerProfile?.consultationFee || 0,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            patientProfile: {
              select: {
                profileImage: true,
                phone: true,
              },
            },
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            practitionerProfile: {
              select: {
                specializations: true,
                profileImage: true,
                bio: true,
              },
            },
          },
        },
        session: true,
      },
    });

    // Create a corresponding session
    await prisma.session.create({
      data: {
        bookingId: booking.id,
        status: 'SCHEDULED',
      },
    });

    return booking as BookingWithRelations;
  }

  // Get bookings with filtering and pagination
  async getBookings(
    userId: string,
    userRole: string,
    queryParams: BookingQueryParams
  ): Promise<PaginatedResponse<BookingWithRelations>> {
    const {
      status,
      practitionerId,
      patientId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = queryParams;

    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause: any = {};

    if (userRole === 'PATIENT') {
      whereClause.patientId = userId;
    } else if (userRole === 'PRACTITIONER') {
      whereClause.practitionerId = userId;
    } else if (userRole === 'ADMIN') {
      // Admin can see all bookings
      if (practitionerId) whereClause.practitionerId = practitionerId;
      if (patientId) whereClause.patientId = patientId;
    }

    // Add additional filters
    if (status) whereClause.status = status;
    if (startDate || endDate) {
      whereClause.bookingDate = {};
      if (startDate) whereClause.bookingDate.gte = new Date(startDate);
      if (endDate) whereClause.bookingDate.lte = new Date(endDate);
    }

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { bookingDate: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              patientProfile: {
                select: {
                  profileImage: true,
                  phone: true,
                },
              },
            },
          },
          practitioner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              practitionerProfile: {
                select: {
                  specializations: true,
                  profileImage: true,
                  bio: true,
                },
              },
            },
          },
          session: true,
        },
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: bookings as BookingWithRelations[],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Get single booking
  async getBookingById(
    bookingId: string,
    userId: string,
    userRole: string
  ): Promise<BookingWithRelations> {
    let whereClause: any = { id: bookingId };

    // Role-based access control
    if (userRole === 'PATIENT') {
      whereClause.patientId = userId;
    } else if (userRole === 'PRACTITIONER') {
      whereClause.practitionerId = userId;
    }
    // Admin can access any booking

    const booking = await prisma.booking.findFirst({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            patientProfile: {
              select: {
                profileImage: true,
                phone: true,
              },
            },
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            practitionerProfile: {
              select: {
                specializations: true,
                profileImage: true,
                bio: true,
              },
            },
          },
        },
        session: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking as BookingWithRelations;
  }

  // Update booking status
  async updateBookingStatus(
    bookingId: string,
    userId: string,
    userRole: string,
    updateData: UpdateBookingInput
  ): Promise<BookingWithRelations> {
    const booking = await this.getBookingById(bookingId, userId, userRole);

    // Only practitioner or admin can update status
    if (userRole === 'PATIENT' && updateData.status) {
      throw new Error('Patients cannot update booking status');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...updateData,
        ...(updateData.status === 'CANCELLED' && {
          cancelledAt: new Date(),
          cancelledBy: userId,
        }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            patientProfile: {
              select: {
                profileImage: true,
                phone: true,
              },
            },
          },
        },
        practitioner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            practitionerProfile: {
              select: {
                specializations: true,
                profileImage: true,
                bio: true,
              },
            },
          },
        },
        session: true,
      },
    });

    // Create session when booking is confirmed
    if (updateData.status === 'CONFIRMED' && !updatedBooking.session) {
      await sessionService.createSession({
        bookingId: updatedBooking.id,
      });
    }

    // Update session status if booking is cancelled
    if (updateData.status === 'CANCELLED') {
      await prisma.session.updateMany({
        where: { bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    return updatedBooking as BookingWithRelations;
  }

  // Cancel booking
  async cancelBooking(
    bookingId: string,
    userId: string,
    userRole: string,
    cancellationReason?: string
  ): Promise<void> {
    const booking = await this.getBookingById(bookingId, userId, userRole);

    // Check if booking can be cancelled
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      throw new Error('Cannot cancel this booking');
    }

    // Check cancellation policy (e.g., 24 hours before)
    const bookingTime = new Date(booking.bookingDate);
    const now = new Date();
    const hoursDifference =
      (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24 && userRole === 'PATIENT') {
      throw new Error(
        'Cannot cancel booking less than 24 hours before appointment'
      );
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason,
      },
    });

    // Cancel the session
    await prisma.session.updateMany({
      where: { bookingId },
      data: { status: 'CANCELLED' },
    });
  }

  // Get practitioner availability
  async getPractitionerAvailability(practitionerId: string, date?: Date) {
    const startDate = date ? new Date(date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // Next 30 days

    // Get practitioner's availability schedule
    const availability = await prisma.availability.findMany({
      where: { practitionerId },
    });

    // Get existing bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        practitionerId,
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        bookingDate: true,
        duration: true,
      },
    });

    // Generate available time slots
    const timeSlots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayAvailability = availability.find(
        (a) => a.dayOfWeek === dayOfWeek
      );

      if (dayAvailability && dayAvailability.isAvailable) {
        const slots = this.generateTimeSlotsForDay(
          currentDate,
          dayAvailability.startTime,
          dayAvailability.endTime,
          existingBookings
        );
        timeSlots.push(...slots);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return timeSlots;
  }

  // Helper method to generate time slots for a day
  private generateTimeSlotsForDay(
    date: Date,
    startTime: string,
    endTime: string,
    existingBookings: any[]
  ) {
    const slots = [];
    const slotDuration = 60; // 1 hour slots

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const currentSlot = new Date(startDateTime);

    while (currentSlot < endDateTime) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if slot conflicts with existing booking
      const isBooked = existingBookings.some((booking) => {
        const bookingStart = new Date(booking.bookingDate);
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration);

        return (
          (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd)
        );
      });

      slots.push({
        id: `${
          date.toISOString().split('T')[0]
        }-${currentSlot.getHours()}:${currentSlot
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        practitionerId: '',
        date: date.toISOString(),
        startTime: `${currentSlot.getHours()}:${currentSlot
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        endTime: `${slotEnd.getHours()}:${slotEnd
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
        isAvailable: !isBooked,
        isBooked,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
    }

    return slots;
  }
}

export const bookingService = new BookingService();
