import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { LoginMerchantDto } from './dto/login-merchant.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

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

    const hash = await bcrypt.hash(dto.password, 12);

    const merchant = await this.prisma.merchant.create({
      data: { email: dto.email, passwordHash: hash },
    });

    return { merchant_id: merchant.id, email: merchant.email };
  }

  async login(dto: LoginMerchantDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { email: dto.email } });
    if (!merchant) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, merchant.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { merchant_id: merchant.id };
    const expiresInEnv = process.env.JWT_EXPIRES_IN || '1h';
    const access_token = this.jwtService.sign(payload, { expiresIn: expiresInEnv });
    const expires_in = this.parseExpiresInToSeconds(expiresInEnv);

    return { access_token, expires_in };
  }
}
