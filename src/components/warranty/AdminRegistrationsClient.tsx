'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, Eye, Home, Loader2, LogOut, PackagePlus, RefreshCw, Search, ShieldCheck, Trash2, UserPlus, Wrench, X } from 'lucide-react'
import {
  deleteWarrantyRegistration,
  downloadWarrantyBillFile,
  downloadWarrantyRegistrationsCsv,
  getWarrantyRegistrationSummary,
  listWarrantyRegistrations,
  queryWarrantyChangeLog,
  updateWarrantyRegistrationStatus,
} from '@/services/warrantyApi'
import type {
  AdminRegistrationChangeLogRow,
  AdminRegistrationRow,
  AdminWarrantyFilter,
  AdminWarrantySummary,
  RegistrationStatus,
} from '@/types/warranty'
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

const headerButtonClass =
  'inline-flex items-center gap-2 rounded-lg border border-limac-blue/40 bg-limac-blue/10 px-3 py-2 text-sm font-semibold text-limac-blue hover:border-limac-blue hover:bg-limac-blue/15 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-100 dark:hover:border-sky-300/60 dark:hover:bg-sky-400/15'

const CHANGE_LOG_PAGE_SIZE = 5

const warrantyTiles: Array<{
  label: string
  filter: AdminWarrantyFilter
  valueKey: keyof AdminWarrantySummary
  tone: 'danger' | 'ok'
  Icon: typeof ShieldCheck
}> = [
  {
    label: 'Replacement expired',
    filter: 'replacement_expired',
    valueKey: 'replacement_expired',
    tone: 'danger',
    Icon: ShieldCheck,
  },
  {
    label: 'Service expired',
    filter: 'service_expired',
    valueKey: 'service_expired',
    tone: 'danger',
    Icon: Wrench,
  },
  {
    label: 'Replacement under warranty',
    filter: 'replacement_under_warranty',
    valueKey: 'replacement_under_warranty',
    tone: 'ok',
    Icon: ShieldCheck,
  },
  {
    label: 'Service under warranty',
    filter: 'service_under_warranty',
    valueKey: 'service_under_warranty',
    tone: 'ok',
    Icon: Wrench,
  },
]

export default function AdminRegistrationsClient() {
  const [rows, setRows] = useState<AdminRegistrationRow[]>([])
  const [status, setStatus] = useState<RegistrationStatus | undefined>('PENDING')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [openingBillId, setOpeningBillId] = useState<string | null>(null)
  const [billPreview, setBillPreview] = useState<{
    filename: string
    contentType: string
    url: string
    objectUrl?: string
  } | null>(null)
  const [canManageUsers, setCanManageUsers] = useState(false)
  const [statusAction, setStatusAction] = useState<{
    row: AdminRegistrationRow
    nextStatus: RegistrationStatus
  } | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [replacementWarrantyExpiryDate, setReplacementWarrantyExpiryDate] = useState('')
  const [serviceWarrantyExpiryDate, setServiceWarrantyExpiryDate] = useState('')
  const [deleteAction, setDeleteAction] = useState<AdminRegistrationRow | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [changeLogRows, setChangeLogRows] = useState<AdminRegistrationChangeLogRow[]>([])
  const [changeLogLoading, setChangeLogLoading] = useState(false)
  const [changeLogOpen, setChangeLogOpen] = useState(false)
  const [changeLogSkip, setChangeLogSkip] = useState(0)
  const [warrantySummary, setWarrantySummary] = useState<AdminWarrantySummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [selectedWarrantyFilter, setSelectedWarrantyFilter] = useState<AdminWarrantyFilter | undefined>()

  const visibleRows = useMemo(() => rows, [rows])

  function logout() {
    clearAdminSession()
    window.location.href = '/admin/warranty/login'
  }

  async function load(
    nextStatus = status,
    nextSearch = search,
    nextWarrantyFilter = selectedWarrantyFilter
  ) {
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
      const result = await listWarrantyRegistrations(token, nextStatus, nextSearch, nextWarrantyFilter)
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

  async function loadSummary() {
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) return
    setSummaryLoading(true)
    try {
      setWarrantySummary(await getWarrantyRegistrationSummary(token))
    } catch {
      setWarrantySummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadSummary()
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
    setChangeLogOpen(false)
    setChangeLogRows([])
    setSelectedWarrantyFilter(undefined)
    setStatus(nextStatus)
    load(nextStatus, search, undefined)
  }

  function selectWarrantyTile(nextFilter: AdminWarrantyFilter) {
    setChangeLogOpen(false)
    setChangeLogRows([])
    setSelectedWarrantyFilter(nextFilter)
    setStatus(undefined)
    load(undefined, search, nextFilter)
  }

  function goAdminHome() {
    setSearch('')
    setChangeLogOpen(false)
    setChangeLogRows([])
    setChangeLogSkip(0)
    setSelectedWarrantyFilter(undefined)
    setStatus('PENDING')
    load('PENDING', '', undefined)
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    setChangeLogOpen(false)
    setChangeLogRows([])
    load(status, search, selectedWarrantyFilter)
  }

  function changeStatus(row: AdminRegistrationRow, nextStatus: RegistrationStatus) {
    if (nextStatus === row.status) return
    setStatusReason('')
    setReplacementWarrantyExpiryDate('')
    setServiceWarrantyExpiryDate('')
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
    if (nextStatus === 'APPROVED' && (!replacementWarrantyExpiryDate || !serviceWarrantyExpiryDate)) {
      setError('Replacement and service warranty expiry dates are required for approval.')
      return
    }
    if (
      nextStatus === 'APPROVED' &&
      (replacementWarrantyExpiryDate < row.purchase_date || serviceWarrantyExpiryDate < row.purchase_date)
    ) {
      setError('Warranty expiry dates cannot be earlier than purchase date.')
      return
    }
    setUpdatingId(identifier)
    setError(null)
    try {
      await updateWarrantyRegistrationStatus(
        token,
        identifier,
        nextStatus,
        reason,
        replacementWarrantyExpiryDate,
        serviceWarrantyExpiryDate
      )
      setStatusAction(null)
      setStatusReason('')
      setReplacementWarrantyExpiryDate('')
      setServiceWarrantyExpiryDate('')
      await load()
      await loadSummary()
    } catch (err) {
      setStatusAction(null)
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
    setOpeningBillId(identifier)
    setError(null)
    try {
      const bill = await downloadWarrantyBillFile(token, identifier)
      const objectUrl = window.URL.createObjectURL(bill.blob)
      closeBillPreview()
      setBillPreview({
        filename: bill.filename,
        contentType: bill.contentType,
        url: objectUrl,
        objectUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open bill.')
    } finally {
      setOpeningBillId(null)
    }
  }

  function closeBillPreview() {
    setBillPreview((current) => {
      if (current?.objectUrl) window.URL.revokeObjectURL(current.objectUrl)
      return null
    })
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

  async function searchChangeLog(nextSkip = 0) {
    const token = getAdminAccessToken()
    if (!token) return logout()
    setChangeLogLoading(true)
    setError(null)
    try {
      const result = await queryWarrantyChangeLog(token, search, nextSkip, CHANGE_LOG_PAGE_SIZE)
      setChangeLogRows(result.items)
      setChangeLogSkip(result.skip)
      setChangeLogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load change log.')
    } finally {
      setChangeLogLoading(false)
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
          <button
            type="button"
            onClick={goAdminHome}
            className={headerButtonClass}
          >
            <Home size={16} />
            Admin home
          </button>
          {canManageUsers ? (
            <>
              <Link
                href="/admin/warranty/users"
                className={headerButtonClass}
              >
                <UserPlus size={16} />
                Users
              </Link>
              <button
                type="button"
                onClick={exportCsv}
                className={headerButtonClass}
              >
                <Download size={16} />
                Export All CSV
              </button>
            </>
          ) : null}
          <Link
            href="/admin/warranty/products"
            className={headerButtonClass}
          >
            <PackagePlus size={16} />
            Products
          </Link>
          <button
            type="button"
            onClick={() => {
              load()
              loadSummary()
            }}
            className={headerButtonClass}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-400/50 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-slate-500 hover:bg-slate-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:hover:border-gray-500"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {warrantyTiles.map(({ label, filter, valueKey, tone, Icon }) => {
          const active = selectedWarrantyFilter === filter
          const value = warrantySummary?.[valueKey]
          return (
            <button
              key={filter}
              type="button"
              onClick={() => selectWarrantyTile(filter)}
              className={`rounded-lg border p-4 text-left transition ${
                active
                  ? 'border-limac-green bg-limac-green/15'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <Icon
                  size={20}
                  className={tone === 'danger' ? 'text-red-400' : 'text-limac-green'}
                />
                <span className="text-2xl font-bold text-white">
                  {summaryLoading && value === undefined ? '-' : value ?? 0}
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-white">{label}</div>
            </button>
          )
        })}
      </div>

      {!changeLogOpen ? (
        <div className="mt-6 flex flex-wrap gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => selectFilter(filter.value)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                !selectedWarrantyFilter && status === filter.value
                  ? 'bg-limac-green text-limac-black'
                  : 'text-limac-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

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
              setSelectedWarrantyFilter(undefined)
              load(status, '', undefined)
              setChangeLogRows([])
              setChangeLogOpen(false)
              setChangeLogSkip(0)
            }}
            className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => searchChangeLog(0)}
            className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-white"
          >
            {changeLogLoading ? 'Loading...' : 'Change log'}
          </button>
        </div>
      </form>

      {error ? <p className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p> : null}

      {changeLogOpen ? (
        <div className="mt-5 rounded-lg border border-gray-800 bg-gray-900 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-white">Change log</h2>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={changeLogLoading || changeLogSkip === 0}
                onClick={() => searchChangeLog(Math.max(changeLogSkip - CHANGE_LOG_PAGE_SIZE, 0))}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={changeLogLoading || changeLogRows.length < CHANGE_LOG_PAGE_SIZE}
                onClick={() => searchChangeLog(changeLogSkip + CHANGE_LOG_PAGE_SIZE)}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangeLogOpen(false)
                  setChangeLogRows([])
                  setChangeLogSkip(0)
                }}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-limac-muted">
            Showing {changeLogRows.length ? changeLogSkip + 1 : 0}-
            {changeLogSkip + changeLogRows.length}
          </p>
          {changeLogRows.length ? (
            <div className="mt-4 space-y-4">
              {changeLogRows.map((row) => (
                <div key={row.registration_number} className="rounded-md border border-gray-800 p-3 text-sm">
                  <div className="font-semibold text-white">{row.registration_number}</div>
                  <div className="mt-1 text-xs text-limac-muted">
                    {row.customer_name || '-'} | {row.mobile_number || '-'} | {row.serial_numbers.join(', ')}
                  </div>
                  <div className="mt-3 space-y-2">
                    {row.decision_history?.length ? (
                      row.decision_history.map((event, index) => (
                        <div key={`${row.registration_number}-${event.created_at}-${index}`} className="text-limac-muted">
                          <span className="font-semibold text-white">{event.event_type || event.status}</span>
                          {event.created_at ? ` on ${new Date(event.created_at).toLocaleString('en-IN')}` : ''}
                          {event.admin_id ? ` by ${event.admin_id}` : ''}
                          {event.reason ? ` - ${event.reason}` : ''}
                          {event.replacement_warranty_expiry_date ? ` | Replacement: ${event.replacement_warranty_expiry_date}` : ''}
                          {event.service_warranty_expiry_date ? ` | Service: ${event.service_warranty_expiry_date}` : ''}
                        </div>
                      ))
                    ) : (
                      <div className="text-limac-muted">No changes recorded.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-limac-muted">No change log entries found.</p>
          )}
        </div>
      ) : null}

      {!changeLogOpen ? <div className="mt-6 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-800 text-xs uppercase text-limac-muted">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">
                  <span title="Date format: YYYY-MM-DD">Replacement warranty</span>
                </th>
                <th className="px-4 py-3">
                  <span title="Date format: YYYY-MM-DD">Service warranty</span>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-limac-muted" colSpan={8}>Loading registrations...</td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-limac-muted" colSpan={8}>No registrations found.</td>
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
                      {row.status === 'APPROVED' ? (
                        <WarrantyDateCell value={row.replacement_warranty_expiry_date} />
                      ) : (
                        <span aria-label="No warranty expiry date" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === 'APPROVED' ? (
                        <WarrantyDateCell value={row.service_warranty_expiry_date} />
                      ) : (
                        <span aria-label="No service warranty expiry date" />
                      )}
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
                        disabled={!row.has_bill || openingBillId === identifier}
                        onClick={() => viewBill(row)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {openingBillId === identifier ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Eye size={14} />
                        )}
                        {openingBillId === identifier ? 'Opening...' : 'Bill'}
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
      </div> : null}

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
            {statusAction.nextStatus === 'APPROVED' ? (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-white">
                  Replacement warranty expiry date
                </span>
                <input
                  required
                  type="date"
                  min={statusAction.row.purchase_date}
                  value={replacementWarrantyExpiryDate}
                  onChange={(event) => setReplacementWarrantyExpiryDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
                />
                <span className="mb-1.5 mt-4 block text-sm font-semibold text-white">
                  Service warranty expiry date
                </span>
                <input
                  required
                  type="date"
                  min={statusAction.row.purchase_date}
                  value={serviceWarrantyExpiryDate}
                  onChange={(event) => setServiceWarrantyExpiryDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
                />
                <span className="mt-1.5 block text-xs text-limac-muted">
                  Purchase date: {statusAction.row.purchase_date}
                </span>
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
                onClick={closeBillPreview}
                className="rounded-lg p-2 text-limac-muted hover:bg-white/5 hover:text-white"
                aria-label="Close bill preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-auto bg-limac-black p-4">
              {isPdfBill(billPreview) ? (
                <div className="space-y-3">
                  <iframe
                    src={billPreview.url}
                    title={billPreview.filename}
                    className="h-[70vh] w-full rounded-lg border border-gray-800 bg-white"
                  />
                  <a
                    href={billPreview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Open PDF in new tab
                  </a>
                </div>
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

function isPdfBill(bill: { filename: string; contentType: string }) {
  return bill.contentType.toLowerCase().includes('pdf') || bill.filename.toLowerCase().endsWith('.pdf')
}

function WarrantyDateCell({ value }: { value?: string }) {
  if (!value) {
    return <span className="text-limac-muted">-</span>
  }
  const today = new Date().toISOString().slice(0, 10)
  const expired = value < today
  return (
    <div>
      <div className={expired ? 'font-semibold text-red-500' : 'font-semibold text-limac-green'}>{value}</div>
      {expired ? <div className="text-xs text-red-400">Expired</div> : null}
    </div>
  )
}
