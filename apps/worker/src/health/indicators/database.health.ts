import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // TODO: Implement actual database connectivity check
      // When database service is implemented, inject it here and verify connection
      // Example:
      // await this.databaseService.query('SELECT 1');

      return this.getStatus(key, true);
    } catch {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, { message: 'Database connection unavailable' }),
      );
    }
  }
}
