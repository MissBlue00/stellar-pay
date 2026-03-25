import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MerchantsService } from '../merchants/merchants.service';
import { MerchantRecord } from '../merchants/interfaces/merchant-record.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './interfaces/auth-response.interface';

const BCRYPT_ROUNDS = 10;

function jwtExpiresSec(): number {
  const raw = process.env.JWT_EXPIRES_IN_SEC;
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 60 * 60 * 24 * 7;
}

@Injectable()
export class AuthService {
  private readonly expiresInSec = jwtExpiresSec();

  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const merchant = await this.merchantsService.create(dto.email, passwordHash, dto.name);
    return this.buildAuthResponse(merchant);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const merchant = await this.merchantsService.findByEmail(dto.email);
    if (!merchant || !(await bcrypt.compare(dto.password, merchant.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(merchant);
  }

  private async buildAuthResponse(merchant: MerchantRecord): Promise<AuthResponse> {
    const access_token = await this.jwtService.signAsync({
      merchant_id: merchant.id,
    });
    return {
      access_token,
      expires_in: this.expiresInSec,
      merchant: this.merchantsService.toPublicProfile(merchant),
    };
  }
}
