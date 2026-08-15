'use client'

import { FormEvent, useState } from 'react'
import { Search } from 'lucide-react'
import { lookupWarrantyStatus } from '@/services/warrantyApi'
import type { StatusLookupResponse } from '@/types/warranty'

export default function WarrantyStatusClient() {
  const [reference, setReference] = useState('')
  const [mobileOrSerial, setMobileOrSerial] = useState('')
  const [result, setResult] = useState<StatusLookupResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const lookupKey = mobileOrSerial.trim()
      const looksLikeMobile = /^[+\d ]{10,16}$/.test(lookupKey)
      setResult(
        await lookupWarrantyStatus({
          registration_reference: reference,
          ...(looksLikeMobile ? { mobile_number: lookupKey } : { serial_number: lookupKey }),
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label>
        <span className="mb-1.5 block text-sm font-semibold text-white">Registration reference</span>
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-sm text-white outline-none transition focus:border-limac-green"
        />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-semibold text-white">
          Registered mobile or product serial
        </span>
        <input
          value={mobileOrSerial}
          onChange={(event) => setMobileOrSerial(event.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-sm text-white outline-none transition focus:border-limac-green"
        />
      </label>
      {error ? <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700">{error}</p> : null}
      {result ? (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-white">
          <p className="font-semibold">{result.status}</p>
          {result.warranty_number ? <p>Warranty number: {result.warranty_number}</p> : null}
          {result.message ? <p className="text-limac-muted">{result.message}</p> : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black disabled:opacity-60"
      >
        <Search size={16} />
        {loading ? 'Checking...' : 'Check status'}
      </button>
    </form>
  )
}
