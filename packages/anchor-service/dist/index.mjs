// src/anchor.service.ts
var AnchorService = class {
  payments = /* @__PURE__ */ new Map();
  transactions = /* @__PURE__ */ new Map();
  // ---------------------------------------------------------------------------
  // SEP-31 Direct Payment
  // ---------------------------------------------------------------------------
  async createSep31DirectPayment(params) {
    const senderValid = this.validateKyc(params.senderKyc);
    const receiverValid = this.validateKyc(params.receiverKyc);
    if (!senderValid) {
      return this.buildError(params, "Sender KYC validation failed");
    }
    if (!receiverValid) {
      return this.buildError(params, "Receiver KYC validation failed");
    }
    const paymentId = `sep31_${crypto.randomUUID().split("-").join("").slice(0, 16)}`;
    const record = {
      paymentId,
      senderId: params.senderId,
      receiverId: params.receiverId,
      amount: params.amount,
      assetCode: params.assetCode,
      originalTransactionRef: params.originalTransactionRef,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.payments.set(paymentId, record);
    try {
      const txHash = `tx_${crypto.randomUUID().split("-").join("").slice(0, 16)}`;
      record.stellarTransactionHash = txHash;
      record.status = "completed";
      record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.payments.set(paymentId, record);
      return {
        success: true,
        paymentId,
        stellarTransactionHash: txHash,
        originalTransactionRef: params.originalTransactionRef,
        amount: params.amount,
        assetCode: params.assetCode,
        status: "completed",
        createdAt: record.createdAt
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      record.status = "failed";
      record.error = errorMessage;
      record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.payments.set(paymentId, record);
      return {
        success: false,
        paymentId,
        originalTransactionRef: params.originalTransactionRef,
        amount: params.amount,
        assetCode: params.assetCode,
        status: "failed",
        error: errorMessage,
        createdAt: record.createdAt
      };
    }
  }
  getPayment(paymentId) {
    return this.payments.get(paymentId);
  }
  getAllPayments() {
    return Array.from(this.payments.values());
  }
  validateKyc(_kyc) {
    return true;
  }
  buildError(params, error) {
    return {
      success: false,
      paymentId: "",
      originalTransactionRef: params.originalTransactionRef,
      amount: params.amount,
      assetCode: params.assetCode,
      status: "failed",
      error,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // ---------------------------------------------------------------------------
  // Anchor Refund
  // ---------------------------------------------------------------------------
  registerTransaction(tx) {
    this.transactions.set(tx.id, { ...tx, amountRefunded: tx.amountRefunded ?? 0 });
  }
  async processAnchorRefund(transactionId) {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      return {
        transactionId,
        success: false,
        amountRefunded: 0,
        totalAmount: 0,
        isPartialRefund: false,
        status: "failed",
        error: `Transaction ${transactionId} not found`,
        refundedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (tx.status === "refunded") {
      return {
        transactionId,
        success: false,
        amountRefunded: tx.amountRefunded,
        totalAmount: tx.amount,
        isPartialRefund: false,
        status: "failed",
        error: "Transaction has already been fully refunded",
        refundedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (tx.status !== "failed") {
      return {
        transactionId,
        success: false,
        amountRefunded: tx.amountRefunded,
        totalAmount: tx.amount,
        isPartialRefund: false,
        status: "failed",
        error: `Transaction is in status '${tx.status}' and cannot be refunded`,
        refundedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const remaining = tx.amount - tx.amountRefunded;
    const isPartial = tx.amountRefunded > 0 && remaining > 0;
    tx.amountRefunded = tx.amount;
    tx.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    let newStatus;
    if (isPartial) {
      newStatus = "partially_refunded";
    } else {
      newStatus = "refunded";
    }
    tx.status = newStatus;
    this.transactions.set(tx.id, tx);
    return {
      transactionId,
      success: true,
      amountRefunded: remaining,
      totalAmount: tx.amount,
      isPartialRefund: isPartial,
      status: newStatus,
      refundedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  getTransaction(id) {
    return this.transactions.get(id);
  }
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }
};
export {
  AnchorService
};
