import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Zap, Battery } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import Badge from '@/components/common/Badge'
import RevealOnScroll from '@/components/common/RevealOnScroll'
import { getFeaturedProducts } from '@/lib/payload'

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  if (!products.length) {
    return null
  }

  return (
    <section className="bg-limac-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <SectionHeader
            badge="Featured Products"
            title="Popular LiFePO4"
            highlight="Battery Models"
            subtitle="Our best-selling batteries trusted by Kerala's solar installers and EV customers."
          />
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-limac-green hover:text-green-300 font-medium text-sm transition-colors shrink-0 mb-12"
          >
            View All Products <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product, index) => (
            <RevealOnScroll key={product.id} delayMs={index * 90}>
              <div className="bg-gray-900 border border-gray-800 hover:border-limac-green/50 rounded-xl p-5 card-hover group flex flex-col">
              {/* Category badge */}
              <div className="flex items-center justify-between mb-4">
                <Badge variant="green" size="sm">
                  {product.category === 'solar-storage'
                    ? 'Solar Storage'
                    : product.category === 'Electric scooter'
                    ? 'Electric scooter'
                    : product.category === '12v-series'
                    ? '12V Series'
                    : 'Lighting'}
                </Badge>
                {product.featured && (
                  <Badge variant="cyan" size="sm">Featured</Badge>
                )}
              </div>

              {/* Battery icon */}
              <div className="relative h-32 bg-gradient-to-br from-gray-800 to-limac-black rounded-lg border border-gray-800 mb-5 flex items-center justify-center overflow-hidden group-hover:border-limac-green/20 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-limac-green/5 to-transparent" />
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt || product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="relative flex flex-col items-center gap-2 transition-transform duration-300 group-hover:scale-105">
                    <Battery size={40} className="text-limac-green/60 group-hover:text-limac-green transition-colors duration-300" />
                    <div className="text-limac-green font-bold text-sm">
                      {product.specsGroup.voltage} · {product.specsGroup.capacity}
                    </div>
                  </div>
                )}
              </div>

              {/* Product info */}
              <h3 className="text-white font-bold text-base mb-2 leading-tight group-hover:text-limac-green transition-colors">
                {product.name}
              </h3>
              <p className="text-limac-muted text-sm leading-relaxed mb-4 flex-1">
                {product.shortDescription}
              </p>

              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Cycle Life', value: product.specsGroup.cycleLife },
                  { label: 'Warranty', value: product.specsGroup.warranty },
                  { label: 'Weight', value: product.specsGroup.weight },
                  { label: 'Temp Range', value: product.specsGroup.operatingTemp },
                ].map((spec) => (
                  <div key={spec.label} className="bg-black/50 rounded-lg p-2 border border-gray-800">
                    <div className="text-limac-muted text-[10px] mb-0.5">{spec.label}</div>
                    <div className="text-white text-xs font-semibold">{spec.value}</div>
                  </div>
                ))}
              </div>

              <Link
                href={`/products/${product.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 border border-limac-green/40 text-limac-green hover:bg-limac-green hover:text-limac-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group-hover:border-limac-green"
              >
                <Zap size={14} />
                View Details
              </Link>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
