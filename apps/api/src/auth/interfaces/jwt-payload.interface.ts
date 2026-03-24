export interface JwtPayload {
  merchant_id: string;
  iat?: number;
  exp?: number;
}
