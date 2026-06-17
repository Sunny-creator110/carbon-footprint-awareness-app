const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Footprint = require('../models/Footprint');
const { calculateEmissions, FACTORS } = require('../services/estimationEngine');
const jwt = require('jsonwebtoken');

// Mock the User and Footprint model methods
jest.mock('../models/User');
jest.mock('../models/Footprint');

describe('Carbon Footprint Estimation Engine Unit Tests', () => {
  test('should calculate utility emissions correctly', () => {
    const result = calculateEmissions('utility', { kwh: 100, gasTherms: 10 });
    const expected = (100 * FACTORS.ELECTRICITY_KG_PER_KWH) + (10 * FACTORS.GAS_KG_PER_THERM);
    expect(result).toBe(expected);
  });

  test('should calculate transportation emissions correctly', () => {
    const result = calculateEmissions('transportation', { miles: 50, flightMiles: 200 });
    const expected = (50 * FACTORS.VEHICLE_KG_PER_MILE) + (200 * FACTORS.FLIGHT_KG_PER_MILE);
    expect(result).toBe(expected);
  });

  test('should calculate consumption emissions correctly', () => {
    const result = calculateEmissions('consumption', { meatServings: 4, wasteKg: 10 });
    const expected = (4 * FACTORS.MEAT_KG_PER_SERVING) + (10 * FACTORS.WASTE_KG_PER_KG);
    expect(result).toBe(expected);
  });

  test('should handle zero parameters gracefully', () => {
    const result = calculateEmissions('utility', { kwh: 0, gasTherms: 0 });
    expect(result).toBe(0);
  });

  test('should throw error for negative values', () => {
    expect(() => {
      calculateEmissions('utility', { kwh: -10, gasTherms: 0 });
    }).toThrow('Utility parameters must be non-negative numbers');
  });

  test('should throw error for invalid activity type', () => {
    expect(() => {
      calculateEmissions('unknown', { kwh: 10 });
    }).toThrow('Unsupported activity type: unknown');
  });

  test('should throw error if parameters are not an object', () => {
    expect(() => {
      calculateEmissions('utility', null);
    }).toThrow('Parameters must be a valid object');
  });
});

describe('POST /api/footprint Integration Test', () => {
  let authToken;
  const mockUserId = '60d5ec49f83f2a33f488667a';
  const mockUser = {
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Generate a mock JWT token offline
    authToken = jwt.sign({ id: mockUserId }, process.env.JWT_SECRET || 'testsecretsecret', {
      expiresIn: '1h',
    });

    // Mock User.findById to return the mock user (for auth middleware)
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Mock User.findOne to return mock user (for login if hit)
    User.findOne.mockResolvedValue(mockUser);
  });

  test('should create footprint entry successfully with valid auth and payload', async () => {
    const payload = {
      activityType: 'transportation',
      parameters: {
        miles: 150,
        flightMiles: 0,
      },
    };

    const expectedEmissions = calculateEmissions(payload.activityType, payload.parameters);

    // Mock the Mongoose save operation by mocking Footprint instance creation
    const mockFootprintInstance = {
      userId: mockUserId,
      activityType: payload.activityType,
      parameters: payload.parameters,
      carbonEmissionsKg: expectedEmissions,
      _id: '60d5ec49f83f2a33f488667b',
      save: jest.fn().mockResolvedValue({
        _id: '60d5ec49f83f2a33f488667b',
        userId: mockUserId,
        activityType: payload.activityType,
        parameters: payload.parameters,
        carbonEmissionsKg: expectedEmissions,
      })
    };

    // Make Footprint constructor return our mock instance
    Footprint.mockImplementation(() => mockFootprintInstance);

    const response = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.carbonEmissionsKg).toBe(expectedEmissions);
    expect(response.body.data.userId).toBe(mockUserId);
  });

  test('should return 400 Bad Request for invalid/negative values', async () => {
    const payload = {
      activityType: 'utility',
      parameters: {
        kwh: -20,
      },
    };

    const response = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should return 401 Unauthorized if token is missing', async () => {
    const payload = {
      activityType: 'consumption',
      parameters: {
        meatServings: 2,
      },
    };

    const response = await request(app)
      .post('/api/footprint')
      .send(payload);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
