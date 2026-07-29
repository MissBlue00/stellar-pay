import { Body, Controller, Get, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get the authenticated merchant profile' })
  @ApiResponse({ status: 200, description: 'Merchant profile retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update the authenticated merchant profile' })
  @ApiResponse({ status: 200, description: 'Merchant profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
