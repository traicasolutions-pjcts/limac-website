export type SerialValidationResult =
  | 'FOUND_UNREGISTERED'
  | 'FOUND_ALREADY_REGISTERED'
  | 'NOT_FOUND'
  | 'VALIDATION_NOT_AVAILABLE'

export type RegistrationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export interface SerialValidationResponse {
  result: SerialValidationResult
  serial_normalized: string
  advisory_message: string
}

export interface WarrantyRegistrationPayload {
  customer: {
    name: string
    address_line: string
    city: string
    state: string
    pin_code: string
    mobile_number: string
  }
  serial_number: string
  product_model?: string
  purchase: {
    purchase_date: string
    invoice_number: string
    dealer_name: string
    dealer_code?: string
  }
  warranty_terms_consent: boolean
  privacy_policy_consent: boolean
  turnstile_token: string
}

export interface WarrantyRegistrationCreated {
  registration_number: string
  status: RegistrationStatus
  submitted_at: string
}

export interface StatusLookupPayload {
  registration_reference: string
  mobile_number?: string
  serial_number?: string
}

export interface StatusLookupResponse {
  registration_reference: string
  status: RegistrationStatus
  submitted_at?: string
  masked_mobile?: string
  masked_serial?: string
  warranty_number?: string
  message?: string
}

export interface AdminLoginPayload {
  email: string
  password: string
}

export interface AdminLoginResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  role: 'REVIEWER' | 'APPROVER' | 'SUPER_ADMIN'
}

export type AdminRole = AdminLoginResponse['role']

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  disabled_at?: string | null
  last_login_at?: string | null
  created_at?: string | null
}

export interface AdminUserCreatePayload {
  email: string
  password: string
  role: 'APPROVER' | 'SUPER_ADMIN'
}

export interface AdminRegistrationRow {
  id?: string
  _id?: string
  registration_number: string
  status: RegistrationStatus
  customer_name: string
  mobile_number: string
  serial_number: string
  serial_normalized: string
  invoice_number: string
  dealer_name: string
  submitted_at: string
  serial_validation_result?: SerialValidationResult
  has_bill: boolean
}

export interface AdminRegistrationListResponse {
  items: AdminRegistrationRow[]
  limit: number
  skip: number
}

export interface AdminBillAccessResponse {
  filename: string
  content_type: string
  url: string
}

export interface AdminRegistrationDetail {
  _id: string
  registration_number: string
  status: RegistrationStatus
  customer: {
    name: string
    address_line: string
    city: string
    state: string
    pin_code: string
    mobile_number: string
  }
  product: {
    serial_number: string
    serial_normalized: string
    product_model_customer?: string
  }
  purchase: {
    purchase_date: string
    invoice_number: string
    dealer_name: string
    dealer_code?: string
  }
  submitted_at: string
  serial_validation?: {
    result?: SerialValidationResult
    serial_normalized?: string
  }
  bill_asset?: {
    provider?: string
    filename?: string
    content_type?: string
    bytes?: number
    folder?: string
    public_id?: string
  }
  decision_history?: Array<{
    status: RegistrationStatus
    reason?: string
    created_at: string
  }>
}
