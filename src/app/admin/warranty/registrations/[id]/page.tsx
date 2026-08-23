import type { Metadata } from 'next'
import AdminRegistrationDetailClient from '@/components/warranty/AdminRegistrationDetailClient'

export const metadata: Metadata = {
  title: 'Warranty Registration Detail',
}

export default async function WarrantyRegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <section className="min-h-screen bg-limac-black px-4 pb-24 pt-32">
      <AdminRegistrationDetailClient id={id} />
    </section>
  )
}
