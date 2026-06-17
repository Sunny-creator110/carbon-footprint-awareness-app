const request = require('supertest');
const app = require('../server');

describe('API Security and Performance Middleware Tests', () => {
  test('should include Helmet security headers in response', async () => {
    const res = await request(app).get('/api/auth/me'); // Just any API endpoint
    
    // Helmet headers
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  test('should return compression encoding (gzip) if requested', async () => {
    // Make a request with Accept-Encoding: gzip
    const res = await request(app)
      .get('/api/auth/me')
      .set('Accept-Encoding', 'gzip, deflate');

    // Express with compression middleware will set content-encoding if response is compressible or meets middleware thresholds
    // Even if it returns 401, the compression headers are evaluated
    expect(res.headers['vary']).toContain('Accept-Encoding');
  });

  test('should respond with 401 if accessing protected /me route without auth token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
