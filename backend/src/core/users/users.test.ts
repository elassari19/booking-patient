import request from 'supertest';
import { createApp } from '@/core';

let app: ReturnType<typeof createApp>;

describe('User Routes', () => {
  let testUserId: string;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      testUserId = response.body.id;
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        // Missing password
      };

      await request(app).post('/users').send(invalidData).expect(400);
    });
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const response = await request(app).get('/users').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /users/:id', () => {
    it('should return a specific user', async () => {
      const response = await request(app)
        .get(`/users/${testUserId}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app).get('/users/nonexistent-id').expect(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put(`/users/${testUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/users/nonexistent-id')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', async () => {
      await request(app).delete(`/users/${testUserId}`).expect(200);

      // Verify user is deleted
      await request(app).get(`/users/${testUserId}`).expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app).delete('/users/nonexistent-id').expect(404);
    });
  });
});
