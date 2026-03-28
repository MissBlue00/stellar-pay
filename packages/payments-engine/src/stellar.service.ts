import * as StellarSdk from 'stellar-sdk';

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private sourceKeypair!: StellarSdk.Keypair;

  constructor() {
    // Default to testnet if not explicitly set
    const networkUrl = process.env.STELLAR_NETWORK_URL || 'https://horizon-testnet.stellar.org';
    this.server = new StellarSdk.Horizon.Server(networkUrl);

    // In production, this must be securely injected
    const secret =
      process.env.STELLAR_STORAGE_SECRET ||
      'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; // Replace with a valid testnet secret for local dev

    try {
      this.sourceKeypair = StellarSdk.Keypair.fromSecret(secret);
    } catch {
      console.warn('Invalid STELLAR_STORAGE_SECRET. Stellar operations will fail.');
    }
  }

  /**
   * Sends funds from the operational storage to a destination address
   */
  async sendFunds(destinationAddress: string, amount: string): Promise<string> {
    try {
      const sourceAccount = await this.server.loadAccount(this.sourceKeypair.publicKey());

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: process.env.STELLAR_NETWORK_URL?.includes('public')
          ? StellarSdk.Networks.PUBLIC
          : StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationAddress,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          }),
        )
        .setTimeout(30)
        .build();

      transaction.sign(this.sourceKeypair);

      const response = await this.server.submitTransaction(transaction);
      return response.hash;
    } catch (error) {
      console.error('Stellar transaction failed:', error);
      throw error; // Rethrow to let the worker handle the failure state
    }
  }
}
