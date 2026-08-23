'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, KeyRound, Loader2, LogOut, UserPlus } from 'lucide-react'
import {
  createWarrantyAdminUser,
  listWarrantyAdminUsers,
  resetWarrantyAdminUserPassword,
} from '@/services/warrantyApi'
import type { AdminRole, AdminUser } from '@/types/warranty'
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionExpired,
  isSuperAdmin,
  touchAdminSession,
} from '@/components/warranty/adminSession'

const emptyForm = {
  email: '',
  password: '',
  role: 'APPROVER' as Extract<AdminRole, 'APPROVER' | 'SUPER_ADMIN'>,
}

export default function AdminUsersClient() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')

  function logout() {
    clearAdminSession()
    window.location.href = '/admin/warranty/login'
  }

  async function load() {
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) return logout()
    if (!isSuperAdmin()) {
      setAuthorized(false)
      router.replace('/admin/warranty/registrations')
      setLoading(false)
      return
    }
    setAuthorized(true)
    touchAdminSession()
    setLoading(true)
    setError(null)
    try {
      setUsers(await listWarrantyAdminUsers(token))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(() => {
      if (isAdminSessionExpired()) logout()
    }, 10_000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!authorized) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="rounded-lg bg-gray-900 p-5 text-sm text-limac-muted">Checking access...</p>
      </div>
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const token = getAdminAccessToken()
    if (!token) return logout()
    if (!isSuperAdmin()) {
      setError('Only super admin users can create admin users.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await createWarrantyAdminUser(token, form)
      setForm(emptyForm)
      setMessage('Admin user created.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create admin user.')
    } finally {
      setSaving(false)
    }
  }

  function openResetPassword(user: AdminUser) {
    setResetUser(user)
    setResetPasswordValue('')
    setResetPasswordConfirm('')
    setError(null)
    setMessage(null)
  }

  async function resetPassword() {
    if (!resetUser) return
    const token = getAdminAccessToken()
    if (!token) return logout()
    if (!isSuperAdmin()) {
      setError('Only super admin users can reset passwords.')
      return
    }
    if (resetPasswordValue.length < 8) {
      setError('Temporary password must have at least 8 characters.')
      return
    }
    if (resetPasswordValue !== resetPasswordConfirm) {
      setError('Password confirmation does not match.')
      return
    }

    setResettingId(resetUser.id)
    setError(null)
    setMessage(null)
    try {
      await resetWarrantyAdminUserPassword(token, resetUser.id, resetPasswordValue)
      setMessage(`Password reset for ${resetUser.email}.`)
      setResetUser(null)
      setResetPasswordValue('')
      setResetPasswordConfirm('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.')
    } finally {
      setResettingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/warranty/registrations"
            className="inline-flex items-center gap-2 rounded-lg border border-limac-blue/40 bg-limac-blue/10 px-3 py-2 text-sm font-semibold text-limac-blue hover:border-limac-blue hover:bg-limac-blue/15"
          >
            <Home size={16} />
            Admin home
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-white">Admin users</h1>
          <p className="mt-2 text-sm text-limac-muted">Create super admin or manager accounts for warranty review.</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {error ? <p className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-5 rounded-lg bg-limac-green/10 p-3 text-sm text-limac-green">{message}</p> : null}

      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-lg border border-gray-800 bg-gray-900 p-5 md:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-sm font-semibold text-white">Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold text-white">Temporary password</span>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold text-white">Role</span>
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as Extract<AdminRole, 'APPROVER' | 'SUPER_ADMIN'>,
              }))
            }
            className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
          >
            <option value="APPROVER">Manager - status updates only</option>
            <option value="SUPER_ADMIN">Super admin - full access</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Create user
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-800 text-xs uppercase text-limac-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-white">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-limac-muted" colSpan={5}>Loading users...</td>
              </tr>
            ) : users.length ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-semibold">{user.email}</td>
                  <td className="px-4 py-3">{user.role === 'APPROVER' ? 'Manager' : 'Super admin'}</td>
                  <td className="px-4 py-3 text-limac-muted">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-limac-muted">{formatDate(user.last_login_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={resettingId === user.id}
                      onClick={() => openResetPassword(user)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resettingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                      Reset password
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-limac-muted" colSpan={5}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {resetUser ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Reset password</h2>
            <p className="mt-3 text-sm text-limac-muted">
              Set a new temporary password for <span className="font-semibold text-white">{resetUser.email}</span>.
              Existing sessions for this user will be cleared.
            </p>
            <div className="mt-4 grid gap-4">
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-white">New temporary password</span>
                <input
                  type="password"
                  minLength={8}
                  value={resetPasswordValue}
                  onChange={(event) => setResetPasswordValue(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-white">Confirm password</span>
                <input
                  type="password"
                  minLength={8}
                  value={resetPasswordConfirm}
                  onChange={(event) => setResetPasswordConfirm(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  resettingId === resetUser.id ||
                  resetPasswordValue.length < 8 ||
                  resetPasswordValue !== resetPasswordConfirm
                }
                onClick={resetPassword}
                className="rounded-lg bg-limac-green px-4 py-2 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset password
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-IN') : '-'
}
