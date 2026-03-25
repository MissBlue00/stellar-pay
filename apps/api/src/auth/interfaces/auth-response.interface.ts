export interface AuthResponse {
  access_token: string;
  expires_in: number;
  merchant: {
    id: string;
    email: string;
    name: string;
  };
}
