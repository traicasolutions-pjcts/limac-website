'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Home, Loader2, LogOut, RefreshCw, Trash2, X } from 'lucide-react'
import {
  deleteWarrantyRegistration,
  downloadWarrantyBillFile,
  getWarrantyRegistration,
  updateWarrantyDates,
  updateWarrantyRegistrationStatus,
} from '@/services/warrantyApi'
import type { AdminRegistrationDetail, RegistrationStatus } from '@/types/warranty'
import {
  clearAdminSession,
  getAdminAccessToken,
  isSuperAdmin,
  isAdminSessionExpired,
  touchAdminSession,
} from '@/components/warranty/adminSession'

const statusOptions: RegistrationStatus[] = [
  'PENDING',
  'UNDER_REVIEW',
  'MORE_INFORMATION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]

export default function AdminRegistrationDetailClient({ id }: { id: string }) {
  const [detail, setDetail] = useState<AdminRegistrationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [billPreview, setBillPreview] = useState<{
    filename: string
    contentType: string
    url: string
    objectUrl?: string
  } | null>(null)
  const [openingBill, setOpeningBill] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [statusAction, setStatusAction] = useState<RegistrationStatus | null>(null)
  const [statusReason, setStatusReason] = useState('')
  const [replacementWarrantyExpiryDate, setReplacementWarrantyExpiryDate] = useState('')
  const [serviceWarrantyExpiryDate, setServiceWarrantyExpiryDate] = useState('')
  const [warrantyDateReason, setWarrantyDateReason] = useState('')
  const [showWarrantyDatesModal, setShowWarrantyDatesModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function logout() {
    clearAdminSession()
    window.location.href = '/admin/warranty/login'
  }

  async function load() {
    if (!id || id === 'undefined' || id === 'null') {
      setError('This registration link is missing a valid ID or reference. Go back and refresh the list.')
      setLoading(false)
      return
    }
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) return logout()
    touchAdminSession()
    setLoading(true)
    setError(null)
    try {
      setDetail(await getWarrantyRegistration(token, id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load registration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCanDelete(isSuperAdmin())
    load()
    const timer = window.setInterval(() => {
      if (isAdminSessionExpired()) logout()
    }, 10_000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function changeStatus(nextStatus: RegistrationStatus) {
    if (!detail || nextStatus === detail.status) return
    setStatusReason('')
    setReplacementWarrantyExpiryDate('')
    setServiceWarrantyExpiryDate('')
    setStatusAction(nextStatus)
  }

  function openWarrantyDateEdit() {
    if (!detail) return
    setReplacementWarrantyExpiryDate(detail.purchase.replacement_warranty_expiry_date || '')
    setServiceWarrantyExpiryDate(detail.purchase.service_warranty_expiry_date || '')
    setWarrantyDateReason('')
    setShowWarrantyDatesModal(true)
  }

  async function confirmStatusChange() {
    const token = getAdminAccessToken()
    if (!token) return logout()
    if (!detail || !statusAction) return
    let reason: string | undefined
    if (statusAction === 'REJECTED' || statusAction === 'MORE_INFORMATION_REQUIRED') {
      reason = statusReason.trim()
      if (!reason) {
        setError('Reason is required for this status change.')
        return
      }
    }
    if (statusAction === 'APPROVED' && (!replacementWarrantyExpiryDate || !serviceWarrantyExpiryDate)) {
      setError('Replacement and service warranty expiry dates are required for approval.')
      return
    }
    if (
      statusAction === 'APPROVED' &&
      (
        replacementWarrantyExpiryDate < detail.purchase.purchase_date ||
        serviceWarrantyExpiryDate < detail.purchase.purchase_date
      )
    ) {
      setError('Warranty expiry dates cannot be earlier than purchase date.')
      return
    }
    setUpdating(true)
    try {
      await updateWarrantyRegistrationStatus(
        token,
        id,
        statusAction,
        reason,
        replacementWarrantyExpiryDate,
        serviceWarrantyExpiryDate
      )
      setStatusAction(null)
      setStatusReason('')
      setReplacementWarrantyExpiryDate('')
      setServiceWarrantyExpiryDate('')
      await load()
    } catch (err) {
      setStatusAction(null)
      setError(err instanceof Error ? err.message : 'Unable to update status.')
    } finally {
      setUpdating(false)
    }
  }

  async function viewBill() {
    const token = getAdminAccessToken()
    if (!token) return logout()
    setOpeningBill(true)
    setError(null)
    try {
      const bill = await downloadWarrantyBillFile(token, id)
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
      setOpeningBill(false)
    }
  }

  async function saveWarrantyDates() {
    const token = getAdminAccessToken()
    if (!token) return logout()
    if (!detail) return
    if (!replacementWarrantyExpiryDate || !serviceWarrantyExpiryDate) {
      setError('Replacement and service warranty expiry dates are required.')
      return
    }
    if (
      replacementWarrantyExpiryDate < detail.purchase.purchase_date ||
      serviceWarrantyExpiryDate < detail.purchase.purchase_date
    ) {
      setError('Warranty expiry dates cannot be earlier than purchase date.')
      return
    }
    setUpdating(true)
    setError(null)
    try {
      await updateWarrantyDates(
        token,
        id,
        replacementWarrantyExpiryDate,
        serviceWarrantyExpiryDate,
        warrantyDateReason.trim() || undefined
      )
      setShowWarrantyDatesModal(false)
      setWarrantyDateReason('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update warranty dates.')
    } finally {
      setUpdating(false)
    }
  }

  function closeBillPreview() {
    setBillPreview((current) => {
      if (current?.objectUrl) window.URL.revokeObjectURL(current.objectUrl)
      return null
    })
  }

  async function deleteRegistration() {
    if (!detail) return
    const token = getAdminAccessToken()
    if (!token) return logout()
    const reference = detail.registration_number
    if (deleteConfirmation !== reference) {
      setError('Type the exact registration reference to confirm deletion.')
      return
    }

    setUpdating(true)
    setError(null)
    try {
      await deleteWarrantyRegistration(token, id)
      window.location.href = '/admin/warranty/registrations'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete registration.')
      setUpdating(false)
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-5xl text-limac-muted">Loading registration...</p>
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error || 'Registration not found.'}</p>
      </div>
    )
  }

  const serialNote = serialComparisonNote(detail.serial_validation?.result)
  const componentSerials = detail.product.components?.length
    ? detail.product.components.map((component) => component.serial_number)
    : [detail.product.serial_number]
  const componentValidation = detail.serial_validation?.components?.length
    ? detail.serial_validation.components
        .map((component) => `${component.serial_number}: ${component.result || '-'}`)
        .join(', ')
    : detail.serial_validation?.result || '-'

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/warranty/registrations"
            className="inline-flex items-center gap-2 rounded-lg border border-limac-blue/40 bg-limac-blue/10 px-3 py-2 text-sm font-semibold text-limac-blue hover:border-limac-blue hover:bg-limac-blue/15"
          >
            <Home size={16} />
            Admin home
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase text-limac-green">Registration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{detail.registration_number}</h1>
          <p className="mt-2 text-sm text-limac-muted">
            Submitted {detail.submitted_at ? new Date(detail.submitted_at).toLocaleString('en-IN') : '-'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
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
          {canDelete ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => {
                setDeleteConfirmation('')
                setShowDeleteModal(true)
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-gray-900 px-3 py-2 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase text-limac-muted">Current status</p>
          <p className="mt-1 text-lg font-bold text-white">{detail.status}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              disabled={updating || option === detail.status}
              onClick={() => changeStatus(option)}
              className={`min-h-10 rounded-md px-3 py-2 text-xs font-semibold ${
                option === detail.status
                  ? 'bg-limac-green text-limac-black'
                  : 'border border-gray-700 text-white hover:border-limac-green'
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {statusLabel(option)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <InfoCard title="Customer" items={[
          ['Name', detail.customer.name],
          ['Mobile', detail.customer.mobile_number],
          ['Address', detail.customer.address_line],
          ['City', detail.customer.city],
          ['State', detail.customer.state],
          ['PIN', detail.customer.pin_code],
        ]} />
        <InfoCard
          title="Product"
          items={[
            ['Serials', componentSerials.join(', ')],
            ['Normalized serial', detail.product.serial_normalized],
            ['Customer model', detail.product.product_model_customer || '-'],
            ['Validation', componentValidation],
          ]}
          noteLabel="Product master note"
          note={`${serialNote} Matching ignores uppercase/lowercase differences and spaces.`}
        />
        <InfoCard title="Purchase" items={[
          ['Purchase date', detail.purchase.purchase_date],
          ['Replacement warranty', detail.purchase.replacement_warranty_expiry_date || '-'],
          ['Service warranty', detail.purchase.service_warranty_expiry_date || '-'],
          ['Invoice', detail.purchase.invoice_number],
          ['Dealer / Care of', detail.purchase.dealer_name],
          ['Dealer code', detail.purchase.dealer_code || '-'],
        ]} />
      </div>

      {detail.status === 'APPROVED' ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={openWarrantyDateEdit}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Update warranty dates
          </button>
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">Bill</h2>
            <p className="mt-1 text-sm text-limac-muted">
              {detail.bill_asset?.filename || 'No bill attached'}
            </p>
          </div>
          <button
            type="button"
            disabled={!detail.bill_asset || openingBill}
            onClick={viewBill}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {openingBill ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
            {openingBill ? 'Opening bill...' : 'View bill'}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="font-semibold text-white">Decision history</h2>
        {detail.decision_history?.length ? (
          <div className="mt-4 space-y-3">
            {detail.decision_history.map((event, index) => (
              <div key={`${event.created_at}-${index}`} className="text-sm text-limac-muted">
                <span className="font-semibold text-white">{event.status}</span>
                {event.reason ? ` - ${event.reason}` : ''}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-limac-muted">No admin decision yet.</p>
        )}
      </div>

      {statusAction ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Confirm status change</h2>
            <p className="mt-3 text-sm text-limac-muted">
              Change {detail.registration_number} from{' '}
              <span className="font-semibold text-white">{detail.status}</span> to{' '}
              <span className="font-semibold text-white">{statusAction}</span>?
            </p>
            {statusAction === 'REJECTED' || statusAction === 'MORE_INFORMATION_REQUIRED' ? (
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
            {statusAction === 'APPROVED' ? (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-white">Replacement warranty expiry date</span>
                <input
                  required
                  type="date"
                  min={detail.purchase.purchase_date}
                  value={replacementWarrantyExpiryDate}
                  onChange={(event) => setReplacementWarrantyExpiryDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
                />
                <span className="mb-1.5 mt-4 block text-sm font-semibold text-white">Service warranty expiry date</span>
                <input
                  required
                  type="date"
                  min={detail.purchase.purchase_date}
                  value={serviceWarrantyExpiryDate}
                  onChange={(event) => setServiceWarrantyExpiryDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
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
                disabled={updating}
                onClick={confirmStatusChange}
                className="rounded-lg bg-limac-green px-4 py-2 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Update status
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showWarrantyDatesModal ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Update warranty dates</h2>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">Replacement warranty expiry date</span>
              <input
                required
                type="date"
                min={detail.purchase.purchase_date}
                value={replacementWarrantyExpiryDate}
                onChange={(event) => setReplacementWarrantyExpiryDate(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">Service warranty expiry date</span>
              <input
                required
                type="date"
                min={detail.purchase.purchase_date}
                value={serviceWarrantyExpiryDate}
                onChange={(event) => setServiceWarrantyExpiryDate(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">Reason</span>
              <textarea
                value={warrantyDateReason}
                onChange={(event) => setWarrantyDateReason(event.target.value)}
                className="min-h-20 w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowWarrantyDatesModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={saveWarrantyDates}
                className="rounded-lg bg-limac-green px-4 py-2 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save dates
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-red-500/40 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Delete registration</h2>
            <p className="mt-3 text-sm text-limac-muted">
              This removes the request from the live queue. A backup snapshot remains in MongoDB.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">
                Type {detail.registration_number} to confirm
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
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating || deleteConfirmation !== detail.registration_number}
                onClick={deleteRegistration}
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

function InfoCard({
  title,
  items,
  noteLabel,
  note,
}: {
  title: string
  items: Array<[string, string]>
  noteLabel?: string
  note?: string
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
      <h2 className="font-semibold text-white">{title}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase text-limac-muted">{label}</dt>
            <dd className="mt-1 break-words font-semibold text-white">{value}</dd>
          </div>
        ))}
      </dl>
      {note ? (
        <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm">
          <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">{noteLabel || 'Info'}</p>
          <p className="mt-1 font-semibold text-sky-950 dark:text-sky-100">{note}</p>
        </div>
      ) : null}
    </div>
  )
}

function statusLabel(status: RegistrationStatus) {
  return {
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under review',
    MORE_INFORMATION_REQUIRED: 'More info',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  }[status]
}

function isPdfBill(bill: { filename: string; contentType: string }) {
  return bill.contentType.toLowerCase().includes('pdf') || bill.filename.toLowerCase().endsWith('.pdf')
}

function serialComparisonNote(result?: string) {
  if (result === 'FOUND_UNREGISTERED') {
    return 'Serial matched the product master table and appears unregistered. Final approval is still manual.'
  }
  if (result === 'FOUND_ALREADY_REGISTERED') {
    return 'Serial matched the product master table but appears already registered. Check carefully before approval.'
  }
  if (result === 'NOT_FOUND') {
    return 'Serial was not found in Limac database. Add the serial number in Limac database before approving this registration.'
  }
  if (result === 'VALIDATION_NOT_AVAILABLE') {
    return 'Serial check was unavailable during registration. Verify the serial number in Limac database before approval.'
  }
  return 'No product master check was run during customer registration. Verify the serial number in Limac database before approval.'
}
