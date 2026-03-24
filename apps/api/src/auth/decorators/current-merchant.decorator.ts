import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MerchantUser } from '../interfaces/merchant-user.interface';

export const CurrentMerchant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): MerchantUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
