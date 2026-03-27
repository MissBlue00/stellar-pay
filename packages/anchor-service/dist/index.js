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
  configureAnchorService: () => configureAnchorService,
  submitCustomerInfo: () => submitCustomerInfo
});
module.exports = __toCommonJS(index_exports);
var _anchorServiceConfig = null;
function configureAnchorService(config) {
  if (!config || !config.baseUrl || config.baseUrl.trim().length === 0) {
    throw new Error("Anchor service configuration must include baseUrl.");
  }
  _anchorServiceConfig = {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, "")
  };
}
function getConfig() {
  if (!_anchorServiceConfig) {
    throw new Error("Anchor service is not configured. Call configureAnchorService first.");
  }
  return _anchorServiceConfig;
}
function getFetchFn() {
  const cfg = getConfig();
  if (cfg.fetchFn) {
    return cfg.fetchFn;
  }
  const globalFetch = globalThis.fetch;
  if (typeof globalFetch === "function") {
    return globalFetch.bind(globalThis);
  }
  throw new Error("Fetch is not available. Provide fetchFn in AnchorServiceConfig.");
}
function buildHeaders(isJson) {
  const cfg = getConfig();
  const headers = {};
  if (cfg.authToken) {
    headers.Authorization = `Bearer ${cfg.authToken}`;
  }
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}
function serializeCustomerPayload(customerData) {
  const payload = {};
  for (const key of Object.keys(customerData)) {
    if (key === "id" || key === "documents") {
      continue;
    }
    const value = customerData[key];
    if (value !== void 0 && value !== null) {
      payload[key] = value;
    }
  }
  return payload;
}
async function uploadCustomerDocument(customerId, document) {
  const cfg = getConfig();
  const fetchFn = getFetchFn();
  const formDataConstructor = globalThis.FormData;
  if (!formDataConstructor) {
    throw new Error("FormData is not available in this environment; required for file uploads.");
  }
  const formData = new formDataConstructor();
  formData.append("type", document.type || "id_document");
  const blobConstructor = globalThis.Blob;
  if (typeof document.data === "string") {
    if (blobConstructor) {
      const fileBlob = new blobConstructor([document.data], {
        type: document.mimeType || "application/octet-stream"
      });
      formData.append("file", fileBlob, document.fileName);
      return;
    }
    formData.append("file", document.data);
    return;
  }
  if (document.data instanceof Uint8Array || document.data instanceof ArrayBuffer) {
    if (!blobConstructor) {
      throw new Error("Blob is required for binary document uploads in this environment.");
    }
    let binaryData;
    if (document.data instanceof Uint8Array) {
      binaryData = new Uint8Array(document.data.buffer);
    } else {
      binaryData = new Uint8Array(document.data);
    }
    const fileBlob = new blobConstructor([binaryData], {
      type: document.mimeType || "application/octet-stream"
    });
    formData.append("file", fileBlob, document.fileName);
    return;
  }
  throw new Error("Unsupported document data type for customer document upload.");
  const response = await fetchFn(
    `${cfg.baseUrl}/customer/${encodeURIComponent(customerId)}/documents`,
    {
      method: "POST",
      headers: {
        ...cfg.authToken ? { Authorization: `Bearer ${cfg.authToken}` } : {}
        // Do NOT set Content-Type; let FormData set boundary
      },
      body: formData
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Document upload failed (status: ${response.status}): ${text}`);
  }
}
async function applyDocumentUploads(customerId, documents) {
  if (!documents || documents.length === 0) {
    return;
  }
  for (const document of documents) {
    await uploadCustomerDocument(customerId, document);
  }
}
async function submitCustomerInfo(customerData) {
  if (!customerData || typeof customerData !== "object") {
    throw new Error("customerData is required.");
  }
  const cfg = getConfig();
  const fetchFn = getFetchFn();
  const customerId = customerData.id;
  const endpoint = customerId ? `${cfg.baseUrl}/customer/${encodeURIComponent(customerId)}` : `${cfg.baseUrl}/customer`;
  const method = customerId ? "PUT" : "POST";
  const bodyPayload = serializeCustomerPayload(customerData);
  const response = await fetchFn(endpoint, {
    method,
    headers: buildHeaders(true),
    body: JSON.stringify(bodyPayload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`submitCustomerInfo failed (status: ${response.status}): ${text}`);
  }
  const responseData = await response.json();
  const returnedCustomerId = responseData.id || customerId;
  if (!returnedCustomerId) {
    throw new Error("submitCustomerInfo did not receive customer id from anchor response.");
  }
  if (customerData.documents && customerData.documents.length > 0) {
    await applyDocumentUploads(returnedCustomerId, customerData.documents);
  }
  return {
    ...responseData,
    id: returnedCustomerId
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  configureAnchorService,
  submitCustomerInfo
});
