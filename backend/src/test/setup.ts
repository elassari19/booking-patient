import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to the database
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up the database before each test
  const tables = ['User'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
});

afterAll(async () => {
  // Disconnect from the database
  await prisma.$disconnect();
});

// Increase the timeout for all tests
jest.setTimeout(30000);
