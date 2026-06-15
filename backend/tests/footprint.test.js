const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Footprint = require('../models/Footprint');
const { calculateEmissions, FACTORS } = require('../services/estimationEngine');

let mongoServer;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect(); // Disconnect default connection if any
  await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);


beforeEach(async () => {
  // Clean database before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

describe('Carbon Footprint Estimation Engine Unit Tests', () => {
  test('should calculate utility emissions correctly', () => {
    // kwh * 0.385 + gasTherms * 5.3
    const result = calculateEmissions('utility', { kwh: 100, gasTherms: 10 });
    const expected = (100 * FACTORS.ELECTRICITY_KG_PER_KWH) + (10 * FACTORS.GAS_KG_PER_THERM);
    expect(result).toBe(expected);
  });

  test('should calculate transportation emissions correctly', () => {
    // miles * 0.404 + flightMiles * 0.25
    const result = calculateEmissions('transportation', { miles: 50, flightMiles: 200 });
    const expected = (50 * FACTORS.VEHICLE_KG_PER_MILE) + (200 * FACTORS.FLIGHT_KG_PER_MILE);
    expect(result).toBe(expected);
  });

  test('should calculate consumption emissions correctly', () => {
    // meatServings * 2.5 + wasteKg * 0.5
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
  let testUser;

  beforeEach(async () => {
    // Create a mock user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Login user to get JWT token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginRes.body.data.token;
  });

  test('should create footprint entry successfully with valid auth and payload', async () => {
    const payload = {
      activityType: 'transportation',
      parameters: {
        miles: 150,
        flightMiles: 0,
      },
    };

    // Calculate standard emissions expected
    const expectedEmissions = calculateEmissions(payload.activityType, payload.parameters);

    const response = await request(app)
      .post('/api/footprint')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
    expect(response.body.data.carbonEmissionsKg).toBe(expectedEmissions);
    expect(response.body.data.userId).toBe(testUser._id.toString());

    // Verify database persistence
    const savedFootprint = await Footprint.findById(response.body.data._id);
    expect(savedFootprint).not.toBeNull();
    expect(savedFootprint.carbonEmissionsKg).toBe(expectedEmissions);
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
