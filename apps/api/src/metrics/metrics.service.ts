import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: client.Registry;
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly httpRequestsTotal: client.Counter<string>;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry });

    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status_class'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_class'],
      registers: [this.registry],
    });
  }

  get metricsContentType(): string {
    return (
      (this.registry as client.Registry & { contentType?: string }).contentType ??
      'text/plain; version=0.0.4; charset=utf-8'
    );
  }

  observeHttpRequest(
    method: string,
    route: string,
    statusClass: string,
    durationSec: number,
  ): void {
    const labels = { method, route, status_class: statusClass };
    this.httpRequestDuration.observe(labels, durationSec);
    this.httpRequestsTotal.inc(labels);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
