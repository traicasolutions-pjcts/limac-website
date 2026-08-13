'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, LogOut, RefreshCw, Search, X } from 'lucide-react'
import {
  getWarrantyBillAccess,
  listWarrantyRegistrations,
  updateWarrantyRegistrationStatus,
} from '@/services/warrantyApi'
import type { AdminRegistrationRow, RegistrationStatus } from '@/types/warranty'
import {
  clearAdminSession,
  getAdminAccessToken,
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
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [billPreview, setBillPreview] = useState<{
    filename: string
    contentType: string
    url: string
  } | null>(null)

  const visibleRows = useMemo(() => rows, [rows])

  function logout() {
    clearAdminSession()
    window.location.href = '/admin/warranty/login'
  }

  async function load(nextStatus = status, nextSearch = search) {
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) {
      logout()
      return
    }
    touchAdminSession()
    setLoading(true)
    setError(null)
    try {
      const result = await listWarrantyRegistrations(token, nextStatus, nextSearch)
      setRows(result.items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load registrations.'
      setError(message)
      if (message.toLowerCase().includes('session') || message.toLowerCase().includes('login')) {
        logout()
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

  function selectFilter(nextStatus?: RegistrationStatus) {
    setStatus(nextStatus)
    load(nextStatus, search)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    load(status, search)
  }

  async function changeStatus(row: AdminRegistrationRow, nextStatus: RegistrationStatus) {
    const token = getAdminAccessToken()
    if (!token) return logout()
    const identifier = rowIdentifier(row)
    if (!identifier) {
      setError('This registration row is missing both ID and reference number.')
      return
    }
    let reason: string | undefined
    if (nextStatus === 'REJECTED' || nextStatus === 'MORE_INFORMATION_REQUIRED') {
      reason = window.prompt('Enter reason or message for this status change:') || undefined
      if (!reason) return
    }
    setUpdatingId(identifier)
    setError(null)
    try {
      await updateWarrantyRegistrationStatus(token, identifier, nextStatus, reason)
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Warranty registrations</h1>
          <p className="mt-2 text-sm text-limac-muted">Pending customer requests awaiting review.</p>
        </div>
        <div className="flex gap-2">
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
                      <button
                        type="button"
                        disabled={!row.has_bill}
                        onClick={() => viewBill(row)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Eye size={14} />
                        Bill
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

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
