import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { MerchantUser } from '../interfaces/merchant-user.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'default-secret-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<MerchantUser> {
    if (!payload.merchant_id) {
      throw new UnauthorizedException('Invalid token: merchant_id missing');
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: payload.merchant_id },
      select: { id: true },
    });

    if (!merchant) {
      throw new UnauthorizedException('Merchant not found');
    }

    return { merchant_id: payload.merchant_id };
  }
}
