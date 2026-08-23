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
  serial_number?: string
  serial_numbers: string[]
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

export interface AdminProduct {
  id: string
  serial_number: string
  serial_normalized: string
  product_model: string
  sold_at?: string | null
  status: string
  source_system?: string | null
  updated_at?: string | null
}

export interface AdminProductCreatePayload {
  serial_number: string
  product_model: string
  sold_at?: string | null
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
  component_serial_numbers?: string[]
  invoice_number: string
  dealer_name: string
  purchase_date: string
  replacement_warranty_expiry_date?: string
  service_warranty_expiry_date?: string
  submitted_at: string
  serial_validation_result?: SerialValidationResult
  has_bill: boolean
}

export interface AdminRegistrationListResponse {
  items: AdminRegistrationRow[]
  limit: number
  skip: number
}

export type AdminWarrantyFilter =
  | 'replacement_expired'
  | 'service_expired'
  | 'replacement_under_warranty'
  | 'service_under_warranty'

export interface AdminWarrantySummary {
  replacement_expired: number
  service_expired: number
  replacement_under_warranty: number
  service_under_warranty: number
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
    components?: Array<{
      serial_number: string
      serial_normalized: string
    }>
  }
  purchase: {
    purchase_date: string
    replacement_warranty_expiry_date?: string
    service_warranty_expiry_date?: string
    invoice_number: string
    dealer_name: string
    dealer_code?: string
  }
  submitted_at: string
  serial_validation?: {
    result?: SerialValidationResult
    serial_normalized?: string
    components?: Array<{
      serial_number: string
      serial_normalized?: string | null
      result?: SerialValidationResult
      product_model?: string | null
      product_status?: string | null
    }>
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
    event_type?: string
    status: RegistrationStatus
    admin_id?: string
    reason?: string
    replacement_warranty_expiry_date?: string
    service_warranty_expiry_date?: string
    previous?: Record<string, string | null | undefined>
    updated?: Record<string, string | null | undefined>
    created_at: string
  }>
}

export interface AdminRegistrationChangeLogRow {
  registration_number: string
  status: RegistrationStatus
  customer_name?: string
  mobile_number?: string
  serial_numbers: string[]
  submitted_at?: string
  decision_history: AdminRegistrationDetail['decision_history']
}
