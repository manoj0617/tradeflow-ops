import { describe, expect, it } from 'vitest';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-that-is-longer-than-32-characters';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const { app } = await import('../src/app.js');

describe('health endpoint', () => {
  it('reports the API is ready without authentication', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.headers['x-request-id']).toBeTruthy();
  });
});

