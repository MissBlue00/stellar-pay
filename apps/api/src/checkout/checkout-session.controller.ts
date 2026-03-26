import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { CheckoutSessionService } from './checkout-session.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('checkout')
export class CheckoutSessionController {
  constructor(private readonly sessionService: CheckoutSessionService) {}

  /**
   * Public endpoint to retrieve checkout session details by token
   * Used by the frontend to display payment UI without authentication
   *
   * @param token - The session token provided to the customer
   * @returns Checkout session details including payment information
   */
  @Public()
  @Get('session/:token')
  async getCheckoutSession(@Param('token') token: string) {
    if (!token || token.trim() === '') {
      throw new BadRequestException('Session token is required');
    }

    const session = await this.sessionService.getSessionByToken(token);
    return this.sessionService.toResponseDto(session);
  }
}
