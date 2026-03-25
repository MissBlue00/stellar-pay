import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import type { RecordAuditEventRequest } from './interfaces/audit-event.interface';
import type { AuditLogEntry, AuditTrailVerificationResult } from './interfaces/audit-log.interface';
import { AuditLogService } from './audit-log.service';

@Public()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  recordEvent(
    @Body() body: Omit<RecordAuditEventRequest, 'ip'>,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('x-real-ip') realIp?: string,
  ): AuditLogEntry {
    return this.auditLogService.recordEvent({
      ...body,
      ip: this.resolveIp(forwardedFor, realIp),
    });
  }

  @Get()
  listEntries(): AuditLogEntry[] {
    return this.auditLogService.listEntries();
  }

  @Get('merchant/:merchantId')
  listMerchantEntries(@Param('merchantId') merchantId: string): AuditLogEntry[] {
    return this.auditLogService.listEntries(merchantId);
  }

  @Get('verify')
  verifyTrail(): AuditTrailVerificationResult {
    return this.auditLogService.verifyTrail();
  }

  @Get('verify/:merchantId')
  verifyMerchantTrail(@Param('merchantId') merchantId: string): AuditTrailVerificationResult {
    return this.auditLogService.verifyTrail(merchantId);
  }

  private resolveIp(forwardedFor?: string, realIp?: string): string {
    return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  }
}
