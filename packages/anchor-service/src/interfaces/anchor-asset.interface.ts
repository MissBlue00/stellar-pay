export interface AnchorAsset {
  code: string;
  issuer: string;
  fiatEquivalent: string;
  feeRate: number;
  feeFixed: string;
  minLimit: string;
  maxLimit: string;
}

export interface AnchorConfig {
  getAsset(code: string): AnchorAsset | undefined;
  getFiatEquivalent(stellarCode: string): string | undefined;
  validateLimits(code: string, amount: string): { valid: boolean; error?: string };
  getFeeConfig(code: string): { feeRate: number; feeFixed: string } | undefined;
  getAllAssets(): AnchorAsset[];
}
