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
  TransactionType: () => TransactionType,
  calculateAnchorFee: () => calculateAnchorFee
});
module.exports = __toCommonJS(index_exports);
var TransactionType = /* @__PURE__ */ ((TransactionType2) => {
  TransactionType2["DEPOSIT"] = "deposit";
  TransactionType2["WITHDRAWAL"] = "withdrawal";
  TransactionType2["TRANSFER"] = "transfer";
  return TransactionType2;
})(TransactionType || {});
var FEE_SCHEDULES = {
  USDC: {
    ["deposit" /* DEPOSIT */]: { flatFee: 0.5, percentageFee: 1e-3 },
    ["withdrawal" /* WITHDRAWAL */]: { flatFee: 1, percentageFee: 2e-3 },
    ["transfer" /* TRANSFER */]: { flatFee: 0.25, percentageFee: 5e-4 }
  },
  XLM: {
    ["deposit" /* DEPOSIT */]: { flatFee: 0.01, percentageFee: 5e-4 },
    ["withdrawal" /* WITHDRAWAL */]: { flatFee: 0.05, percentageFee: 1e-3 },
    ["transfer" /* TRANSFER */]: { flatFee: 0.01, percentageFee: 5e-4 }
  }
};
var DEFAULT_FEE_SCHEDULE = {
  flatFee: 1,
  percentageFee: 5e-3
};
function toFixed(value, decimals = 7) {
  return value.toFixed(decimals);
}
async function calculateAnchorFee(amount, asset, type) {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const assetSchedules = FEE_SCHEDULES[asset.toUpperCase()];
  const schedule = (assetSchedules && assetSchedules[type]) ?? DEFAULT_FEE_SCHEDULE;
  const flatFee = schedule.flatFee;
  const percentageFee = parsedAmount * schedule.percentageFee;
  const totalFee = flatFee + percentageFee;
  const netAmount = Math.max(0, parsedAmount - totalFee);
  return {
    asset,
    transactionType: type,
    inputAmount: toFixed(parsedAmount),
    flatFee: toFixed(flatFee),
    percentageFee: toFixed(percentageFee),
    totalFee: toFixed(totalFee),
    netAmount: toFixed(netAmount)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TransactionType,
  calculateAnchorFee
});
