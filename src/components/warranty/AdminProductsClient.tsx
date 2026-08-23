'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, Loader2, LogOut, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { deleteWarrantyProduct, listWarrantyProducts, upsertWarrantyProduct } from '@/services/warrantyApi'
import type { AdminProduct } from '@/types/warranty'
import {
  clearAdminSession,
  getAdminAccessToken,
  isSuperAdmin,
  isAdminSessionExpired,
  touchAdminSession,
} from '@/components/warranty/adminSession'

const emptyForm = {
  serial_number: '',
  product_model: '',
  sold_at: '',
}

const today = new Date().toISOString().slice(0, 10)

export default function AdminProductsClient() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteAction, setDeleteAction] = useState<AdminProduct | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function logout() {
    clearAdminSession()
    window.location.href = '/admin/warranty/login'
  }

  async function load(nextSearch = search) {
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
      setProducts(await listWarrantyProducts(token, nextSearch))
      setCanDelete(isSuperAdmin())
      setAuthorized(true)
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Unable to load products.'
      setError(nextError)
      if (nextError.toLowerCase().includes('session') || nextError.toLowerCase().includes('login')) {
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
    const timer = window.setInterval(() => {
      if (isAdminSessionExpired()) logout()
    }, 10_000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) return logout()
    if (form.sold_at && form.sold_at > today) {
      setError('Sold date cannot be greater than today.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await upsertWarrantyProduct(token, {
        serial_number: form.serial_number,
        product_model: form.product_model,
        sold_at: form.sold_at || null,
      })
      setMessage('Product serial saved.')
      setForm(emptyForm)
      await load('')
      setSearch('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product serial.')
    } finally {
      setSaving(false)
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    load(search)
  }

  function openDelete(product: AdminProduct) {
    setDeleteAction(product)
    setDeleteConfirmation('')
    setError(null)
    setMessage(null)
  }

  async function confirmDelete() {
    if (!deleteAction) return
    const token = getAdminAccessToken()
    if (!token || isAdminSessionExpired()) return logout()
    if (deleteConfirmation !== deleteAction.serial_number) {
      setError('Type the exact serial number to confirm deletion.')
      return
    }
    setDeletingId(deleteAction.id)
    setError(null)
    setMessage(null)
    try {
      await deleteWarrantyProduct(token, deleteAction.id)
      setMessage(`Deleted product serial ${deleteAction.serial_number}.`)
      setDeleteAction(null)
      setDeleteConfirmation('')
      await load(search)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete product serial.')
    } finally {
      setDeletingId(null)
    }
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="rounded-lg bg-gray-900 p-5 text-sm text-limac-muted">Checking access...</p>
      </div>
    )
  }

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
          <h1 className="mt-6 text-3xl font-bold text-white">Product serials</h1>
          <p className="mt-2 text-sm text-limac-muted">
            Maintain serials used during warranty approval. Public registration does not block on this table yet.
          </p>
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

      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-lg border border-gray-800 bg-gray-900 p-5 md:grid-cols-3">
        <label>
          <span className="mb-1.5 block text-sm font-semibold text-white">Serial number</span>
          <input
            required
            value={form.serial_number}
            onChange={(event) => setForm((current) => ({ ...current, serial_number: event.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold text-white">Product model</span>
          <input
            required
            value={form.product_model}
            onChange={(event) => setForm((current) => ({ ...current, product_model: event.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold text-white">Sold date</span>
          <input
            type="date"
            max={today}
            value={form.sold_at}
            onChange={(event) => setForm((current) => ({ ...current, sold_at: event.target.value }))}
            className="w-full rounded-lg border border-gray-700 bg-limac-black px-3 py-3 text-sm text-white outline-none focus:border-limac-green"
          />
        </label>
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Save serial
          </button>
        </div>
      </form>

      <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-semibold text-white">Search</span>
          <span className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-3">
            <Search size={16} className="text-limac-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by serial, model or dealer code"
              className="w-full bg-transparent text-sm text-white outline-none"
            />
          </span>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black">
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              load('')
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-white"
          >
            <RefreshCw size={16} />
            Clear
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-800 text-xs uppercase text-limac-muted">
              <tr>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Sold date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Updated</th>
                {canDelete ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-limac-muted" colSpan={canDelete ? 7 : 6}>Loading products...</td>
                </tr>
              ) : products.length ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-semibold">
                      <div>{product.serial_number}</div>
                      <div className="text-xs text-limac-muted">{product.serial_normalized}</div>
                    </td>
                    <td className="px-4 py-3">{product.product_model}</td>
                    <td className="px-4 py-3 text-limac-muted">{formatDate(product.sold_at)}</td>
                    <td className="px-4 py-3">{product.status}</td>
                    <td className="px-4 py-3 text-limac-muted">{product.source_system || '-'}</td>
                    <td className="px-4 py-3 text-limac-muted">{formatDateTime(product.updated_at)}</td>
                    {canDelete ? (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => openDelete(product)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
                        >
                          {deletingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-limac-muted" colSpan={canDelete ? 7 : 6}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteAction ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-lg border border-red-500/40 bg-gray-900 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Delete product serial</h2>
            <p className="mt-3 text-sm text-limac-muted">
              This removes <span className="font-semibold text-white">{deleteAction.serial_number}</span> from the Limac database.
              Approval checks will no longer match this serial.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">
                Type {deleteAction.serial_number} to confirm
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
                disabled={deletingId === deleteAction.id || deleteConfirmation !== deleteAction.serial_number}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN') : '-'
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-IN') : '-'
}
