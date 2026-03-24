import {
  processAnchorRefundWithDeps,
  type AnchorRefundProcessorDeps,
  type AnchorTransaction,
  type AnchorTransactionRepository,
  type AnchorRefundExecutor,
} from './index';

declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: (actual: any) => any;

describe('processAnchorRefundWithDeps', () => {
  const makeRepo = (initial: AnchorTransaction): AnchorTransactionRepository & { getState(): AnchorTransaction } => {
    let state: AnchorTransaction = { ...initial };

    return {
      async getById(id: string) {
        return id === state.id ? { ...state } : null;
      },
      async update(tx: AnchorTransaction) {
        state = { ...tx };
      },
      getState() {
        return { ...state };
      },
    };
  };

  test('processes full refund and updates status to refunded', async () => {
    const repo = makeRepo({
      id: 'tx1',
      kind: 'deposit',
      status: 'failed',
      amount: 100,
      refundedAmount: 0,
    });

    const refundExecutor: AnchorRefundExecutor = {
      async executeRefund(_tx, amount) {
        return { refundedAmount: amount, externalRefundId: 'r1' };
      },
    };

    const deps: AnchorRefundProcessorDeps = { repository: repo, refundExecutor };

    const result = await processAnchorRefundWithDeps('tx1', deps);

    expect(result).toEqual({
      transactionId: 'tx1',
      attemptedAmount: 100,
      refundedAmount: 100,
      isPartial: false,
      status: 'refunded',
      externalRefundId: 'r1',
    });

    expect(repo.getState()).toMatchObject({
      status: 'refunded',
      refundedAmount: 100,
    });
  });

  test('processes partial refund and updates status to partially_refunded', async () => {
    const repo = makeRepo({
      id: 'tx2',
      kind: 'withdrawal',
      status: 'failed',
      amount: 100,
      refundedAmount: 0,
    });

    const refundExecutor: AnchorRefundExecutor = {
      async executeRefund(_tx, _amount) {
        return { refundedAmount: 40, externalRefundId: 'r2' };
      },
    };

    const deps: AnchorRefundProcessorDeps = { repository: repo, refundExecutor };

    const result = await processAnchorRefundWithDeps('tx2', deps);

    expect(result.transactionId).toBe('tx2');
    expect(result.attemptedAmount).toBe(100);
    expect(result.refundedAmount).toBe(40);
    expect(result.isPartial).toBe(true);
    expect(result.status).toBe('partially_refunded');

    expect(repo.getState()).toMatchObject({
      status: 'partially_refunded',
      refundedAmount: 40,
    });
  });

  test('skips refund when transaction is not failed', async () => {
    const repo = makeRepo({
      id: 'tx3',
      kind: 'deposit',
      status: 'completed',
      amount: 100,
      refundedAmount: 0,
    });

    const refundExecutor: AnchorRefundExecutor = {
      async executeRefund() {
        throw new Error('should not be called');
      },
    };

    const deps: AnchorRefundProcessorDeps = { repository: repo, refundExecutor };

    const result = await processAnchorRefundWithDeps('tx3', deps);

    expect(result.attemptedAmount).toBe(0);
    expect(result.refundedAmount).toBe(0);
    expect(result.status).toBe('completed');
    expect(result.message).toContain("expected 'failed'");

    expect(repo.getState()).toMatchObject({
      status: 'completed',
      refundedAmount: 0,
    });
  });

  test('marks transaction refund_failed if refund executor throws', async () => {
    const repo = makeRepo({
      id: 'tx4',
      kind: 'deposit',
      status: 'failed',
      amount: 100,
      refundedAmount: 0,
    });

    const refundExecutor: AnchorRefundExecutor = {
      async executeRefund() {
        throw new Error('network down');
      },
    };

    const deps: AnchorRefundProcessorDeps = { repository: repo, refundExecutor };

    await expect(processAnchorRefundWithDeps('tx4', deps)).rejects.toThrow('network down');

    expect(repo.getState()).toMatchObject({
      status: 'refund_failed',
      refundedAmount: 0,
    });
  });
});
