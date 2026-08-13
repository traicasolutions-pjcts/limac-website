import type { Metadata } from 'next'
import { Suspense } from 'react'
import WarrantySubmittedClient from '@/components/warranty/WarrantySubmittedClient'

export const metadata: Metadata = {
  title: 'Warranty Submitted',
  description: 'Limac warranty registration submission acknowledgement.',
}

export default function WarrantySubmittedPage() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-limac-navy via-limac-black to-limac-black px-4 pb-16 pt-32">
      <Suspense
        fallback={
          <div className="mx-auto max-w-xl rounded-lg border border-gray-800 bg-limac-black/70 p-8 text-center shadow-xl">
            <p className="text-limac-muted">Loading submission reference...</p>
          </div>
        }
      >
        <WarrantySubmittedClient />
      </Suspense>
    </section>
  )
}
