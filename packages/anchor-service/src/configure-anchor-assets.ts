import type { AnchorAsset, AnchorConfig } from './interfaces/anchor-asset.interface';

function validateAsset(asset: AnchorAsset): void {
  if (!asset.code || !asset.code.trim()) {
    throw new Error('Asset code is required');
  }
  if (!asset.issuer || !/^G[A-Z2-7]{55}$/.test(asset.issuer)) {
    throw new Error(
      `Invalid issuer for asset ${asset.code}: must be a valid Stellar public key (G...)`,
    );
  }
  if (!asset.fiatEquivalent || !asset.fiatEquivalent.trim()) {
    throw new Error(`fiatEquivalent is required for asset ${asset.code}`);
  }
  if (asset.feeRate < 0) {
    throw new Error(`feeRate must be non-negative for asset ${asset.code}`);
  }
  const min = parseFloat(asset.minLimit);
  const max = parseFloat(asset.maxLimit);
  if (isNaN(min) || min < 0) {
    throw new Error(`minLimit must be a non-negative number for asset ${asset.code}`);
  }
  if (isNaN(max) || max < 0) {
    throw new Error(`maxLimit must be a non-negative number for asset ${asset.code}`);
  }
  if (max < min) {
    throw new Error(`maxLimit cannot be less than minLimit for asset ${asset.code}`);
  }
}

export function configureAnchorAssets(assets: AnchorAsset[]): AnchorConfig {
  const store = new Map<string, AnchorAsset>();

  for (const asset of assets) {
    validateAsset(asset);
    store.set(asset.code, asset);
  }

  return {
    getAsset(code: string): AnchorAsset | undefined {
      return store.get(code);
    },

    getFiatEquivalent(stellarCode: string): string | undefined {
      const asset = store.get(stellarCode);
      return asset?.fiatEquivalent;
    },

    validateLimits(code: string, amount: string): { valid: boolean; error?: string } {
      const asset = store.get(code);
      if (!asset) {
        return { valid: false, error: `Asset ${code} not found` };
      }
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed < 0) {
        return { valid: false, error: 'Amount must be a non-negative number' };
      }
      if (parsed < parseFloat(asset.minLimit)) {
        return {
          valid: false,
          error: `Amount ${amount} is below the minimum limit of ${asset.minLimit} for ${code}`,
        };
      }
      if (parsed > parseFloat(asset.maxLimit)) {
        return {
          valid: false,
          error: `Amount ${amount} exceeds the maximum limit of ${asset.maxLimit} for ${code}`,
        };
      }
      return { valid: true };
    },

    getFeeConfig(code: string): { feeRate: number; feeFixed: string } | undefined {
      const asset = store.get(code);
      if (!asset) return undefined;
      return { feeRate: asset.feeRate, feeFixed: asset.feeFixed };
    },

    getAllAssets(): AnchorAsset[] {
      return Array.from(store.values());
    },
  };
}
