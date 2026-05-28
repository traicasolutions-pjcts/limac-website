'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Battery, Filter } from 'lucide-react'
import Badge from '@/components/common/Badge'
import ProductImageSlideshow from '@/components/products/ProductImageSlideshow'
import type { Product } from '@/lib/types'
import { formatCategoryLabel } from '@/lib/utils'

interface ProductsListClientProps {
  products: Product[]
}

export default function ProductsListClient({ products }: ProductsListClientProps) {
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category') ?? 'all'
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).map((category) => ({
    label: formatCategoryLabel(category),
    value: category,
  }))

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((product) => product.category === selectedCategory)

  return (
    <>
      <div className="sticky top-[64px] z-30 bg-limac-black/95 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto pb-0.5">
          <Filter size={15} className="text-limac-muted shrink-0" />
          <Link
            href="/products"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-limac-green text-limac-black'
                : 'border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600'
            }`}
          >
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/products?category=${encodeURIComponent(category.value)}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.value
                  ? 'bg-limac-green text-limac-black'
                  : 'border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600'
              }`}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-limac-muted text-sm mb-6">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && (
              <> in <span className="text-limac-green font-medium">{formatCategoryLabel(selectedCategory)}</span></>
            )}
          </p>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Battery size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-limac-muted">No products found in this category.</p>
              <Link href="/products" className="text-limac-green hover:underline text-sm mt-2 inline-block">
                View all products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <div
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
                    imageClassName="object-contain object-center transition-transform duration-500 group-hover:scale-110"
                    showControls={(product.imageUrls?.length ?? 0) > 1}
                  />

                  <h2 className="text-white font-bold text-base mb-2 leading-tight group-hover:text-limac-green transition-colors">
                    {product.name}
                  </h2>
                  <p className="text-limac-muted text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                    {product.shortDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-black/50 rounded-lg p-2 border border-gray-800">
                      <div className="text-limac-muted text-[10px]">Cycle Life</div>
                      <div className="text-white text-xs font-semibold">{product.specsGroup.cycleLife}</div>
                    </div>
                    <div className="bg-black/50 rounded-lg p-2 border border-gray-800">
                      <div className="text-limac-muted text-[10px]">Warranty</div>
                      <div className="text-white text-xs font-semibold">{product.specsGroup.warranty}</div>
                    </div>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 border border-limac-green/40 text-limac-green hover:bg-limac-green hover:text-limac-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
                  >
                    View Details <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
