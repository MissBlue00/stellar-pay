export interface CustomerData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  dateOfBirth?: string;
  streetAddress?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  identityDocument?: IdentityDocument;
}

export interface IdentityDocument {
  type: 'passport' | 'drivers_license' | 'national_id';
  country: string;
  file: FileContent;
}

export interface FileContent {
  data: Uint8Array;
  contentType: string;
  filename: string;
}

export type CustomerStatus = 'NEEDS_INFO' | 'PROCESSING' | 'APPROVED' | 'REJECTED';

export interface CustomerPutResponse {
  success: boolean;
  customerId: string;
  status: CustomerStatus;
  message?: string;
  fieldsRequired?: string[];
  error?: string;
}
