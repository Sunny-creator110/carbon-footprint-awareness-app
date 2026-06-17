const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

// Mock User model
jest.mock('../models/User');

describe('Auth Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should register a new user successfully with valid inputs', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'mockuser123',
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Jane Doe');
    expect(res.body.data.email).toBe('jane@example.com');
    expect(res.body.data).toHaveProperty('token');
  });

  test('should reject registration if email already exists', async () => {
    User.findOne.mockResolvedValue({ email: 'jane@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('exists');
  });

  test('should reject registration with invalid email or short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'bad-email',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('should authenticate and login user successfully with valid credentials', async () => {
    const mockUserInstance = {
      _id: 'mockuser123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      matchPassword: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserInstance)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('should reject login with wrong password', async () => {
    const mockUserInstance = {
      _id: 'mockuser123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      matchPassword: jest.fn().mockResolvedValue(false),
    };

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUserInstance)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
