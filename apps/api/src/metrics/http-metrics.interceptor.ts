import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = process.hrtime.bigint();

    let recorded = false;
    const record = () => {
      if (recorded) {
        return;
      }
      recorded = true;
      res.removeListener('finish', record);
      res.removeListener('close', record);

      const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
      const route =
        typeof req.route === 'object' && req.route && 'path' in req.route
          ? `${req.baseUrl ?? ''}${String(req.route.path)}`
          : (req.path ?? 'unknown');
      const method = req.method ?? 'unknown';
      const status = res.statusCode ?? 0;
      const statusClass = httpStatusClass(status);

      this.metrics.observeHttpRequest(method, route, statusClass, durationSec);
    };

    res.once('finish', record);
    res.once('close', record);

    return next.handle();
  }
}

function httpStatusClass(code: number): string {
  if (code >= 100 && code < 600) {
    return `${Math.floor(code / 100)}xx`;
  }
  return 'unknown';
}
