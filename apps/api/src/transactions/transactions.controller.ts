import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { TransactionNetwork } from './interfaces/transaction.interface';
import { TransactionsService } from './transactions.service';

interface RegisterTransactionDto {
  hash: string;
  network: TransactionNetwork;
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Register a transaction hash for confirmation monitoring.
   * Body: { hash: string, network: "STELLAR" | "BTC" | "ETH" }
   */
  @Post()
  register(@Body() dto: RegisterTransactionDto) {
    return this.transactionsService.register(dto.hash, dto.network);
  }

  /** List all tracked transactions. */
  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  /** Get a single tracked transaction by its internal ID. */
  @Get(':id')
  findOne(@Param('id') id: string) {
    const tx = this.transactionsService.findOne(id);
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }
}
