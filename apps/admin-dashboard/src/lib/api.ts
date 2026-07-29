const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface AdminLoginResponse {
  access_token: string;
  user: { id: string; email: string; role: string };
}

interface MetricsResponse {
  totalMerchants: number;
  totalPayments: number;
  totalVolume: number;
}

interface Merchant {
  id: string;
  email: string;
  name: string | null;
  kycStatus: string;
  createdAt: string;
  paymentCount: number;
}

interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
  timestamp: string;
  environment: string;
}

class AdminApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? 'Login failed');
    }
    return res.json();
  }

  async getMetrics(): Promise<MetricsResponse> {
    const res = await fetch(`${API_URL}/admin/metrics`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  }

  async listMerchants(search?: string): Promise<Merchant[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_URL}/admin/merchants${params}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch merchants');
    return res.json();
  }

  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }
}

export const adminApi = new AdminApiClient();
