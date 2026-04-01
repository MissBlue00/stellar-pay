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
  StructuredLogger: () => StructuredLogger,
  createCorrelationId: () => createCorrelationId,
  createLogger: () => createLogger,
  getCorrelationId: () => getCorrelationId,
  getRequestContext: () => getRequestContext,
  logger: () => logger,
  runWithCorrelationId: () => runWithCorrelationId,
  runWithRequestContext: () => runWithRequestContext
});
module.exports = __toCommonJS(index_exports);

// src/request-context.ts
var import_node_async_hooks = require("async_hooks");
var import_node_crypto = require("crypto");
var storage = new import_node_async_hooks.AsyncLocalStorage();
function createCorrelationId(seed) {
  const value = seed?.trim();
  return value && value.length > 0 ? value : (0, import_node_crypto.randomUUID)();
}
function runWithRequestContext(context, callback) {
  const current = storage.getStore();
  return storage.run(
    {
      ...current,
      ...context,
      correlationId: createCorrelationId(context.correlationId ?? current?.correlationId)
    },
    callback
  );
}
function runWithCorrelationId(correlationId, callback) {
  return runWithRequestContext({ correlationId }, callback);
}
function getRequestContext() {
  return storage.getStore();
}
function getCorrelationId() {
  return storage.getStore()?.correlationId;
}

// src/logger.ts
var LOG_LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};
var ConsoleJsonTransport = class {
  write(entry) {
    const serialized = JSON.stringify(entry);
    if (entry.level === "error") {
      console.error(serialized);
      return;
    }
    if (entry.level === "warn") {
      console.warn(serialized);
      return;
    }
    console.log(serialized);
  }
};
var StructuredLogger = class _StructuredLogger {
  constructor(options) {
    this.options = options;
    this.transport = options.transport ?? new ConsoleJsonTransport();
  }
  transport;
  child(defaults) {
    return new _StructuredLogger({
      ...this.options,
      defaults: {
        ...this.options.defaults,
        ...defaults
      },
      transport: this.transport
    });
  }
  debug(message, metadata = {}) {
    this.log("debug", message, metadata);
  }
  info(message, metadata = {}) {
    this.log("info", message, metadata);
  }
  warn(message, metadata = {}) {
    this.log("warn", message, metadata);
  }
  error(message, metadata = {}) {
    this.log("error", message, metadata);
  }
  log(level, message, metadata) {
    if (!shouldLog(level)) {
      return;
    }
    const context = getRequestContext();
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      service: this.options.serviceName,
      message,
      environment: process.env.NODE_ENV ?? "development",
      correlationId: getCorrelationId(),
      ...this.options.defaults,
      ...context,
      ...serializeMetadata(metadata)
    };
    Object.keys(entry).forEach((key) => {
      if (entry[key] === void 0) {
        delete entry[key];
      }
    });
    this.transport.write(entry);
  }
};
function shouldLog(level) {
  const configuredLevel = parseLogLevel(process.env.LOG_LEVEL);
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
}
function parseLogLevel(value) {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}
function serializeMetadata(metadata) {
  return Object.entries(metadata).reduce((result, [key, value]) => {
    if (value === void 0) {
      return result;
    }
    if (key === "error") {
      result.error = serializeError(value);
      return result;
    }
    if (value instanceof Error) {
      result[key] = serializeError(value);
      return result;
    }
    result[key] = value;
    return result;
  }, {});
}
function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return error;
}
function createLogger(options = {}) {
  return new StructuredLogger({
    serviceName: options.serviceName ?? "@stellar-pay/compliance-engine",
    transport: options.transport,
    defaults: options.defaults
  });
}
var logger = createLogger({ serviceName: "@stellar-pay/compliance-engine" });
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StructuredLogger,
  createCorrelationId,
  createLogger,
  getCorrelationId,
  getRequestContext,
  logger,
  runWithCorrelationId,
  runWithRequestContext
});
