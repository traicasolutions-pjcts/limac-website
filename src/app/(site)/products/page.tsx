import type { Metadata } from 'next'
import { Suspense } from 'react'
import ProductsListClient from '@/components/products/ProductsListClient'
import { getProducts } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Our Products',
  description:
    'Explore Limac Power Tech\'s full range of LiFePO4 batteries — solar storage, Electric scooter starters, 12V deep cycle, and lighting batteries. Best prices in Kerala.',
  openGraph: {
    title: 'LiFePO4 Battery Products | Limac Power Tech Kerala',
    description: 'Premium lithium iron phosphate batteries for every application. Solar storage, Electric scooters, inverters and more.',
    images: [{ url: '/og-image.jpg' }],
    siteName: 'Limac Power Tech',
  },
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="bg-limac-black pt-24">
      {/* Page header */}
      <section className="py-12 px-4 border-b border-gray-800 bg-limac-navy">
        <div className="max-w-6xl mx-auto">
          <div className="inline-block bg-limac-green/10 border border-limac-green/30 text-limac-green text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Product Catalogue
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            LiFePO4 <span className="gradient-text">Battery Range</span>
          </h1>
          <p className="text-limac-muted text-lg max-w-2xl">
            Premium lithium iron phosphate batteries engineered for South India&apos;s climate.
            All batteries include built-in BMS protection and genuine warranty.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="py-12 px-4 text-center text-limac-muted">Loading products…</div>}>
        <ProductsListClient products={products} />
      </Suspense>
    </div>
  )
}
