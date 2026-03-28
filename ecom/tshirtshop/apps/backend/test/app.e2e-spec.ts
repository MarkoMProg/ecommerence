/**
 * E2E smoke test — catalog, cart, checkout, order flow.
 * Requires: DATABASE_URL, BETTER_AUTH_SECRET, ENCRYPTION_KEY
 * Prerequisite: npm run db:push && npm run db:seed
 *
 * NOTE: test:e2e may fail due to module resolution (@nestjs/bullmq).
 * Run from workspace root: npm run test --workspace=backend -- test:e2e
 * Or fix Jest config to resolve workspace dependencies.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Catalog', () => {
    it('GET /api/v1/products returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /api/v1/categories returns 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Critical flow: cart → checkout → order', () => {
    let cartId: string;
    let orderId: string;

    it('adds item to cart and returns cartId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Content-Type', 'application/json')
        .send({ productId: '1', quantity: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].productId).toBe('1');
      cartId = res.body.cartId ?? res.body.data.id;
    });

    it('gets cart with X-Cart-Id', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('X-Cart-Id', cartId)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(cartId);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('gets checkout summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/checkout/summary')
        .set('X-Cart-Id', cartId)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalCents');
      expect(res.body.data).toHaveProperty('itemCount');
    });

    it('creates order from cart', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/checkout')
        .set('Content-Type', 'application/json')
        .set('X-Cart-Id', cartId)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            line1: '123 Main St',
            city: 'Austin',
            stateOrProvince: 'TX',
            postalCode: '78701',
            country: 'US',
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.order).toHaveProperty('id');
      expect(res.body.data.order.status).toBe('pending');
      expect(res.body.data).toHaveProperty('clientSecret');
      expect(res.body.data).toHaveProperty('customerSessionClientSecret');
      orderId = res.body.data.order.id;
    });

    it('fetches order by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(orderId);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('totalCents');
      expect(res.body.data).toHaveProperty('shippingFullName', 'Test User');
    });
  });
});
