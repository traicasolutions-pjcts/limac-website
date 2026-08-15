const TOKEN_KEY = 'limacWarrantyAccessToken'
const ROLE_KEY = 'limacWarrantyAdminRole'
const LOGIN_AT_KEY = 'limacWarrantyLoginAt'
const LAST_ACTIVE_AT_KEY = 'limacWarrantyLastActiveAt'

export const ADMIN_SESSION_TIMEOUT_MS = 5 * 60 * 1000

export function saveAdminSession(accessToken: string, role: string) {
  if (typeof window === 'undefined') return
  const now = Date.now().toString()
  window.sessionStorage.setItem(TOKEN_KEY, accessToken)
  window.sessionStorage.setItem(ROLE_KEY, role)
  window.sessionStorage.setItem(LOGIN_AT_KEY, now)
  window.sessionStorage.setItem(LAST_ACTIVE_AT_KEY, now)
}

export function getAdminAccessToken() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(TOKEN_KEY)
}

export function getAdminRole() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(ROLE_KEY)
}

export function isSuperAdmin() {
  return getAdminRole() === 'SUPER_ADMIN'
}

export function touchAdminSession() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(LAST_ACTIVE_AT_KEY, Date.now().toString())
}

export function isAdminSessionExpired() {
  if (typeof window === 'undefined') return true
  const lastActiveAt = Number(window.sessionStorage.getItem(LAST_ACTIVE_AT_KEY) || 0)
  return !lastActiveAt || Date.now() - lastActiveAt > ADMIN_SESSION_TIMEOUT_MS
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(ROLE_KEY)
  window.sessionStorage.removeItem(LOGIN_AT_KEY)
  window.sessionStorage.removeItem(LAST_ACTIVE_AT_KEY)
}
