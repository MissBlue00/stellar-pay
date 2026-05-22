import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { MerchantUser } from '../interfaces/merchant-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<MerchantUser> {
    if (!payload.merchant_id) {
      throw new UnauthorizedException('Invalid token: merchant_id missing');
    }

    // TODO: Validate merchant exists in database
    // Example:
    // const merchant = await this.merchantService.findById(payload.merchant_id);
    // if (!merchant) throw new UnauthorizedException('Merchant not found');

    return { merchant_id: payload.merchant_id };
  }
}
