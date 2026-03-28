import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RATE_LIMIT_PUBLIC = 'public';
export const RATE_LIMIT_AUTH = 'auth';

export const PublicRateLimit = () => SetMetadata(RATE_LIMIT_KEY, RATE_LIMIT_PUBLIC);
export const AuthRateLimit = () => SetMetadata(RATE_LIMIT_KEY, RATE_LIMIT_AUTH);
