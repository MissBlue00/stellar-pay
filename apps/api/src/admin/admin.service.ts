import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, comparePassword } from '../auth/password.utils';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = { user_id: user.id, merchant_id: user.merchantId, role: 'ADMIN' };
    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return {
      access_token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async getMetrics() {
    const [merchantCount, paymentCount, volumeResult] = await Promise.all([
      this.prisma.merchant.count(),
      this.prisma.paymentIntent.count(),
      this.prisma.paymentIntent.aggregate({
        _sum: { amount: true },
      }),
    ]);

    return {
      totalMerchants: merchantCount,
      totalPayments: paymentCount,
      totalVolume: volumeResult._sum.amount?.toNumber() ?? 0,
    };
  }

  async listMerchants(search?: string) {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const merchants = await this.prisma.merchant.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        kycStatus: true,
        createdAt: true,
        _count: { select: { paymentIntents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return merchants.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      kycStatus: m.kycStatus,
      createdAt: m.createdAt,
      paymentCount: m._count.paymentIntents,
    }));
  }
}
