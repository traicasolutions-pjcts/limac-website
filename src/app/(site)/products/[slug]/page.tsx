import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/common/Badge'
import EnquiryForm from '@/components/forms/EnquiryForm'
import ProductImageSlideshow from '@/components/products/ProductImageSlideshow'
import { getProductBySlug, getProducts } from '@/lib/payload'
import { formatCategoryLabel } from '@/lib/utils'

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ slug: p.slug }))
}

interface ProductPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }

  return {
    title: product.name,
    description: `${product.name} — ${product.shortDescription}. ${product.specsGroup.voltage}, ${product.specsGroup.capacity}, ${product.specsGroup.cycleLife} cycle life. Available from Limac Power Tech, Kerala.`,
    openGraph: {
      title: `${product.name} | Limac Power Tech`,
      description: product.shortDescription,
      images: [{ url: '/og-image.jpg' }],
      siteName: 'Limac Power Tech',
    },
  }
}

const SPEC_LABELS: Record<string, string> = {
  voltage: 'Nominal Voltage',
  capacity: 'Capacity',
  weight: 'Weight',
  dimensions: 'Dimensions',
  cycleLife: 'Cycle Life',
  warranty: 'Warranty',
  operatingTemp: 'Operating Temperature',
  application: 'Application',
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const allProducts = await getProducts()
  const relatedProducts = allProducts.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  ).slice(0, 3)

  const categoryLabel = formatCategoryLabel(product.category)

  return (
    <div className="bg-limac-black pt-24">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 px-4 py-3 bg-limac-navy">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-limac-muted">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-white transition-colors">Products</Link>
          <span>/</span>
          <span className="text-white truncate">{product.name}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Battery visual + quick specs */}
          <div>
            {/* Main image area */}
            <ProductImageSlideshow
              images={product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []}
              alt={product.imageAlt || product.name}
              fallbackLabel={`${product.specsGroup.voltage} - ${product.specsGroup.capacity}`}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="bg-white border border-gray-800 rounded-2xl h-[32rem] md:h-[36rem] lg:h-[40rem] mb-4"
              imageClassName="object-contain object-center p-4 md:p-6"
              priority
            />

            <div className="flex gap-3 mb-6">
              <Badge variant="green">{categoryLabel}</Badge>
              {product.featured && <Badge variant="cyan">Featured Product</Badge>}
            </div>

            {/* Key features */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-bold text-sm mb-4">Key Features</h3>
              {product.keyFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5 mb-2.5">
                  <CheckCircle size={14} className="text-limac-green mt-0.5 shrink-0" />
                  <span className="text-limac-muted text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product details */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
              {product.name}
            </h1>
            <p className="text-limac-muted text-base leading-relaxed mb-6">
              {product.longDescription || product.shortDescription}
            </p>

            {/* Specs table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-800 bg-black/30">
                <h2 className="text-white font-bold text-sm">Technical Specifications</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {Object.entries(product.specsGroup).map(([key, value]) => (
                  <div key={key} className="flex items-center px-5 py-3">
                    <dt className="w-1/2 text-limac-muted text-sm">
                      {SPEC_LABELS[key] ?? key}
                    </dt>
                    <dd className="w-1/2 text-white text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </div>
            </div>

            {/* Application */}
            <div className="bg-limac-green/5 border border-limac-green/20 rounded-xl p-4 mb-6">
              <div className="text-limac-green font-semibold text-sm mb-1">Ideal For</div>
              <p className="text-limac-muted text-sm">{product.specsGroup.application}</p>
            </div>

            {/* Enquiry form */}
            <EnquiryForm productName={product.name} />
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-2xl mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/products/${rp.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-limac-green/50 rounded-xl p-5 card-hover group"
                >
                  <div className="relative h-24 bg-limac-black rounded-lg border border-gray-800 flex items-center justify-center mb-4 overflow-hidden">
                    <ProductImageSlideshow
                      images={rp.imageUrls?.length ? rp.imageUrls : rp.imageUrl ? [rp.imageUrl] : []}
                      alt={rp.imageAlt || rp.name}
                      fallbackLabel={`${rp.specsGroup.voltage} - ${rp.specsGroup.capacity}`}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="absolute inset-0"
                      imageClassName="object-cover"
                      showControls={false}
                    />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-limac-green transition-colors">
                    {rp.name}
                  </h3>
                  <p className="text-limac-muted text-xs">
                    {rp.specsGroup.voltage} · {rp.specsGroup.capacity}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
