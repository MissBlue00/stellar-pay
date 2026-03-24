import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class BlockchainRpcHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // TODO: Implement actual Stellar RPC availability check
      // When Stellar service is implemented, inject it here and verify connectivity
      // Example:
      // const response = await this.stellarClient.send(new BrowserRpcRequest({...}));
      // if (response.status !== 200) throw new Error('RPC unavailable');

      return this.getStatus(key, true);
    } catch {
      throw new HealthCheckError(
        'Blockchain RPC check failed',
        this.getStatus(key, false, { message: 'Stellar RPC unavailable' }),
      );
    }
  }
}
