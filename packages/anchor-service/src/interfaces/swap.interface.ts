export interface StellarAsset {
  assetCode: string;
  assetIssuer?: string;
}

export interface SwapParams {
  sourceAsset: StellarAsset;
  destinationAsset: StellarAsset;
  sourceAmount: string;
  destinationAddress: string;
  swapPath?: StellarAsset[];
  maxPriceImpact?: number;
  slippageTolerance?: number;
}

export interface SwapResult {
  success: boolean;
  swapId: string;
  sourceAsset: StellarAsset;
  destinationAsset: StellarAsset;
  sourceAmount: string;
  destinationAmount: string;
  status: 'pending' | 'completed' | 'failed';
  stellarTransactionHash?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
