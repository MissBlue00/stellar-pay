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
  transactions = /* @__PURE__ */ new Map();
  customers = /* @__PURE__ */ new Map();
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
  // ---------------------------------------------------------------------------
  // SEP-12 Customer Info
  // ---------------------------------------------------------------------------
  async submitCustomerInfo(customerData) {
    const customerId = customerData.id ?? `cust_${crypto.randomUUID().split("-").join("").slice(0, 16)}`;
    const isUpdate = !!customerData.id && this.customers.has(customerData.id);
    const missingFields = this.validateRequiredFields(customerData, isUpdate);
    if (missingFields.length > 0) {
      return {
        success: false,
        customerId: isUpdate ? customerData.id : "",
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
      const existing = this.customers.get(customerData.id);
      existing.data = { ...existing.data, ...customerData };
      existing.status = "APPROVED";
      existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.customers.set(customerData.id, existing);
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
