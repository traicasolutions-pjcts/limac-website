'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, Eye, LogOut, RefreshCw, Search, Trash2, UserPlus, X } from 'lucide-react'
import {
  deleteWarrantyRegistration,
  downloadWarrantyRegistrationsCsv,
  getWarrantyBillAccess,
  listWarrantyRegistrations,
  updateWarrantyRegistrationStatus,
} from '@/services/warrantyApi'
import type { AdminRegistrationRow, RegistrationStatus } from '@/types/warranty'
import {
  clearAdminSession,
  getAdminAccessToken,
  isSuperAdmin,
  isAdminSessionExpired,
  touchAdminSession,
} from '@/components/warranty/adminSession'

const filters: Array<{ label: string; value?: RegistrationStatus }> = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'More Information', value: 'MORE_INFORMATION_REQUIRED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export default function AdminRegistrationsClient() {
  const [rows, setRows] = useState<AdminRegistrationRow[]>([])
  const [status, setStatus] = useState<RegistrationStatus | undefined>('PENDING')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [billPreview, setBillPreview] = useState<{
    filename: string
    contentType: string
    url: string
  } | null>(null)
  const [canManageUsers, setCanManageUsers] = useState(false)
  const [statusAction, setStatusAction] = useState<{
    row: AdminRegistrationRow
    nextStatus: RegistrationStatus
  } | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [deleteAction, setDeleteAction] = useState<AdminRegistrationRow | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const visibleRows = useMemo(() => rows, [rows])

  function logout() {
    clearAdminSession()
    window.location.href = '/admin/warranty/login'
  }

  async function load(nextStatus = status, nextSearch = search) {
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) {
      setAuthorized(false)
      logout()
      return
    }
    touchAdminSession()
    setLoading(true)
    setError(null)
    try {
      const result = await listWarrantyRegistrations(token, nextStatus, nextSearch)
      setRows(result.items)
      setCanManageUsers(isSuperAdmin())
      setAuthorized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load registrations.'
      setError(message)
      if (message.toLowerCase().includes('session') || message.toLowerCase().includes('login')) {
        setAuthorized(false)
        logout()
      } else {
        setAuthorized(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
    const markActive = () => touchAdminSession()
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }))
    const timer = window.setInterval(() => {
      if (isAdminSessionExpired()) logout()
    }, 10_000)
    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive))
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!authorized) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="rounded-lg bg-gray-900 p-5 text-sm text-limac-muted">Checking access...</p>
      </div>
    )
  }

  function selectFilter(nextStatus?: RegistrationStatus) {
    setStatus(nextStatus)
    load(nextStatus, search)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    load(status, search)
  }

  function changeStatus(row: AdminRegistrationRow, nextStatus: RegistrationStatus) {
    if (nextStatus === row.status) return
    setStatusReason('')
    setStatusAction({ row, nextStatus })
  }

  async function confirmStatusChange() {
    if (!statusAction) return
    const token = getAdminAccessToken()
    if (!token) return logout()
    const { row, nextStatus } = statusAction
    const identifier = rowIdentifier(row)
    if (!identifier) {
      setError('This registration row is missing both ID and reference number.')
      return
    }
    let reason: string | undefined
    if (nextStatus === 'REJECTED' || nextStatus === 'MORE_INFORMATION_REQUIRED') {
      reason = statusReason.trim()
      if (!reason) {
        setError('Reason is required for this status change.')
        return
      }
    }
    setUpdatingId(identifier)
    setError(null)
    try {
      await updateWarrantyRegistrationStatus(token, identifier, nextStatus, reason)
      setStatusAction(null)
      setStatusReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function viewBill(row: AdminRegistrationRow) {
    const token = getAdminAccessToken()
    if (!token) return logout()
    const identifier = rowIdentifier(row)
    if (!identifier) {
      setError('This registration row is missing both ID and reference number.')
      return
    }
    try {
      const bill = await getWarrantyBillAccess(token, identifier)
      setBillPreview({
        filename: bill.filename,
        contentType: bill.content_type,
        url: bill.url,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open bill.')
    }
  }

  function deleteRegistration(row: AdminRegistrationRow) {
    if (!canManageUsers) {
      setError('Only super admin users can delete registrations.')
      return
    }
    setDeleteConfirmation('')
    setDeleteAction(row)
  }

  async function confirmDeleteRegistration() {
    if (!deleteAction) return
    const token = getAdminAccessToken()
    if (!token) return logout()
    const identifier = rowIdentifier(deleteAction)
    if (!identifier) {
      setError('This registration row is missing both ID and reference number.')
      return
    }
    const reference = deleteAction.registration_number || identifier
    if (deleteConfirmation !== reference) {
      setError('Type the exact registration reference to confirm deletion.')
      return
    }

    setUpdatingId(identifier)
    setError(null)
    try {
      await deleteWarrantyRegistration(token, identifier)
      setDeleteAction(null)
      setDeleteConfirmation('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete registration.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function exportCsv() {
    if (!canManageUsers) {
      setError('Only super admin users can export registrations.')
      return
    }
    const token = getAdminAccessToken()
    if (!token) return logout()
    touchAdminSession()
    setError(null)
    try {
      const result = await downloadWarrantyRegistrationsCsv(token)
      const url = window.URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export registrations.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Warranty registrations</h1>
          <p className="mt-2 text-sm text-limac-muted">Pending customer requests awaiting review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageUsers ? (
            <>
              <Link
                href="/admin/warranty/users"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
              >
                <UserPlus size={16} />
                Users
              </Link>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
              >
                <Download size={16} />
                Export All CSV
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => selectFilter(filter.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              status === filter.value
                ? 'border-limac-green bg-limac-green text-limac-black'
                : 'border-gray-700 bg-gray-900 text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-semibold text-white">Search</span>
          <span className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-3">
            <Search size={16} className="text-limac-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer name or mobile number"
              className="w-full bg-transparent text-sm text-white outline-none"
            />
          </span>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              load(status, '')
            }}
            className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Clear
          </button>
        </div>
      </form>

      {error ? <p className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-800 text-xs uppercase text-limac-muted">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-limac-muted" colSpan={7}>Loading registrations...</td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-limac-muted" colSpan={7}>No registrations found.</td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const identifier = rowIdentifier(row)
                  return (
                  <tr key={identifier || row.registration_number} className="text-white">
                    <td className="px-4 py-3 font-semibold">
                      {identifier ? (
                        <Link href={`/admin/warranty/registrations/${encodeURIComponent(identifier)}`} className="text-limac-blue">
                          {row.registration_number}
                        </Link>
                      ) : (
                        <span>{row.registration_number || 'Missing reference'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.customer_name}</div>
                      <div className="text-xs text-limac-muted">{row.mobile_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.serial_number}</div>
                      <div className="text-xs text-limac-muted">{row.serial_validation_result || 'ADVISORY'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.invoice_number}</div>
                      <div className="text-xs text-limac-muted">{row.dealer_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        disabled={updatingId === identifier}
                        onChange={(event) => changeStatus(row, event.target.value as RegistrationStatus)}
                        className="rounded-lg border border-gray-700 bg-limac-black px-2 py-2 text-xs font-semibold text-white"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="MORE_INFORMATION_REQUIRED">MORE_INFORMATION_REQUIRED</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-limac-muted">
                      {row.submitted_at ? new Date(row.submitted_at).toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!row.has_bill}
                        onClick={() => viewBill(row)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Eye size={14} />
                        Bill
                      </button>
                      {canManageUsers ? (
                        <button
                          type="button"
                          disabled={updatingId === identifier}
                          onClick={() => deleteRegistration(row)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      ) : null}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {statusAction ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Confirm status change</h2>
            <p className="mt-3 text-sm text-limac-muted">
              Change {statusAction.row.registration_number} from{' '}
              <span className="font-semibold text-white">{statusAction.row.status}</span> to{' '}
              <span className="font-semibold text-white">{statusAction.nextStatus}</span>?
            </p>
            {statusAction.nextStatus === 'REJECTED' || statusAction.nextStatus === 'MORE_INFORMATION_REQUIRED' ? (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-white">Reason</span>
                <textarea
                  required
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
                />
              </label>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStatusAction(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                className="rounded-lg bg-limac-green px-4 py-2 text-sm font-semibold text-limac-black"
              >
                Update status
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteAction ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-red-500/40 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Delete registration</h2>
            <p className="mt-3 text-sm text-limac-muted">
              This removes the request from the live queue. A backup snapshot remains in MongoDB.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">
                Type {deleteAction.registration_number} to confirm
              </span>
              <input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-red-400"
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteAction(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmation !== deleteAction.registration_number}
                onClick={confirmDeleteRegistration}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {billPreview ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-4">
          <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <div>
                <h2 className="font-semibold text-white">Bill preview</h2>
                <p className="text-xs text-limac-muted">{billPreview.filename}</p>
              </div>
              <button
                type="button"
                onClick={() => setBillPreview(null)}
                className="rounded-lg p-2 text-limac-muted hover:bg-white/5 hover:text-white"
                aria-label="Close bill preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-auto bg-limac-black p-4">
              {billPreview.contentType === 'application/pdf' ? (
                <iframe
                  src={billPreview.url}
                  title={billPreview.filename}
                  className="h-[70vh] w-full rounded-lg border border-gray-800 bg-white"
                />
              ) : (
                <img
                  src={billPreview.url}
                  alt={billPreview.filename}
                  className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function rowIdentifier(row: AdminRegistrationRow) {
  if (row.id && row.id !== 'undefined' && row.id !== 'null') return row.id
  if (row._id && row._id !== 'undefined' && row._id !== 'null') return row._id
  if (
    row.registration_number &&
    row.registration_number !== 'undefined' &&
    row.registration_number !== 'null'
  ) {
    return row.registration_number
  }
  return undefined
}
