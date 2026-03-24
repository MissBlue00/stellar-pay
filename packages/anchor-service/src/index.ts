export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
}

export interface FeeQuote {
  asset: string;
  transactionType: TransactionType;
  inputAmount: string;
  flatFee: string;
  percentageFee: string;
  totalFee: string;
  netAmount: string;
}

interface FeeSchedule {
  flatFee: number;
  percentageFee: number; // e.g. 0.01 = 1%
}

type AssetFeeSchedules = Record<string, Partial<Record<TransactionType, FeeSchedule>>>;

const FEE_SCHEDULES: AssetFeeSchedules = {
  USDC: {
    [TransactionType.DEPOSIT]: { flatFee: 0.5, percentageFee: 0.001 },
    [TransactionType.WITHDRAWAL]: { flatFee: 1.0, percentageFee: 0.002 },
    [TransactionType.TRANSFER]: { flatFee: 0.25, percentageFee: 0.0005 },
  },
  XLM: {
    [TransactionType.DEPOSIT]: { flatFee: 0.01, percentageFee: 0.0005 },
    [TransactionType.WITHDRAWAL]: { flatFee: 0.05, percentageFee: 0.001 },
    [TransactionType.TRANSFER]: { flatFee: 0.01, percentageFee: 0.0005 },
  },
};

const DEFAULT_FEE_SCHEDULE: FeeSchedule = {
  flatFee: 1.0,
  percentageFee: 0.005,
};

function toFixed(value: number, decimals = 7): string {
  return value.toFixed(decimals);
}

export async function calculateAnchorFee(
  amount: string,
  asset: string,
  type: TransactionType,
): Promise<FeeQuote> {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const assetSchedules = FEE_SCHEDULES[asset.toUpperCase()];
  const schedule: FeeSchedule = (assetSchedules && assetSchedules[type]) ?? DEFAULT_FEE_SCHEDULE;

  const flatFee = schedule.flatFee;
  const percentageFee = parsedAmount * schedule.percentageFee;
  const totalFee = flatFee + percentageFee;
  const netAmount = Math.max(0, parsedAmount - totalFee);

  return {
    asset,
    transactionType: type,
    inputAmount: toFixed(parsedAmount),
    flatFee: toFixed(flatFee),
    percentageFee: toFixed(percentageFee),
    totalFee: toFixed(totalFee),
    netAmount: toFixed(netAmount),
  };
}
