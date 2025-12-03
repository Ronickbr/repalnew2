import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
let app: unknown;

beforeAll(async () => {
  process.env.VITE_DEV_AUTH_BYPASS = 'true';
  const mod = await import('../../server.js');
  app = mod.default;
});

describe('Auth server', () => {
  it('issues csrf token', async () => {
    const res = await request(app as any).get('/api/auth/csrf-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.csrfToken).toBeDefined();
  });

  it('login dev and access protected route with CSRF', async () => {
    const agent = request.agent(app as any);
    const login = await agent.post('/api/auth/login').send({ email: 'dev@local', password: 'x' });
    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    const csrf = await agent.get('/api/auth/csrf-token');
    const token = csrf.body.csrfToken;
    const resp = await agent
      .post('/api/admin/products')
      .set('X-CSRF-Token', token)
      .send({ product: { name: 'Teste', category_id: 1, active: true }, additionalImages: [] });
    expect(resp.status).toBe(200);
    expect(resp.body.success).toBe(true);
  });

  it('rejects protected route without CSRF', async () => {
    const agent = request.agent(app as any);
    await agent.post('/api/auth/login').send({ email: 'dev@local', password: 'x' });
    const resp = await agent.post('/api/admin/products').send({ product: { name: 'X', category_id: 1 } });
    expect(resp.status).toBe(403);
  });
});
