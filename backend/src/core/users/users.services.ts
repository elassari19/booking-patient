import { PrismaClient, type User } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async findAll(): Promise<User[]> {
    return await prisma.user.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  async create(userData: User): Promise<User> {
    if (
      !userData.email ||
      !userData.firstName ||
      !userData.lastName ||
      !userData.password
    ) {
      throw new Error('Missing required fields');
    }

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    return await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
      },
    });
  }

  async update(id: string, userData: User): Promise<User | null> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...userData,
          updatedAt: new Date(),
        },
      });
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const userService = new UserService();
