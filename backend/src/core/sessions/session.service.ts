import { prisma } from '../../lib/prisma';
import type {
  CreateSessionInput,
  SessionFeedbackInput,
  SessionWithDetails,
  BookingWithRelations,
  PaginatedResponse,
} from '../../types/booking';

interface SessionQueryParams {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  practitionerId?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}

export class SessionService {
  // Get sessions with filtering and pagination
  async getSessions(
    userId: string,
    userRole: string,
    queryParams: SessionQueryParams
  ): Promise<PaginatedResponse<SessionWithDetails>> {
    const {
      status,
      startDate,
      endDate,
      practitionerId,
      patientId,
      page = 1,
      limit = 10,
    } = queryParams;

    // Build where clause based on user role
    let whereClause: any = {};

    if (userRole === 'PATIENT') {
      whereClause.booking = {
        patientId: userId,
      };
    } else if (userRole === 'PRACTITIONER') {
      whereClause.booking = {
        practitionerId: userId,
      };
    } else if (userRole === 'ADMIN') {
      // Admin can see all sessions, apply filters if provided
      if (practitionerId) {
        whereClause.booking = {
          practitionerId,
        };
      }
      if (patientId) {
        whereClause.booking = {
          ...whereClause.booking,
          patientId,
        };
      }
    }

    // Apply additional filters
    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.startedAt = {};
      if (startDate) {
        whereClause.startedAt.gte = startDate;
      }
      if (endDate) {
        whereClause.startedAt.lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: whereClause,
        include: {
          booking: {
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.session.count({ where: whereClause }),
    ]);

    return {
      data: sessions as SessionWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Get single session details
  async getSessionById(
    sessionId: string,
    userId: string,
    userRole: string
  ): Promise<SessionWithDetails> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        booking: {
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
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Check access permissions
    if (userRole === 'PATIENT' && session.booking.patientId !== userId) {
      throw new Error('You can only access your own sessions');
    }

    if (
      userRole === 'PRACTITIONER' &&
      session.booking.practitionerId !== userId
    ) {
      throw new Error('You can only access your own sessions');
    }

    return session as SessionWithDetails;
  }

  // Add session notes (practitioner only)
  async addSessionNotes(
    sessionId: string,
    userId: string,
    userRole: string,
    sessionData: {
      notes?: string;
      diagnosis?: string;
      prescription?: string;
      followUpDate?: Date;
    }
  ): Promise<SessionWithDetails> {
    const session = await this.getSessionById(sessionId, userId, userRole);

    // Only practitioners can add notes
    if (userRole !== 'PRACTITIONER') {
      throw new Error('Only practitioners can add session notes');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...sessionData,
        updatedAt: new Date(),
      },
      include: {
        booking: {
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
          },
        },
      },
    });

    return updatedSession as SessionWithDetails;
  }

  // Rate session (patient or practitioner)
  async rateSession(
    sessionId: string,
    userId: string,
    userRole: string,
    feedbackData: SessionFeedbackInput
  ): Promise<SessionWithDetails> {
    const session = await this.getSessionById(sessionId, userId, userRole);

    // Determine which fields to update based on user role
    let updateData: any = {};

    if (userRole === 'PATIENT') {
      updateData = {
        patientRating: feedbackData.patientRating,
        patientFeedback: feedbackData.patientFeedback,
      };
    } else if (userRole === 'PRACTITIONER') {
      updateData = {
        practitionerRating: feedbackData.practitionerRating,
        practitionerFeedback: feedbackData.practitionerFeedback,
      };
    } else {
      throw new Error('Only patients and practitioners can rate sessions');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        booking: {
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
          },
        },
      },
    });

    return updatedSession as SessionWithDetails;
  }

  // Start session (practitioner only)
  async startSession(
    sessionId: string,
    userId: string,
    userRole: string,
    roomId?: string
  ): Promise<SessionWithDetails> {
    const session = await this.getSessionById(sessionId, userId, userRole);

    // Only practitioners can start sessions
    if (userRole !== 'PRACTITIONER') {
      throw new Error('Only practitioners can start sessions');
    }

    // Check if session is in correct status
    if (session.status !== 'SCHEDULED') {
      throw new Error('Session must be scheduled to start');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        roomId: roomId || null,
        updatedAt: new Date(),
      },
      include: {
        booking: {
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
          },
        },
      },
    });

    return updatedSession as SessionWithDetails;
  }

  // End session (practitioner only)
  async endSession(
    sessionId: string,
    userId: string,
    userRole: string
  ): Promise<SessionWithDetails> {
    const session = await this.getSessionById(sessionId, userId, userRole);

    // Only practitioners can end sessions
    if (userRole !== 'PRACTITIONER') {
      throw new Error('Only practitioners can end sessions');
    }

    // Check if session is in progress
    if (session.status !== 'IN_PROGRESS') {
      throw new Error('Session must be in progress to end');
    }

    const endTime = new Date();
    const actualDuration = session.startedAt
      ? Math.floor(
          (endTime.getTime() - session.startedAt.getTime()) / (1000 * 60)
        )
      : null;

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: endTime,
        actualDuration,
        updatedAt: new Date(),
      },
      include: {
        booking: {
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
          },
        },
      },
    });

    // Also update the related booking status
    await prisma.booking.update({
      where: { id: session.bookingId },
      data: { status: 'COMPLETED' },
    });

    return updatedSession as SessionWithDetails;
  }

  // Create session (automatically done when booking is confirmed)
  async createSession(
    sessionData: CreateSessionInput
  ): Promise<SessionWithDetails> {
    const session = await prisma.session.create({
      data: {
        bookingId: sessionData.bookingId,
        status: 'SCHEDULED',
        notes: sessionData.notes,
        diagnosis: sessionData.diagnosis,
        prescription: sessionData.prescription,
        followUpDate: sessionData.followUpDate,
      },
      include: {
        booking: {
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
          },
        },
      },
    });

    return session as SessionWithDetails;
  }
}

export const sessionService = new SessionService();
