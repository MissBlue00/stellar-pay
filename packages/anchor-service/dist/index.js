"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AnchorService: () => AnchorService
});
module.exports = __toCommonJS(index_exports);

// src/anchor.service.ts
var AnchorService = class {
  payments = /* @__PURE__ */ new Map();
  transactions = /* @__PURE__ */ new Map();
  customers = /* @__PURE__ */ new Map();
  accountLinks = /* @__PURE__ */ new Map();
  // ---------------------------------------------------------------------------
  // SEP-31 Direct Payment
  // ---------------------------------------------------------------------------
  async createSep31DirectPayment(params) {
    const senderValidation = this.validateKyc(params.senderKyc);
    const receiverValidation = this.validateKyc(params.receiverKyc);
    if (!senderValidation.isValid) {
      const errorMsg = senderValidation.errors ? `Sender KYC validation failed: ${Object.entries(senderValidation.errors).map(([k, v]) => `${k}: ${v}`).join(", ")}` : "Sender KYC validation failed";
      return this.buildError(params, errorMsg);
    }
    if (!receiverValidation.isValid) {
      const errorMsg = receiverValidation.errors ? `Receiver KYC validation failed: ${Object.entries(receiverValidation.errors).map(([k, v]) => `${k}: ${v}`).join(", ")}` : "Receiver KYC validation failed";
      return this.buildError(params, errorMsg);
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
  validateKyc(kyc) {
    const errors = {};
    const invalidFields = [];
    const kycData = kyc;
    if (!kycData.firstName || typeof kycData.firstName !== "string" || !kycData.firstName.trim()) {
      errors["firstName"] = "First name is required and must be a non-empty string";
      invalidFields.push("firstName");
    }
    if (!kycData.lastName || typeof kycData.lastName !== "string" || !kycData.lastName.trim()) {
      errors["lastName"] = "Last name is required and must be a non-empty string";
      invalidFields.push("lastName");
    }
    if (!kycData.email || typeof kycData.email !== "string" || !kycData.email.trim()) {
      errors["email"] = "Email is required and must be a non-empty string";
      invalidFields.push("email");
    }
    if (!kycData.countryCode || typeof kycData.countryCode !== "string" || !kycData.countryCode.trim()) {
      errors["countryCode"] = "Country code is required and must be a non-empty string";
      invalidFields.push("countryCode");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (kycData.email && typeof kycData.email === "string" && !emailRegex.test(kycData.email)) {
      errors["email"] = "Email format is invalid";
      if (!invalidFields.includes("email")) {
        invalidFields.push("email");
      }
    }
    if (kycData.phoneNumber && typeof kycData.phoneNumber === "string") {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(kycData.phoneNumber.replace(/[\s\-()]/g, ""))) {
        errors["phoneNumber"] = "Phone number must be in valid international format";
        invalidFields.push("phoneNumber");
      }
    }
    const countryCode = kycData.countryCode?.toUpperCase();
    if (countryCode === "US") {
      if (!kycData.bankAccountNumber) {
        errors["bankAccountNumber"] = "SSN is required for US residents";
        invalidFields.push("bankAccountNumber");
      } else if (typeof kycData.bankAccountNumber === "string") {
        const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
        if (!ssnRegex.test(kycData.bankAccountNumber)) {
          errors["bankAccountNumber"] = "SSN must be in format XXX-XX-XXXX or XXXXXXXXX";
          invalidFields.push("bankAccountNumber");
        }
      }
    }
    const euCountries = [
      "AT",
      "BE",
      "BG",
      "HR",
      "CY",
      "CZ",
      "DK",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "HU",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SK",
      "SI",
      "ES",
      "SE"
    ];
    if (euCountries.includes(countryCode)) {
      if (!kycData.dateOfBirth) {
        errors["dateOfBirth"] = "Date of birth is required for EU residents";
        invalidFields.push("dateOfBirth");
      } else if (typeof kycData.dateOfBirth === "string") {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(kycData.dateOfBirth)) {
          errors["dateOfBirth"] = "Date of birth must be in YYYY-MM-DD format";
          invalidFields.push("dateOfBirth");
        } else {
          const dob = new Date(kycData.dateOfBirth);
          if (isNaN(dob.getTime())) {
            errors["dateOfBirth"] = "Date of birth is not a valid date";
            invalidFields.push("dateOfBirth");
          } else {
            const today = /* @__PURE__ */ new Date();
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || monthDiff === 0 && today.getDate() < dob.getDate()) {
              if (age < 18) {
                errors["dateOfBirth"] = "Must be at least 18 years old";
                invalidFields.push("dateOfBirth");
              }
            }
          }
        }
      }
    }
    return {
      isValid: invalidFields.length === 0,
      invalidFields: invalidFields.length > 0 ? invalidFields : void 0,
      errors: Object.keys(errors).length > 0 ? errors : void 0
    };
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
  async fetchTransactionHistory(params) {
    const {
      anchorUrl,
      account,
      asset,
      type,
      status,
      startDate,
      endDate,
      limit = 100,
      cursor,
      order
    } = params;
    const url = this.buildHistoryUrl(anchorUrl);
    const query = url.searchParams;
    if (account) query.set("account", account);
    if (asset) query.set("asset_code", asset);
    if (type) query.set("kind", type);
    if (status) query.set("status", status);
    if (startDate) query.set("start_time", this.formatHistoryTimestamp(startDate));
    if (endDate) query.set("end_time", this.formatHistoryTimestamp(endDate));
    query.set("limit", String(limit));
    if (cursor) query.set("cursor", cursor);
    if (order) query.set("order", order);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(
        `Anchor SEP-6 transaction history request failed: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    const rawTransactions = Array.isArray(data.transactions) ? data.transactions : Array.isArray(data.records) ? data.records : void 0;
    if (!rawTransactions) {
      throw new Error("Unexpected SEP-6 response format: missing transactions");
    }
    const transactions = rawTransactions.map(
      (tx) => this.normalizeAnchorTransaction(tx)
    );
    return {
      transactions,
      nextCursor: typeof data.next_cursor === "string" ? data.next_cursor : void 0,
      limit,
      total: typeof data.total === "number" ? data.total : void 0
    };
  }
  buildHistoryUrl(anchorUrl) {
    const url = new URL(anchorUrl);
    const pathname = url.pathname.replace(/\/$/, "");
    url.pathname = `${pathname}/transactions`;
    return url;
  }
  formatHistoryTimestamp(value) {
    if (value instanceof Date) {
      return Math.floor(value.getTime() / 1e3).toString();
    }
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1e3).toString();
    }
    return value;
  }
  normalizeAnchorTransaction(raw) {
    const createdAt = this.parseDateValue(raw.created_at ?? raw.createdAt);
    const updatedAt = this.parseDateValue(raw.updated_at ?? raw.updatedAt);
    return {
      id: String(raw.id ?? raw.transaction_id ?? ""),
      type: String(raw.kind ?? raw.type ?? ""),
      amount: parseFloat(String(raw.amount ?? raw.amount_in ?? "0")),
      amountRefunded: parseFloat(String(raw.amount_refunded ?? raw.amountRefunded ?? "0")),
      status: String(raw.status ?? raw.transaction_status ?? ""),
      asset: String(raw.asset_code ?? raw.asset ?? ""),
      sourceAddress: String(raw.source ?? raw.source_address ?? raw.from ?? ""),
      destinationAddress: String(raw.destination ?? raw.destination_address ?? raw.to ?? ""),
      memo: raw.memo ? String(raw.memo) : void 0,
      errorMessage: raw.error ? String(raw.error) : raw.error_message ? String(raw.error_message) : void 0,
      createdAt,
      updatedAt
    };
  }
  parseDateValue(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }
    }
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  // ---------------------------------------------------------------------------
  // SEP-12 Customer Info
  // ---------------------------------------------------------------------------
  async submitCustomerInfo(customerData) {
    const existingId = customerData.id ?? "";
    const isUpdate = !!customerData.id && this.customers.has(existingId);
    const customerId = isUpdate ? existingId : `cust_${crypto.randomUUID().split("-").join("").slice(0, 16)}`;
    const missingFields = this.validateRequiredFields(customerData, isUpdate);
    if (missingFields.length > 0) {
      return {
        success: false,
        customerId,
        status: "NEEDS_INFO",
        message: "Some required fields are missing",
        fieldsRequired: missingFields
      };
    }
    if (customerData.identityDocument) {
      const uploaded = await this.handleDocumentUpload(customerData.identityDocument);
      if (!uploaded) {
        return {
          success: false,
          customerId,
          status: "NEEDS_INFO",
          message: "Identity document upload failed",
          fieldsRequired: ["identityDocument"]
        };
      }
    }
    let status;
    if (isUpdate) {
      const existing = this.customers.get(existingId);
      if (!existing) {
        return {
          success: false,
          customerId,
          status: "NEEDS_INFO",
          message: "Customer record not found"
        };
      }
      existing.data = { ...existing.data, ...customerData };
      existing.status = "APPROVED";
      existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.customers.set(existingId, existing);
      status = existing.status;
    } else {
      const record = {
        customerId,
        data: customerData,
        status: "APPROVED",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.customers.set(customerId, record);
      status = record.status;
    }
    return {
      success: true,
      customerId,
      status,
      message: isUpdate ? "Customer info updated successfully" : "Customer info submitted successfully"
    };
  }
  getCustomer(customerId) {
    return this.customers.get(customerId);
  }
  getAllCustomers() {
    return Array.from(this.customers.values());
  }
  // ---------------------------------------------------------------------------
  // SEP-12 KYC Status
  // ---------------------------------------------------------------------------
  linkAccount(accountId, customerId) {
    this.accountLinks.set(accountId, customerId);
  }
  async checkKycStatus(accountId) {
    const customerId = this.accountLinks.get(accountId);
    if (!customerId) {
      return {
        accountId,
        status: "pending",
        message: "No KYC data found for this account. Please submit customer info first.",
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const customer = this.customers.get(customerId);
    if (!customer) {
      this.accountLinks.delete(accountId);
      return {
        accountId,
        status: "pending",
        message: "Customer record not found. Please resubmit customer info.",
        checkedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    let status;
    switch (customer.status) {
      case "APPROVED":
        status = "approved";
        break;
      case "REJECTED":
        status = "rejected";
        break;
      default:
        status = "pending";
        break;
    }
    return {
      accountId,
      status,
      customerId: customer.customerId,
      message: status === "approved" ? "KYC approved" : status === "rejected" ? "KYC rejected" : "KYC is still being processed",
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // ---------------------------------------------------------------------------
  // Fee Calculation
  // ---------------------------------------------------------------------------
  feeSchedule = {
    USDC: { flat: "1.00", percentage: "0" },
    USDT: { flat: "1.00", percentage: "0" },
    BTC: { flat: "0.0001", percentage: "0.5" },
    ETH: { flat: "0.001", percentage: "0.3" },
    XLM: { flat: "0.01", percentage: "0" }
  };
  async calculateAnchorFee(amount, asset, type) {
    const schedule = this.feeSchedule[asset] ?? { flat: "0", percentage: "1" };
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    const breakdown = [];
    let totalFee = 0;
    if (schedule.flat !== "0") {
      const flatFee = parseFloat(schedule.flat);
      totalFee += flatFee;
      breakdown.push({
        type: "flat",
        description: `Flat fee for ${asset}`,
        amount: schedule.flat
      });
    }
    if (schedule.percentage !== "0") {
      const percentageFee = parsedAmount * (parseFloat(schedule.percentage) / 100);
      totalFee += percentageFee;
      breakdown.push({
        type: "percentage",
        description: `${schedule.percentage}% fee on ${asset}`,
        amount: percentageFee.toFixed(7)
      });
    }
    const effectiveRate = parsedAmount > 0 ? (totalFee / parsedAmount * 100).toFixed(4) : "0";
    return {
      totalFee: totalFee.toFixed(7),
      asset,
      type,
      amount,
      feeBreakdown: breakdown,
      effectiveRate: `${effectiveRate}%`,
      quoteId: `fee_${crypto.randomUUID().split("-").join("").slice(0, 16)}`,
      expiresAt: new Date(Date.now() + 6e4).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  validateRequiredFields(data, isUpdate) {
    const missing = [];
    if (isUpdate) return missing;
    if (!data.firstName) missing.push("firstName");
    if (!data.lastName) missing.push("lastName");
    if (!data.email) missing.push("email");
    if (!data.countryCode) missing.push("countryCode");
    return missing;
  }
  async handleDocumentUpload(_document) {
    return true;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnchorService
});
