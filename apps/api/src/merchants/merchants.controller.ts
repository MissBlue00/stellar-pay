import { Body, Controller, Get, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';

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

  @Put('profile')
  async updateProfile(
    @CurrentMerchant() currentMerchant: MerchantUser,
    @Body() dto: UpdateMerchantProfileDto,
  ) {
    const merchant = await this.prisma.merchant.update({
      where: { id: currentMerchant.merchant_id },
      data: {
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.name !== undefined && { name: dto.name }),
      },
    });

    return { id: merchant.id, email: merchant.email, name: merchant.name };
  }
}
