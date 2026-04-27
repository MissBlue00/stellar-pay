import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { App } from 'supertest/types';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { Public } from '../src/auth/decorators/public.decorator';

// ─── Inline stub controllers (stand-ins until real routes exist) ─────────────

const JWT_SECRET = 'test-secret';
const VALID_MERCHANT_ID = 'merchant-abc';

function makeToken(merchant_id: string, secret = JWT_SECRET) {
  return jwt.sign({ merchant_id }, secret, { expiresIn: '1h' });
}

interface RegisterDto {
  merchant_id: string;
  stellar_address: string;
}

interface PaymentDto {
  merchant_id: string;
  amount: number;
  asset: string;
  destination: string;
  signature: string;
}

interface ConfirmDto {
  payment_id: string;
  tx_hash: string;
}

interface MintDto {
  merchant_id: string;
  payment_id: string;
  amount: number;
}

// Simulated in-memory state
const registeredMerchants = new Set<string>();
const payments = new Map<string, { confirmed: boolean; amount: number }>();
let paymentCounter = 0;

// Rate-limit counter per merchant (resets per test via beforeEach)
const rateLimitHits = new Map<string, number>();
const RATE_LIMIT = 3;

@Controller('register')
class RegisterController {
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    if (!dto.merchant_id || !dto.stellar_address) {
      return { statusCode: 400, message: 'Missing fields' };
    }
    registeredMerchants.add(dto.merchant_id);
    return { merchant_id: dto.merchant_id, stellar_address: dto.stellar_address };
  }
}

@Controller('payments')
class PaymentsController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  pay(@Body() dto: PaymentDto) {
    const hits = (rateLimitHits.get(dto.merchant_id) ?? 0) + 1;
    rateLimitHits.set(dto.merchant_id, hits);
    if (hits > RATE_LIMIT) {
      return { statusCode: 429, message: 'Rate limit exceeded' };
    }
    if (dto.signature !== 'valid-sig') {
      return { statusCode: 401, message: 'Invalid signature' };
    }
    if (dto.amount <= 0) {
      return { statusCode: 400, message: 'Insufficient balance' };
    }
    const payment_id = `pay-${++paymentCounter}`;
    payments.set(payment_id, { confirmed: false, amount: dto.amount });
    return { payment_id };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Body() dto: ConfirmDto) {
    const payment = payments.get(dto.payment_id);
    if (!payment) {
      return { statusCode: 404, message: 'Payment not found' };
    }
    if (!dto.tx_hash) {
      return { statusCode: 400, message: 'Missing tx_hash' };
    }
    payment.confirmed = true;
    return { payment_id: dto.payment_id, confirmed: true, tx_hash: dto.tx_hash };
  }
}

@Controller('mint')
class MintController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  mint(@Body() dto: MintDto) {
    const payment = payments.get(dto.payment_id);
    if (!payment || !payment.confirmed) {
      return { statusCode: 400, message: 'Payment not confirmed' };
    }
    return { minted: true, merchant_id: dto.merchant_id, amount: dto.amount };
  }
}

// ─── Test setup ──────────────────────────────────────────────────────────────

describe('Integration: Registration → Payment → Confirmation → Mint', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [RegisterController, PaymentsController, MintController],
      providers: [JwtStrategy, JwtAuthGuard, { provide: APP_GUARD, useClass: JwtAuthGuard }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    registeredMerchants.clear();
    payments.clear();
    rateLimitHits.clear();
    paymentCounter = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Happy path ────────────────────────────────────────────────────────────

  describe('Happy path', () => {
    it('completes full flow: register → pay → confirm → mint', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const auth = { Authorization: `Bearer ${token}` };

      // 1. Register
      const reg = await request(app.getHttpServer())
        .post('/register')
        .send({ merchant_id: VALID_MERCHANT_ID, stellar_address: 'GABC123' })
        .expect(201);
      expect(reg.body.merchant_id).toBe(VALID_MERCHANT_ID);

      // 2. Payment
      const pay = await request(app.getHttpServer())
        .post('/payments')
        .set(auth)
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 100,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'valid-sig',
        })
        .expect(201);
      expect(pay.body.payment_id).toBeDefined();
      const { payment_id } = pay.body;

      // 3. Confirmation
      const confirm = await request(app.getHttpServer())
        .post('/payments/confirm')
        .set(auth)
        .send({ payment_id, tx_hash: '0xdeadbeef' })
        .expect(200);
      expect(confirm.body.confirmed).toBe(true);

      // 4. Mint
      const mint = await request(app.getHttpServer())
        .post('/mint')
        .set(auth)
        .send({ merchant_id: VALID_MERCHANT_ID, payment_id, amount: 100 })
        .expect(201);
      expect(mint.body.minted).toBe(true);
    });
  });

  // ─── Error paths ───────────────────────────────────────────────────────────

  describe('Error paths', () => {
    it('rejects payment with invalid signature', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const res = await request(app.getHttpServer())
        .post('/payments')
        .set({ Authorization: `Bearer ${token}` })
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 50,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'bad-sig',
        })
        .expect(201);
      expect(res.body.message).toBe('Invalid signature');
      expect(res.body.statusCode).toBe(401);
    });

    it('rejects payment with insufficient balance (amount <= 0)', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const res = await request(app.getHttpServer())
        .post('/payments')
        .set({ Authorization: `Bearer ${token}` })
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 0,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'valid-sig',
        })
        .expect(201);
      expect(res.body.message).toBe('Insufficient balance');
      expect(res.body.statusCode).toBe(400);
    });

    it('enforces rate limit after exceeding threshold', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const auth = { Authorization: `Bearer ${token}` };
      const payload = {
        merchant_id: VALID_MERCHANT_ID,
        amount: 10,
        asset: 'USDC',
        destination: 'GDEST',
        signature: 'valid-sig',
      };

      // Exhaust the rate limit
      for (let i = 0; i < RATE_LIMIT; i++) {
        await request(app.getHttpServer()).post('/payments').set(auth).send(payload).expect(201);
      }

      // Next request should be rate-limited
      const res = await request(app.getHttpServer())
        .post('/payments')
        .set(auth)
        .send(payload)
        .expect(201);
      expect(res.body.statusCode).toBe(429);
      expect(res.body.message).toBe('Rate limit exceeded');
    });

    it('rejects unauthenticated payment request', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 50,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'valid-sig',
        })
        .expect(401);
    });

    it('rejects token signed with wrong secret', async () => {
      const badToken = makeToken(VALID_MERCHANT_ID, 'wrong-secret');
      await request(app.getHttpServer())
        .post('/payments')
        .set({ Authorization: `Bearer ${badToken}` })
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 50,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'valid-sig',
        })
        .expect(401);
    });

    it('rejects mint when payment is not confirmed', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const auth = { Authorization: `Bearer ${token}` };

      const pay = await request(app.getHttpServer())
        .post('/payments')
        .set(auth)
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 100,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'valid-sig',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/mint')
        .set(auth)
        .send({ merchant_id: VALID_MERCHANT_ID, payment_id: pay.body.payment_id, amount: 100 })
        .expect(201);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('Payment not confirmed');
    });

    it('rejects confirmation with missing tx_hash', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const auth = { Authorization: `Bearer ${token}` };

      const pay = await request(app.getHttpServer())
        .post('/payments')
        .set(auth)
        .send({
          merchant_id: VALID_MERCHANT_ID,
          amount: 100,
          asset: 'USDC',
          destination: 'GDEST',
          signature: 'valid-sig',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/payments/confirm')
        .set(auth)
        .send({ payment_id: pay.body.payment_id, tx_hash: '' })
        .expect(200);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toBe('Missing tx_hash');
    });

    it('rejects confirmation for unknown payment_id', async () => {
      const token = makeToken(VALID_MERCHANT_ID);
      const res = await request(app.getHttpServer())
        .post('/payments/confirm')
        .set({ Authorization: `Bearer ${token}` })
        .send({ payment_id: 'nonexistent', tx_hash: '0xabc' })
        .expect(200);
      expect(res.body.statusCode).toBe(404);
    });
  });
});
