export const MAX_BILL_BYTES = 2 * 1024 * 1024

export const ALLOWED_BILL_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

export function validateBillFile(file: File | null): string | null {
  if (!file) return 'Upload one invoice or bill.'
  if (!ALLOWED_BILL_TYPES.includes(file.type)) return 'Upload a JPG, PNG or PDF bill.'
  if (file.size > MAX_BILL_BYTES) return 'Maximum file size allowed is 2 MB.'
  if (file.size === 0) return 'Uploaded bill file is empty.'
  return null
}

export function maskMobile(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 4) return value
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`
}

export function maskSerial(value: string) {
  const normalized = value.trim().toUpperCase()
  if (normalized.length <= 4) return normalized
  return `${normalized.slice(0, 2)}${'*'.repeat(Math.max(2, normalized.length - 6))}${normalized.slice(-4)}`
}
