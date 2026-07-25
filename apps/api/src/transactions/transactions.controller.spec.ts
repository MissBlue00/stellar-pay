import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import {
  TransactionNetwork,
  TransactionStatus,
  type Transaction,
} from './interfaces/transaction.interface';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';

const MERCHANT_ID = 'merchant-test-1';

const merchant = (): MerchantUser => ({ merchant_id: MERCHANT_ID }) as MerchantUser;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-abc-123',
  network: TransactionNetwork.STELLAR,
  hash: '0xabc123def456',
  status: TransactionStatus.PENDING,
  confirmations: 0,
  required_confirmations: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

const mockService = (): jest.Mocked<TransactionsService> =>
  ({
    register: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findPending: jest.fn(),
    updateConfirmations: jest.fn(),
    markFailed: jest.fn(),
  }) as unknown as jest.Mocked<TransactionsService>;

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let svc: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useFactory: mockService }],
    }).compile();

    controller = module.get(TransactionsController);
    svc = module.get(TransactionsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── POST /transactions ────────────────────────────────────────────────────

  describe('register', () => {
    it('registers a transaction and returns it', () => {
      const tx = makeTransaction();
      svc.register.mockReturnValue(tx);

      const dto = { hash: '0xabc123def456', network: TransactionNetwork.STELLAR };
      const result = controller.register(dto, merchant());

      expect(svc.register).toHaveBeenCalledWith(dto.hash, dto.network, MERCHANT_ID);
      expect(result).toEqual(tx);
    });

    it('registers transaction with BTC network', () => {
      const tx = makeTransaction({
        network: TransactionNetwork.BTC,
        required_confirmations: 3,
      });
      svc.register.mockReturnValue(tx);

      const dto = { hash: 'btc-hash', network: TransactionNetwork.BTC };
      const result = controller.register(dto, merchant());

      expect(svc.register).toHaveBeenCalledWith(dto.hash, TransactionNetwork.BTC, MERCHANT_ID);
      expect(result.network).toBe(TransactionNetwork.BTC);
      expect(result.required_confirmations).toBe(3);
    });

    it('registers transaction with ETH network', () => {
      const tx = makeTransaction({
        network: TransactionNetwork.ETH,
        required_confirmations: 12,
      });
      svc.register.mockReturnValue(tx);

      const dto = { hash: 'eth-hash', network: TransactionNetwork.ETH };
      const result = controller.register(dto, merchant());

      expect(svc.register).toHaveBeenCalledWith(dto.hash, TransactionNetwork.ETH, MERCHANT_ID);
      expect(result.network).toBe(TransactionNetwork.ETH);
      expect(result.required_confirmations).toBe(12);
    });
  });

  // ─── GET /transactions ────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns empty array when no transactions exist', () => {
      svc.findAll.mockReturnValue([]);

      const result = controller.findAll();

      expect(svc.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('returns paginated list of transactions', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1' }),
        makeTransaction({ id: 'tx-2', status: TransactionStatus.CONFIRMING }),
        makeTransaction({ id: 'tx-3', status: TransactionStatus.CONFIRMED }),
      ];
      svc.findAll.mockReturnValue(transactions);

      const result = controller.findAll();

      expect(svc.findAll).toHaveBeenCalled();
      expect(result).toEqual(transactions);
      expect(result).toHaveLength(3);
    });

    it('returns transactions with different networks', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', network: TransactionNetwork.STELLAR }),
        makeTransaction({ id: 'tx-2', network: TransactionNetwork.BTC }),
        makeTransaction({ id: 'tx-3', network: TransactionNetwork.ETH }),
      ];
      svc.findAll.mockReturnValue(transactions);

      const result = controller.findAll();

      expect(result.map((tx) => tx.network)).toEqual([
        TransactionNetwork.STELLAR,
        TransactionNetwork.BTC,
        TransactionNetwork.ETH,
      ]);
    });

    it('returns transactions with different statuses', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', status: TransactionStatus.PENDING }),
        makeTransaction({ id: 'tx-2', status: TransactionStatus.CONFIRMING }),
        makeTransaction({ id: 'tx-3', status: TransactionStatus.CONFIRMED }),
        makeTransaction({ id: 'tx-4', status: TransactionStatus.FAILED }),
      ];
      svc.findAll.mockReturnValue(transactions);

      const result = controller.findAll();

      expect(result.map((tx) => tx.status)).toEqual([
        TransactionStatus.PENDING,
        TransactionStatus.CONFIRMING,
        TransactionStatus.CONFIRMED,
        TransactionStatus.FAILED,
      ]);
    });
  });

  // ─── GET /transactions/:id ────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns a single transaction by ID', () => {
      const tx = makeTransaction({ id: 'tx-123' });
      svc.findOne.mockReturnValue(tx);

      const result = controller.findOne('tx-123');

      expect(svc.findOne).toHaveBeenCalledWith('tx-123');
      expect(result).toEqual(tx);
    });

    it('returns transaction with confirmation data', () => {
      const tx = makeTransaction({
        id: 'tx-confirmed',
        status: TransactionStatus.CONFIRMED,
        confirmations: 5,
        confirmed_at: new Date().toISOString(),
      });
      svc.findOne.mockReturnValue(tx);

      const result = controller.findOne('tx-confirmed');

      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(result.confirmations).toBe(5);
      expect(result.confirmed_at).toBeDefined();
    });

    it('throws NotFoundException when transaction does not exist', () => {
      svc.findOne.mockReturnValue(undefined);

      expect(() => controller.findOne('missing-id')).toThrow(NotFoundException);
      expect(() => controller.findOne('missing-id')).toThrow('Transaction missing-id not found');
    });

    it('returns transaction filtered by type (network)', () => {
      const btcTx = makeTransaction({ id: 'btc-tx', network: TransactionNetwork.BTC });
      svc.findOne.mockReturnValue(btcTx);

      const result = controller.findOne('btc-tx');

      expect(result.network).toBe(TransactionNetwork.BTC);
    });

    it('returns transaction with different statuses', () => {
      const statuses = [
        TransactionStatus.PENDING,
        TransactionStatus.CONFIRMING,
        TransactionStatus.CONFIRMED,
        TransactionStatus.FAILED,
      ];

      statuses.forEach((status) => {
        const tx = makeTransaction({ id: `tx-${status}`, status });
        svc.findOne.mockReturnValue(tx);

        const result = controller.findOne(`tx-${status}`);
        expect(result.status).toBe(status);
      });
    });

    it('returns transaction with date range filter capability', () => {
      const createdAt = new Date('2025-01-01').toISOString();
      const tx = makeTransaction({
        id: 'tx-dated',
        created_at: createdAt,
      });
      svc.findOne.mockReturnValue(tx);

      const result = controller.findOne('tx-dated');

      expect(result.created_at).toBe(createdAt);
      expect(new Date(result.created_at).getTime()).toBeGreaterThan(0);
    });
  });
});
