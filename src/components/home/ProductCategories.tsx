import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sun, Bike, Battery, Lightbulb } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import RevealOnScroll from '@/components/common/RevealOnScroll'
import { getProducts } from '@/lib/payload'

const CATEGORIES = [
  {
    icon: Sun,
    label: 'Solar Storage',
    value: 'solar-storage',
    description: 'High-capacity LiFePO4 battery packs for residential and commercial solar installations. Store more, waste less.',
    features: ['12V / 24V / 48V options', '50AH to 200AH capacity', '6000+ cycle life'],
    color: 'from-yellow-500/10 to-transparent',
    borderColor: 'hover:border-yellow-500/40',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
  },
  {
    icon: Bike,
    label: 'Electric scooter Batteries',
    value: 'Electric scooter',
    description: 'Lightweight lithium starter batteries delivering high CCA ratings for Electric scooters, scooters, and ATVs.',
    features: ['70% lighter than lead-acid', 'High CCA rating', '1500+ cycle life'],
    color: 'from-limac-blue/10 to-transparent',
    borderColor: 'hover:border-limac-blue/40',
    iconColor: 'text-limac-cyan',
    iconBg: 'bg-limac-cyan/10',
  },
  {
    icon: Battery,
    label: '12V Series',
    value: '12v-series',
    description: 'Versatile deep cycle 12V batteries for inverters, UPS systems, off-grid setups, and industrial applications.',
    features: ['Deep cycle design', 'Built-in BMS', 'Wide temperature range'],
    color: 'from-limac-green/10 to-transparent',
    borderColor: 'hover:border-limac-green/40',
    iconColor: 'text-limac-green',
    iconBg: 'bg-limac-green/10',
  },
  {
    icon: Lightbulb,
    label: 'LiFePO4 Lighting',
    value: 'lifepo4-lighting',
    description: 'Dedicated battery solutions for solar street lights, garden lights, and outdoor lighting systems.',
    features: ['Long night discharge', 'IP67 compatible', 'Auto recovery BMS'],
    color: 'from-purple-500/10 to-transparent',
    borderColor: 'hover:border-purple-500/40',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
]

export default async function ProductCategories() {
  const products = await getProducts()

  const categoryImageByValue = CATEGORIES.reduce<Record<string, string | undefined>>((acc, category) => {
    const matchedProduct = products.find((product) => product.category === category.value && product.imageUrl)
    acc[category.value] = matchedProduct?.imageUrl
    return acc
  }, {})

  return (
    <section className="bg-limac-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Product Range"
          title="Battery Solutions for"
          highlight="Every Application"
          subtitle="From solar storage to Electric scooter starters, Limac offers premium LiFePO4 batteries designed for Kerala's climate and usage patterns."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, index) => {
            const Icon = cat.icon
            return (
              <RevealOnScroll key={cat.value} delayMs={index * 100}>
                <Link
                  href={`/products?category=${cat.value}`}
                  className={`group bg-gray-900 border border-gray-800 ${cat.borderColor} rounded-xl overflow-hidden flex flex-col card-hover transition-all duration-300`}
                >
                  <div className="relative h-36 border-b border-gray-800 overflow-hidden">
                    {categoryImageByValue[cat.value] ? (
                      <Image
                        src={categoryImageByValue[cat.value] as string}
                        alt={`${cat.label} category image`}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-limac-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute left-4 bottom-4">
                      <div className={`w-12 h-12 ${cat.iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <Icon size={22} className={cat.iconColor} />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                  <h3 className="text-white font-bold text-base mb-2 group-hover:text-limac-green transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-limac-muted text-sm leading-relaxed mb-4 flex-1">
                    {cat.description}
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {cat.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-limac-muted text-xs">
                        <span className="w-1 h-1 bg-limac-green rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span className="flex items-center gap-1 text-limac-green text-sm font-medium group-hover:gap-2 transition-all">
                    View Products <ArrowRight size={14} />
                  </span>
                  </div>
                </Link>
              </RevealOnScroll>
            )
          })}
        </div>
      </div>
    </section>
  )
}
