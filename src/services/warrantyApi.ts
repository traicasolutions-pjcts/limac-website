import type {
  AdminLoginPayload,
  AdminLoginResponse,
  AdminBillAccessResponse,
  AdminProduct,
  AdminProductCreatePayload,
  AdminRegistrationDetail,
  AdminRegistrationListResponse,
  AdminUser,
  AdminUserCreatePayload,
  SerialValidationResponse,
  StatusLookupPayload,
  StatusLookupResponse,
  WarrantyRegistrationCreated,
  WarrantyRegistrationPayload,
} from '@/types/warranty'

const API_BASE =
  process.env.NEXT_PUBLIC_WARRANTY_API_URL?.replace(/\/$/, '') ||
  'http://127.0.0.1:8000/api/v1'

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.detail || 'Warranty service is temporarily unavailable.'
    throw new Error(Array.isArray(message) ? formatValidationErrors(message) : message)
  }
  return body as T
}

async function requestForm<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    body: formData,
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.detail || 'Warranty service is temporarily unavailable.'
    throw new Error(Array.isArray(message) ? formatValidationErrors(message) : message)
  }
  return body as T
}

function formatValidationErrors(errors: Array<{ loc?: Array<string | number>; msg: string }>) {
  const fieldLabels: Record<string, string> = {
    'body.customer.name': 'Name',
    'body.customer.address_line': 'Address line',
    'body.customer.city': 'City',
    'body.customer.state': 'State',
    'body.customer.pin_code': 'PIN code',
    'body.customer.mobile_number': 'Mobile number',
    'body.serial_number': 'Product serial number',
    'body.serial_numbers': 'Product serial numbers',
    'body.purchase.purchase_date': 'Purchase date',
    'body.purchase.invoice_number': 'Invoice number',
    'body.purchase.dealer_name': 'Dealer/shop name',
  }

  return errors
    .map((error) => {
      const key = error.loc?.join('.') || ''
      const label = fieldLabels[key] || key || 'Field'
      const friendlyMessage =
        error.msg.includes('at least 5 characters')
          ? 'must have at least 5 characters'
          : error.msg.includes('pattern')
            ? 'must be exactly 6 digits'
            : error.msg
      return `${label}: ${friendlyMessage}`
    })
    .join(', ')
}

export function validateSerial(serial: string) {
  return requestJson<SerialValidationResponse>(
    `/public/products/${encodeURIComponent(serial)}/validation`
  )
}

export function createWarrantyRegistration(
  payload: WarrantyRegistrationPayload,
  idempotencyKey: string
) {
  return requestJson<WarrantyRegistrationCreated>('/public/warranty-registrations', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  })
}

export function uploadWarrantyBill(reference: string, bill: File) {
  const formData = new FormData()
  formData.append('bill', bill)
  return requestForm<{ reference: string; status: string; message: string }>(
    `/public/warranty-registrations/${encodeURIComponent(reference)}/documents`,
    formData,
    { method: 'POST' }
  )
}

export function lookupWarrantyStatus(payload: StatusLookupPayload) {
  return requestJson<StatusLookupResponse>('/public/warranty-registrations/status-lookup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginWarrantyAdmin(payload: AdminLoginPayload) {
  return requestJson<AdminLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listWarrantyRegistrations(token: string, status?: string, search?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search?.trim()) params.set('search', search.trim())
  const query = params.toString() ? `?${params.toString()}` : ''
  return requestJson<AdminRegistrationListResponse>(`/admin/registrations${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then((response) => ({
    ...response,
    items: response.items.map((item) => ({
      ...item,
      id: validIdentifier(item.id) || validIdentifier(item._id) || validIdentifier(item.registration_number),
    })),
  }))
}

export function getWarrantyRegistration(token: string, registrationId: string) {
  return requestJson<AdminRegistrationDetail>(`/admin/registrations/${registrationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function updateWarrantyRegistrationStatus(
  token: string,
  registrationId: string,
  status: string,
  reason?: string,
  warrantyExpiryDate?: string
) {
  return requestJson<{ id: string; status: string }>(`/admin/registrations/${registrationId}/status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      status,
      reason,
      warranty_expiry_date: warrantyExpiryDate || undefined,
    }),
  })
}

export function deleteWarrantyRegistration(token: string, registrationId: string) {
  return requestJson<{ id: string; status: string }>(`/admin/registrations/${registrationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function downloadWarrantyRegistrationsCsv(token: string, status?: string, search?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search?.trim()) params.set('search', search.trim())
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE}/admin/registrations/export.csv${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Unable to export registrations.')
  }
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="([^"]+)"/)
  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] || `limac-warranty-registrations-${new Date().toISOString().slice(0, 10)}.csv`,
  }
}

export function getWarrantyBillAccess(token: string, registrationId: string) {
  return requestJson<AdminBillAccessResponse>(`/admin/registrations/${registrationId}/bill-access`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function downloadWarrantyBillFile(token: string, registrationId: string) {
  const response = await fetch(`${API_BASE}/admin/registrations/${registrationId}/bill-file`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'Unable to open bill.')
  }
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="([^"]+)"/)
  return {
    blob: await response.blob(),
    contentType: response.headers.get('Content-Type') || 'application/octet-stream',
    filename: filenameMatch?.[1] || 'bill',
  }
}

export function listWarrantyProducts(token: string, search?: string) {
  const params = new URLSearchParams()
  if (search?.trim()) params.set('search', search.trim())
  const query = params.toString() ? `?${params.toString()}` : ''
  return requestJson<AdminProduct[]>(`/admin/products${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function upsertWarrantyProduct(token: string, payload: AdminProductCreatePayload) {
  return requestJson<AdminProduct>('/admin/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function deleteWarrantyProduct(token: string, productId: string) {
  return requestJson<{ id: string; status: string }>(`/admin/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function listWarrantyAdminUsers(token: string) {
  return requestJson<AdminUser[]>('/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function createWarrantyAdminUser(token: string, payload: AdminUserCreatePayload) {
  return requestJson<AdminUser>('/admin/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export function resetWarrantyAdminUserPassword(token: string, adminUserId: string, password: string) {
  return requestJson<AdminUser>(`/admin/users/${adminUserId}/password`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })
}

function validIdentifier(value?: string) {
  if (!value || value === 'undefined' || value === 'null') return undefined
  return value
}
