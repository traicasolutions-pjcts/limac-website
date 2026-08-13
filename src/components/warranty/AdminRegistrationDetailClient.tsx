'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Eye, LogOut, RefreshCw, X } from 'lucide-react'
import {
  getWarrantyBillAccess,
  getWarrantyRegistration,
  updateWarrantyRegistrationStatus,
} from '@/services/warrantyApi'
import type { AdminRegistrationDetail, RegistrationStatus } from '@/types/warranty'
import {
  clearAdminSession,
  getAdminAccessToken,
  isAdminSessionExpired,
  touchAdminSession,
} from '@/components/warranty/adminSession'

export default function AdminRegistrationDetailClient({ id }: { id: string }) {
  const [detail, setDetail] = useState<AdminRegistrationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [billPreview, setBillPreview] = useState<{
    filename: string
    contentType: string
    url: string
  } | null>(null)

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
    load()
    const timer = window.setInterval(() => {
      if (isAdminSessionExpired()) logout()
    }, 10_000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function changeStatus(nextStatus: RegistrationStatus) {
    const token = getAdminAccessToken()
    if (!token) return logout()
    let reason: string | undefined
    if (nextStatus === 'REJECTED' || nextStatus === 'MORE_INFORMATION_REQUIRED') {
      reason = window.prompt('Enter reason or message for this status change:') || undefined
      if (!reason) return
    }
    setUpdating(true)
    try {
      await updateWarrantyRegistrationStatus(token, id, nextStatus, reason)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status.')
    } finally {
      setUpdating(false)
    }
  }

  async function viewBill() {
    const token = getAdminAccessToken()
    if (!token) return logout()
    try {
      const bill = await getWarrantyBillAccess(token, id)
      setBillPreview({
        filename: bill.filename,
        contentType: bill.content_type,
        url: bill.url,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open bill.')
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

  const warrantyExpiryDate = addYears(detail.purchase.purchase_date, 5)
  const serialNote = serialComparisonNote(detail.serial_validation?.result)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/warranty/registrations" className="inline-flex items-center gap-2 text-sm font-semibold text-limac-blue">
            <ChevronLeft size={16} />
            Back to registrations
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
        </div>
      </div>

      {error ? <p className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase text-limac-muted">Current status</p>
          <p className="mt-1 text-lg font-bold text-white">{detail.status}</p>
        </div>
        <select
          value={detail.status}
          disabled={updating}
          onChange={(event) => changeStatus(event.target.value as RegistrationStatus)}
          className="rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm font-semibold text-white"
        >
          <option value="PENDING">PENDING</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="MORE_INFORMATION_REQUIRED">MORE_INFORMATION_REQUIRED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
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
        <InfoCard title="Product" items={[
          ['Serial', detail.product.serial_number],
          ['Normalized serial', detail.product.serial_normalized],
          ['Customer model', detail.product.product_model_customer || '-'],
          ['Validation', detail.serial_validation?.result || '-'],
          ['CSV comparison note', serialNote],
        ]} />
        <InfoCard title="Purchase" items={[
          ['Purchase date', detail.purchase.purchase_date],
          ['Warranty expiry', warrantyExpiryDate],
          ['Invoice', detail.purchase.invoice_number],
          ['Dealer/shop', detail.purchase.dealer_name],
          ['Dealer code', detail.purchase.dealer_code || '-'],
        ]} />
      </div>

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
            disabled={!detail.bill_asset}
            onClick={viewBill}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eye size={16} />
            View bill
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

function InfoCard({ title, items }: { title: string; items: Array<[string, string]> }) {
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
    </div>
  )
}

function addYears(dateString: string, years: number) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  date.setFullYear(date.getFullYear() + years)
  return date.toISOString().slice(0, 10)
}

function serialComparisonNote(result?: string) {
  if (result === 'FOUND_UNREGISTERED') {
    return 'Serial matched the imported product CSV/master and appears unregistered. Final approval is still manual.'
  }
  if (result === 'FOUND_ALREADY_REGISTERED') {
    return 'Serial matched the imported product CSV/master but appears already registered. Check carefully before approval.'
  }
  if (result === 'NOT_FOUND') {
    return 'Serial was not found in the imported product CSV/master. Submission is still allowed for manual review.'
  }
  if (result === 'VALIDATION_NOT_AVAILABLE') {
    return 'Serial comparison was unavailable during submission. Verify manually before approval.'
  }
  return 'No serial comparison result was stored for this request.'
}
