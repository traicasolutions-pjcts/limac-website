import type { Metadata } from 'next'
import AdminRegistrationsClient from '@/components/warranty/AdminRegistrationsClient'

export const metadata: Metadata = {
  title: 'Warranty Registrations',
}

export default function WarrantyRegistrationsPage() {
  return (
    <section className="min-h-screen bg-limac-black px-4 pb-24 pt-32">
      <AdminRegistrationsClient />
    </section>
  )
}
