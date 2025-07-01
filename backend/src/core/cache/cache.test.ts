import request from 'supertest';
import { createApp } from '@/core';
import { RedisService } from './redis.service';

let app: ReturnType<typeof createApp>;
let redisService: RedisService;

describe('Cache Middleware', () => {
  beforeAll(() => {
    app = createApp();
    redisService = RedisService.getInstance();
  });

  beforeEach(async () => {
    await redisService.flushAll();
  });

  afterAll(async () => {
    await redisService.flushAll();
    await redisService.getClient().quit();
  });

  describe('GET /users', () => {
    it('should cache the response', async () => {
      // First request - should not be cached
      const firstResponse = await request(app).get('/users').expect(200);

      const cacheKey = 'cache:/users';
      const cachedData = await redisService.get(cacheKey);

      expect(cachedData).toBeTruthy();
      expect(JSON.parse(cachedData!)).toEqual(firstResponse.body);
    });

    it('should invalidate cache on POST', async () => {
      // Create initial cache
      await request(app).get('/users').expect(200);

      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      // Create new user should invalidate cache
      await request(app).post('/users').send(newUser).expect(201);

      const cacheKey = 'cache:/users';
      const cachedData = await redisService.get(cacheKey);

      expect(cachedData).toBeNull();
    });
  });

  describe('GET /users/:id', () => {
    it('should cache individual user responses', async () => {
      // Create a user first
      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const createResponse = await request(app)
        .post('/users')
        .send(newUser)
        .expect(201);

      const userId = createResponse.body.id;

      // First request to get user
      const firstResponse = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      const cacheKey = `cache:/users/${userId}`;
      const cachedData = await redisService.get(cacheKey);

      expect(cachedData).toBeTruthy();
      expect(JSON.parse(cachedData!)).toEqual(firstResponse.body);
    });

    it('should invalidate cache on PUT', async () => {
      // Create a user first
      const newUser = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const createResponse = await request(app)
        .post('/users')
        .send(newUser)
        .expect(201);

      const userId = createResponse.body.id;

      // Create initial cache
      await request(app).get(`/users/${userId}`).expect(200);

      // Update user should invalidate cache
      await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const cacheKey = `cache:/users/${userId}`;
      const cachedData = await redisService.get(cacheKey);

      expect(cachedData).toBeNull();
    });
  });
});
