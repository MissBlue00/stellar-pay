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

type SoftDeleteArgs = {
  where?: unknown;
};

type SoftDeleteUpdateArgs<TWhere = unknown, TData = { deletedAt: Date }> = {
  where: TWhere;
  data: TData;
};

type SoftDeleteQuery<TArgs extends SoftDeleteArgs, TResult> = {
  findMany(args?: TArgs): Promise<TResult[]>;
};

type SoftDeleteMutation<TArgs extends SoftDeleteUpdateArgs, TResult> = {
  update(args: TArgs): Promise<TResult>;
};

type SoftDeleteMiddlewareParams = {
  model?: string;
  action: string;
  args?: Record<string, unknown>;
};

type SoftDeleteMiddlewareNext = (params: SoftDeleteMiddlewareParams) => Promise<unknown>;

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
  private static readonly SOFT_DELETE_FIELD = 'deletedAt';
  private static readonly SOFT_DELETE_MODELS = new Set(['WebhookEndpoint', 'PaymentIntent']);

  constructor() {
    super();
    this.registerSoftDeleteMiddleware();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async findActive<TArgs extends SoftDeleteArgs, TResult>(
    query: SoftDeleteQuery<TArgs, TResult>,
    args?: TArgs,
  ): Promise<TResult[]> {
    return query.findMany(this.withActiveWhere(args) as TArgs);
  }

  async softDelete<TWhere, TData extends { deletedAt: Date }, TResult>(
    query: SoftDeleteMutation<SoftDeleteUpdateArgs<TWhere, TData>, TResult>,
    where: TWhere,
  ): Promise<TResult> {
    return query.update({
      where,
      data: { deletedAt: new Date() } as TData,
    });
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

  private registerSoftDeleteMiddleware(): void {
    const prismaClient = this as PrismaClient & {
      $use?: (
        middleware: (
          params: SoftDeleteMiddlewareParams,
          next: SoftDeleteMiddlewareNext,
        ) => Promise<unknown>,
      ) => void;
    };

    prismaClient.$use?.(async (params, next) => {
      if (!this.isSoftDeleteModel(params.model)) {
        return next(params);
      }

      switch (params.action) {
        case 'findUnique':
          params.action = 'findFirst';
          params.args = this.withActiveWhere(params.args);
          break;
        case 'findUniqueOrThrow':
          params.action = 'findFirstOrThrow';
          params.args = this.withActiveWhere(params.args);
          break;
        case 'findFirst':
        case 'findFirstOrThrow':
        case 'findMany':
        case 'count':
          params.args = this.withActiveWhere(params.args);
          break;
        case 'delete':
          params.action = 'update';
          params.args = this.withSoftDeleteData(params.args);
          break;
        case 'deleteMany':
          params.action = 'updateMany';
          params.args = this.withSoftDeleteData(this.withActiveWhere(params.args));
          break;
        default:
          break;
      }

      return next(params);
    });
  }

  private isSoftDeleteModel(model: string | undefined): boolean {
    return model !== undefined && PrismaService.SOFT_DELETE_MODELS.has(model);
  }

  private withActiveWhere(args: Record<string, unknown> | undefined): Record<string, unknown> {
    const currentArgs = args ?? {};
    const currentWhere = this.asRecord(currentArgs.where);

    if (this.hasDeletedAtFilter(currentWhere)) {
      return currentArgs;
    }

    return {
      ...currentArgs,
      where: currentWhere
        ? {
            AND: [currentWhere, { [PrismaService.SOFT_DELETE_FIELD]: null }],
          }
        : { [PrismaService.SOFT_DELETE_FIELD]: null },
    };
  }

  private withSoftDeleteData(args: Record<string, unknown> | undefined): Record<string, unknown> {
    const currentArgs = args ?? {};
    const currentData = this.asRecord(currentArgs.data);

    return {
      ...currentArgs,
      data: {
        ...currentData,
        [PrismaService.SOFT_DELETE_FIELD]: new Date(),
      },
    };
  }

  private hasDeletedAtFilter(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.some((item) => this.hasDeletedAtFilter(item));
    }

    if (!this.isRecord(value)) {
      return false;
    }

    if (PrismaService.SOFT_DELETE_FIELD in value) {
      return true;
    }

    return Object.values(value).some((item) => this.hasDeletedAtFilter(item));
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return this.isRecord(value) ? value : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
