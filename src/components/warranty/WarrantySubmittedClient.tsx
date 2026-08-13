'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function WarrantySubmittedClient() {
  const searchParams = useSearchParams()
  const [reference, setReference] = useState(searchParams.get('reference') || '')

  useEffect(() => {
    const queryReference = searchParams.get('reference')
    const storedReference = window.sessionStorage.getItem('limacWarrantyLastReference')
    setReference(queryReference || storedReference || 'LIMAC-REG-PENDING')
  }, [searchParams])

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-800 bg-limac-black/70 p-8 text-center shadow-xl">
      <CheckCircle2 className="mx-auto text-limac-green" size={48} />
      <p className="mt-6 text-sm font-semibold uppercase text-limac-green">Submission received</p>
      <h1 className="mt-3 text-3xl font-bold text-white">Warranty review pending</h1>
      <p className="mt-4 text-limac-muted">Your registration reference is</p>
      <p className="mt-3 rounded-lg border border-limac-green/30 bg-limac-green/10 px-4 py-3 font-bold text-white">
        {reference}
      </p>
      <Link
        href="/warranty/status"
        className="mt-6 inline-flex rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black"
      >
        Check status
      </Link>
    </div>
  )
}
