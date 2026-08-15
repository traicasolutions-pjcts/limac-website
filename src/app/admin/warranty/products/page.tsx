import type { Metadata } from 'next'
import AdminProductsClient from '@/components/warranty/AdminProductsClient'

export const metadata: Metadata = {
  title: 'Warranty Product Serials',
}

export default function WarrantyProductsPage() {
  return (
    <section className="min-h-screen bg-limac-black px-4 py-24">
      <AdminProductsClient />
    </section>
  )
}
