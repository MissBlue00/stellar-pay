import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('confirm')
  @Public()
  confirmPayment(@Body() body: ConfirmPaymentDto): Promise<{ transactionHash: string }> {
    return this.paymentsService.confirmPayment(body);
  }

  @Get('audit/:paymentId')
  @Public()
  getPaymentAudit(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getAuditRecord(paymentId);
  }
}
