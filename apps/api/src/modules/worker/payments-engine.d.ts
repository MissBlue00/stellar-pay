declare module '@stellar-pay/payments-engine' {
  export class StellarService {
    sendFunds(destinationAddress: string, amount: string): Promise<string>;
  }
}
