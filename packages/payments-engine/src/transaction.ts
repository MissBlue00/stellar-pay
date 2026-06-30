import * as StellarSdk from 'stellar-sdk';

export function buildSignedTransaction(
  builder: StellarSdk.TransactionBuilder,
  keypair: StellarSdk.Keypair,
): StellarSdk.Transaction {
  const transaction = builder.build();

  if (!transaction.operations.length) {
    throw new Error('Transaction must contain at least one operation');
  }

  transaction.sign(keypair);

  return transaction;
}
