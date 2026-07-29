import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import type { RecordAuditEventRequest } from './interfaces/audit-event.interface';
import type { AuditLogEntry, AuditTrailVerificationResult } from './interfaces/audit-log.interface';
import { AuditLogService } from './audit-log.service';

@Public()
@ApiTags('audit-log')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  @ApiOperation({ summary: 'Record an audit event' })
  @ApiResponse({ status: 201, description: 'Audit event recorded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ summary: 'List audit log entries' })
  @ApiResponse({ status: 200, description: 'Audit log entries retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  listEntries(): AuditLogEntry[] {
    return this.auditLogService.listEntries();
  }

  @Get('merchant/:merchantId')
  @ApiOperation({ summary: 'List audit log entries for a merchant' })
  @ApiResponse({ status: 200, description: 'Audit log entries retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  listMerchantEntries(@Param('merchantId') merchantId: string): AuditLogEntry[] {
    return this.auditLogService.listEntries(merchantId);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify the audit trail' })
  @ApiResponse({ status: 200, description: 'Audit trail verification completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  verifyTrail(): AuditTrailVerificationResult {
    return this.auditLogService.verifyTrail();
  }

  @Get('verify/:merchantId')
  @ApiOperation({ summary: 'Verify the audit trail for a merchant' })
  @ApiResponse({ status: 200, description: 'Audit trail verification completed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  verifyMerchantTrail(@Param('merchantId') merchantId: string): AuditTrailVerificationResult {
    return this.auditLogService.verifyTrail(merchantId);
  }

  private resolveIp(forwardedFor?: string, realIp?: string): string {
    return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  }
}
