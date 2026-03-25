export interface CustomerDocumentFile {
  fileName: string;
  data: string | Uint8Array | ArrayBuffer;
  mimeType?: string;
  type?: string; // SEP-12 document type, e.g. `id_document`, `proof_of_address`
}

export interface CustomerData {
  id?: string;
  account?: string;
  type?: string;
  email_address?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  [customField: string]: unknown;
  documents?: CustomerDocumentFile[];
}

export interface CustomerPutResponse {
  id: string;
  status: string;
  account?: string;
  type?: string;
  required?: unknown;
  message?: string;
  [key: string]: unknown;
}

export interface AnchorServiceConfig {
  baseUrl: string;
  authToken?: string;
  fetchFn?: FetchFn;
}

export type FetchFn = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string | unknown;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
}>;

let _anchorServiceConfig: AnchorServiceConfig | null = null;

export function configureAnchorService(config: AnchorServiceConfig): void {
  if (!config || !config.baseUrl || config.baseUrl.trim().length === 0) {
    throw new Error('Anchor service configuration must include baseUrl.');
  }

  _anchorServiceConfig = {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, ''),
  };
}

function getConfig(): AnchorServiceConfig {
  if (!_anchorServiceConfig) {
    throw new Error('Anchor service is not configured. Call configureAnchorService first.');
  }
  return _anchorServiceConfig;
}

function getFetchFn(): FetchFn {
  const cfg = getConfig();
  if (cfg.fetchFn) {
    return cfg.fetchFn;
  }

  const globalFetch = (globalThis as unknown as { fetch?: typeof fetch }).fetch;
  if (typeof globalFetch === 'function') {
    return globalFetch.bind(globalThis) as FetchFn;
  }

  throw new Error('Fetch is not available. Provide fetchFn in AnchorServiceConfig.');
}

function buildHeaders(isJson: boolean): Record<string, string> {
  const cfg = getConfig();
  const headers: Record<string, string> = {};

  if (cfg.authToken) {
    headers.Authorization = `Bearer ${cfg.authToken}`;
  }

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function serializeCustomerPayload(customerData: CustomerData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const key of Object.keys(customerData)) {
    if (key === 'id' || key === 'documents') {
      continue;
    }
    const value = customerData[key];
    if (value !== undefined && value !== null) {
      payload[key] = value;
    }
  }

  return payload;
}

async function uploadCustomerDocument(
  customerId: string,
  document: CustomerDocumentFile,
): Promise<void> {
  const cfg = getConfig();
  const fetchFn = getFetchFn();
  const formDataConstructor = (globalThis as unknown as { FormData?: typeof FormData }).FormData;

  if (!formDataConstructor) {
    throw new Error('FormData is not available in this environment; required for file uploads.');
  }

  const formData = new formDataConstructor();

  formData.append('type', document.type || 'id_document');

  const blobConstructor = (globalThis as unknown as { Blob?: typeof Blob }).Blob;

  if (typeof document.data === 'string') {
    if (blobConstructor) {
      const fileBlob = new blobConstructor([document.data], {
        type: document.mimeType || 'application/octet-stream',
      });
      formData.append('file', fileBlob, document.fileName);
      return;
    }

    formData.append('file', document.data);
    return;
  }

  if (document.data instanceof Uint8Array || document.data instanceof ArrayBuffer) {
    if (!blobConstructor) {
      throw new Error('Blob is required for binary document uploads in this environment.');
    }

    let binaryData: BlobPart;

    if (document.data instanceof Uint8Array) {
      binaryData = new Uint8Array(document.data.buffer as ArrayBuffer) as unknown as BlobPart;
    } else {
      binaryData = new Uint8Array(document.data as ArrayBuffer) as unknown as BlobPart;
    }

    const fileBlob = new blobConstructor([binaryData], {
      type: document.mimeType || 'application/octet-stream',
    });
    formData.append('file', fileBlob, document.fileName);
    return;
  }

  throw new Error('Unsupported document data type for customer document upload.');

  const response = await fetchFn(
    `${cfg.baseUrl}/customer/${encodeURIComponent(customerId)}/documents`,
    {
      method: 'POST',
      headers: {
        ...(cfg.authToken ? { Authorization: `Bearer ${cfg.authToken}` } : {}),
        // Do NOT set Content-Type; let FormData set boundary
      },
      body: formData as unknown as string,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Document upload failed (status: ${response.status}): ${text}`);
  }
}

async function applyDocumentUploads(
  customerId: string,
  documents?: CustomerDocumentFile[],
): Promise<void> {
  if (!documents || documents.length === 0) {
    return;
  }

  for (const document of documents) {
    await uploadCustomerDocument(customerId, document);
  }
}

export async function submitCustomerInfo(customerData: CustomerData): Promise<CustomerPutResponse> {
  if (!customerData || typeof customerData !== 'object') {
    throw new Error('customerData is required.');
  }

  const cfg = getConfig();
  const fetchFn = getFetchFn();

  const customerId = customerData.id;
  const endpoint = customerId
    ? `${cfg.baseUrl}/customer/${encodeURIComponent(customerId)}`
    : `${cfg.baseUrl}/customer`;

  const method = customerId ? 'PUT' : 'POST';
  const bodyPayload = serializeCustomerPayload(customerData);

  const response = await fetchFn(endpoint, {
    method,
    headers: buildHeaders(true),
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`submitCustomerInfo failed (status: ${response.status}): ${text}`);
  }

  const responseData = (await response.json()) as CustomerPutResponse;

  const returnedCustomerId = responseData.id || customerId;
  if (!returnedCustomerId) {
    throw new Error('submitCustomerInfo did not receive customer id from anchor response.');
  }

  if (customerData.documents && customerData.documents.length > 0) {
    await applyDocumentUploads(returnedCustomerId, customerData.documents);
  }

  return {
    ...responseData,
    id: returnedCustomerId,
  };
}
