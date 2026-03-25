import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { Public } from './decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentMerchant } from './decorators/current-merchant.decorator';
import type { MerchantUser } from './interfaces/merchant-user.interface';
import { MerchantsService } from '../merchants/merchants.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly merchantsService: MerchantsService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  async me(@CurrentMerchant() user: MerchantUser) {
    const merchant = await this.merchantsService.findById(user.merchant_id);
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
    return this.merchantsService.toPublicProfile(merchant);
  }
}
