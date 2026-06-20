import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import HomeProductsClient from '@/components/home/HomeProductsClient'
import { getProducts } from '@/lib/payload'

export default async function LimacSiteProducts() {
  const products = await getProducts()

  return (
    <section className="bg-limac-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Our Products"
          title="Limac Battery Catalogue"
          subtitle=""
          centered
        />

        <HomeProductsClient products={products} />

        <div className="text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-limac-green hover:bg-green-400 text-limac-black font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Open Product Page
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
