import type { Metadata } from 'next'
import WarrantyRegisterClient from '@/components/warranty/WarrantyRegisterClient'

export const metadata: Metadata = {
  title: 'Warranty Registration',
  description: 'Register your Limac Power Tech product warranty.',
}

export default function WarrantyRegisterPage() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-limac-navy via-limac-black to-limac-black px-4 pb-16 pt-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase text-limac-green">Limac warranty</p>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Register your product</h1>
          <p className="mt-3 text-limac-muted">
            Submit your purchase details and bill for manual review. Serial validation is advisory,
            so you can continue even if the current product master does not find a match.
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-limac-black/70 p-5 shadow-xl sm:p-8">
          <WarrantyRegisterClient />
        </div>
      </div>
    </section>
  )
}
