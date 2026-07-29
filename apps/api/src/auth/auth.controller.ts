import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  CSRF_COOKIE_NAME,
  generateCsrfSecret,
  generateCsrfToken,
} from '../common/middleware/csrf.middleware';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new merchant' })
  @ApiResponse({ status: 201, description: 'Merchant registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async register(@Body() dto: RegisterMerchantDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in a merchant' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(@Body() dto: LoginMerchantDto) {
    return this.authService.login(dto);
  async login(@Body() dto: LoginMerchantDto, @Res({ passthrough: true }) res?: Response) {
    const loginResult = await this.authService.login(dto);
    const csrfSecret = generateCsrfSecret();
    const csrfToken = generateCsrfToken(csrfSecret);

    res?.cookie(CSRF_COOKIE_NAME, csrfSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { ...loginResult, csrf_token: csrfToken };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh an authentication token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Log out the current merchant' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  logout(@Req() req: Request): void {
    this.authService.logout(req.headers.authorization);
  }
}
