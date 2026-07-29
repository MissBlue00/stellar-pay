import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('profile')
  async getProfile(@CurrentMerchant() currentMerchant: MerchantUser) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: currentMerchant.merchant_id },
      select: { email: true, kycStatus: true, createdAt: true },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return merchant;
  }
}
