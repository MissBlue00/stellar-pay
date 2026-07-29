import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { hashPassword, comparePassword } from './password.utils';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class AuthService {
  private readonly blacklistedTokens = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private parseExpiresInToSeconds(value: string): number {
    // Accepts values like '1h', '30m', or plain seconds '3600'
    if (!value) return 3600;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    const m = value.match(/^(\d+)([smh])$/);
    if (!m) return 3600;
    const n = parseInt(m[1], 10);
    const unit = m[2];
    if (unit === 'h') return n * 3600;
    if (unit === 'm') return n * 60;
    return n;
  }

  async register(dto: RegisterMerchantDto) {
    const existing = await this.prisma.merchant.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const hash = await hashPassword(dto.password);

    const merchant = await this.prisma.merchant.create({
      data: { email: dto.email, passwordHash: hash },
    });

    return { merchant_id: merchant.id, email: merchant.email };
  }

  async login(dto: LoginMerchantDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { email: dto.email } });
    if (!merchant) throw new UnauthorizedException('Invalid credentials');

    const ok = await comparePassword(dto.password, merchant.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { merchant_id: merchant.id };
    const access_token = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRY });
    const expires_in = this.parseExpiresInToSeconds(ACCESS_TOKEN_EXPIRY);

    return { access_token, refresh_token, expires_in };
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload: { merchant_id: string };
    try {
      payload = await this.jwtService.verifyAsync<{ merchant_id: string }>(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: payload.merchant_id },
    });
    if (!merchant) throw new UnauthorizedException('Merchant not found');

    const tokenPayload = { merchant_id: merchant.id };
    const access_token = this.jwtService.sign(tokenPayload, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refresh_token = this.jwtService.sign(tokenPayload, { expiresIn: REFRESH_TOKEN_EXPIRY });
    const expires_in = this.parseExpiresInToSeconds(ACCESS_TOKEN_EXPIRY);

    return { access_token, refresh_token, expires_in };
  }

  logout(authorizationHeader: string | undefined): void {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    this.blacklistedTokens.add(token);
  }

  isTokenBlacklisted(authorizationHeader: string | undefined): boolean {
    const token = this.extractBearerToken(authorizationHeader);
    return !!token && this.blacklistedTokens.has(token);
  }

  private extractBearerToken(authorizationHeader: string | undefined): string | undefined {
    if (!authorizationHeader) return undefined;

    const normalized = authorizationHeader.trim();
    if (normalized.toLowerCase().startsWith('bearer ')) {
      return normalized.slice(7).trim();
    }

    return normalized;
  }
}
