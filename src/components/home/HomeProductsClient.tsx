'use client'

import Link from 'next/link'
import { ArrowRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import Badge from '@/components/common/Badge'
import ProductImageSlideshow from '@/components/products/ProductImageSlideshow'
import type { Product } from '@/lib/types'
import { formatCategoryLabel } from '@/lib/utils'

interface HomeProductsClientProps {
  products: Product[]
}

export default function HomeProductsClient({ products }: HomeProductsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
    [products]
  )
  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((product) => product.category === selectedCategory)

  return (
    <>
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={15} className="text-limac-muted shrink-0" />
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategory === 'all'
              ? 'bg-limac-green text-limac-black'
              : 'border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600'
          }`}
        >
          All Products
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-limac-green text-limac-black'
                : 'border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600'
            }`}
          >
            {formatCategoryLabel(category)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {filteredProducts.map((product) => (
          <article
            key={product.slug}
            className="bg-gray-900 border border-gray-800 hover:border-limac-green/50 rounded-2xl p-5 card-hover group flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <Badge variant="green" size="sm">
                {formatCategoryLabel(product.category)}
              </Badge>
              {product.featured && <Badge variant="cyan" size="sm">Featured</Badge>}
            </div>

            <ProductImageSlideshow
              images={product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []}
              alt={product.imageAlt || product.name}
              fallbackLabel={`${product.specsGroup.voltage} - ${product.specsGroup.capacity}`}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="h-44 bg-gradient-to-br from-gray-800 to-limac-black rounded-xl border border-gray-800 mb-5 group-hover:border-limac-green/20 transition-colors"
              imageClassName="object-cover transition-transform duration-500 group-hover:scale-110"
              showControls={(product.imageUrls?.length ?? 0) > 1}
            />

            <h3 className="text-white font-bold text-base mb-2 leading-tight group-hover:text-limac-green transition-colors">
              {product.name}
            </h3>
            <p className="text-limac-muted text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
              {product.shortDescription}
            </p>

            <Link
              href={`/products/${product.slug}`}
              className="w-full inline-flex items-center justify-center gap-2 border border-limac-green/40 text-limac-green hover:bg-limac-green hover:text-limac-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
            >
              View Details <ArrowRight size={14} />
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}
