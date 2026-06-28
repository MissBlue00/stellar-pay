import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type SortOrder = 'asc' | 'desc';

type PaginateArgs = {
  where?: unknown;
  orderBy?: unknown;
  skip?: number;
  take?: number;
  select?: unknown;
  include?: unknown;
};

type CountArgs<TArgs extends PaginateArgs> = TArgs extends { where?: infer TWhere }
  ? { where?: TWhere }
  : { where?: unknown };

type PaginationSelect<TArgs extends PaginateArgs> = TArgs extends { select?: infer TSelect }
  ? TSelect
  : never;

type PaginationInclude<TArgs extends PaginateArgs> = TArgs extends { include?: infer TInclude }
  ? TInclude
  : never;

export interface PaginationOptions<TArgs extends PaginateArgs = PaginateArgs> {
  page?: number;
  limit?: number;
  where?: TArgs['where'];
  orderBy?: TArgs['orderBy'];
  sortBy?: string;
  sortOrder?: SortOrder;
  select?: PaginationSelect<TArgs>;
  include?: PaginationInclude<TArgs>;
}

export interface PaginatedResult<TData> {
  data: TData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery<TArgs extends PaginateArgs, TResult> {
  findMany(args: TArgs): Promise<TResult[]>;
  count(args?: CountArgs<TArgs>): Promise<number>;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 20;

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async paginate<TArgs extends PaginateArgs, TResult>(
    query: PaginationQuery<TArgs, TResult>,
    options: PaginationOptions<TArgs> = {},
  ): Promise<PaginatedResult<TResult>> {
    const page = this.normalizePositiveInteger(options.page, PrismaService.DEFAULT_PAGE);
    const limit = this.normalizePositiveInteger(options.limit, PrismaService.DEFAULT_LIMIT);
    const orderBy = this.resolveOrderBy(options);

    const [data, total] = await Promise.all([
      query.findMany({
        ...(options.where !== undefined ? { where: options.where } : {}),
        ...(orderBy !== undefined ? { orderBy } : {}),
        ...(options.select !== undefined ? { select: options.select } : {}),
        ...(options.include !== undefined ? { include: options.include } : {}),
        skip: (page - 1) * limit,
        take: limit,
      } as TArgs),
      query.count(
        options.where !== undefined ? ({ where: options.where } as CountArgs<TArgs>) : undefined,
      ),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  private normalizePositiveInteger(value: number | undefined, fallback: number): number {
    if (!Number.isFinite(value) || value === undefined || value < 1) {
      return fallback;
    }

    return Math.floor(value);
  }

  private resolveOrderBy<TArgs extends PaginateArgs>(
    options: PaginationOptions<TArgs>,
  ): TArgs['orderBy'] | undefined {
    if (options.orderBy !== undefined) {
      return options.orderBy;
    }

    if (!options.sortBy) {
      return undefined;
    }

    return {
      [options.sortBy]: options.sortOrder ?? 'asc',
    } as TArgs['orderBy'];
  }
}
