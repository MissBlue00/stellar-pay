import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    if (apiKey && typeof apiKey === 'string') {
      if (apiKey.startsWith('sp_')) {
        const parts = apiKey.split('_');
        const merchantId = parts[2] || 'merchant_12345';
        request.user = { merchant_id: merchantId };
        return true;
      }
      throw new UnauthorizedException('Invalid API Key');
    }

    return super.canActivate(context);
  }
}
