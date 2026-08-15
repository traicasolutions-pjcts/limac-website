import type { Metadata } from 'next'
import WarrantyStatusClient from '@/components/warranty/WarrantyStatusClient'

export const metadata: Metadata = {
  title: 'Warranty Status',
  description: 'Check your Limac warranty registration status.',
}

export default function WarrantyStatusPage() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-limac-navy via-limac-black to-limac-black px-4 pb-16 pt-32">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-limac-green">Warranty status</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Check registration status</h1>
          <p className="mt-3 text-limac-muted">
            Use your registration reference with either the registered mobile number or product serial.
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-limac-black/70 p-5 shadow-xl sm:p-8">
          <WarrantyStatusClient />
        </div>
      </div>
    </section>
  )
}
