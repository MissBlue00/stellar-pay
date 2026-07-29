import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentMerchant } from '../auth/decorators/current-merchant.decorator';
import { type MerchantUser } from '../auth/interfaces/merchant-user.interface';
import { TransactionNetwork } from './interfaces/transaction.interface';
import { TransactionsService } from './transactions.service';

interface RegisterTransactionDto {
  hash: string;
  network: TransactionNetwork;
}

interface ListTransactionsQueryDto {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Register a transaction hash for confirmation monitoring.
   * Body: { hash: string, network: "STELLAR" | "BTC" | "ETH" }
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Register a transaction hash for monitoring' })
  @ApiResponse({ status: 201, description: 'Transaction registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  register(@Body() dto: RegisterTransactionDto, @CurrentMerchant() merchant: MerchantUser) {
    return this.transactionsService.register(dto.hash, dto.network, merchant.merchant_id);
  }

  /** List all tracked transactions for the authenticated merchant. */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List tracked transactions for the authenticated merchant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['deposit', 'withdrawal'] })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'confirming', 'confirmed', 'failed'],
  })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(
    @CurrentMerchant() merchant: MerchantUser,
    @Query() query: ListTransactionsQueryDto = {},
  ) {
    return this.transactionsService.findAll(merchant.merchant_id, {
      page: query.page,
      limit: query.limit,
      type: query.type,
      status: query.status,
      from: query.from,
      to: query.to,
    });
  }

  /** Get a single tracked transaction by its internal ID. */
  @Get(':id')
  @ApiOperation({ summary: 'Get a tracked transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(@Param('id') id: string) {
    const tx = this.transactionsService.findOne(id);
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }
}
