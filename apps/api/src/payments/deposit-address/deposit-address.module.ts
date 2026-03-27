import { Module } from '@nestjs/common';
import { DepositAddressController } from './deposit-address.controller';
import { DepositAddressService } from './deposit-address.service';
import { StellarWalletService } from './wallet/stellar.wallet.service';
import { EthereumWalletService } from './wallet/ethereum.wallet.service';
import { BitcoinWalletService } from './wallet/bitcoin.wallet.service';

@Module({
  controllers: [DepositAddressController],
  providers: [
    DepositAddressService,
    StellarWalletService,
    EthereumWalletService,
    BitcoinWalletService,
  ],
  exports: [DepositAddressService],
})
export class DepositAddressModule {}
