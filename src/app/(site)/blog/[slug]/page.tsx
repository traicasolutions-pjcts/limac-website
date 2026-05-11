import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react'
import Badge from '@/components/common/Badge'
import { BLOG_POSTS_STATIC, BLOG_CATEGORIES, LIMAC } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return BLOG_POSTS_STATIC.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = BLOG_POSTS_STATIC.find((p) => p.slug === params.slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: '/og-image.jpg' }],
      siteName: 'Limac Power Tech',
    },
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = BLOG_POSTS_STATIC.find((p) => p.slug === params.slug)
  if (!post) notFound()

  const relatedPosts = BLOG_POSTS_STATIC.filter(
    (p) => p.category === post.category && p.slug !== post.slug
  ).slice(0, 2)

  const categoryLabel = BLOG_CATEGORIES.find((c) => c.value === post.category)?.label

  // Article content (static for now — replace with Payload rich text when CMS is connected)
  const articleContent = `
    ${post.excerpt}

    LiFePO4 (Lithium Iron Phosphate) batteries represent a significant advancement over traditional lead-acid
    battery technology. For Kerala homeowners and businesses investing in solar energy systems, choosing the right
    battery technology is crucial for maximizing return on investment.

    **Why LiFePO4 is Perfect for Kerala's Climate**

    Kerala's tropical climate — with high temperatures, humidity, and heavy monsoon rains — presents unique
    challenges for battery storage. LiFePO4 chemistry handles these conditions far better than lead-acid alternatives:

    - Operating temperature range: -20°C to 60°C (well within Kerala's climate)
    - No corrosion from humidity (sealed units)
    - No gas emission during charging (safe for indoor use)
    - Thermal stability — no thermal runaway risk

    **Cycle Life & Long-term Value**

    The biggest advantage of LiFePO4 over lead-acid is cycle life. A quality LiFePO4 battery from Limac Power Tech
    can deliver 6000+ full charge-discharge cycles versus just 300-500 for lead-acid. Over a 10-year period,
    you might replace a lead-acid battery 3-5 times while a LiFePO4 battery still performs at 80% capacity.

    For solar storage in Kerala, where batteries cycle daily from solar charging and evening/night use, this
    translates directly to dramatically lower cost of ownership.

    **Contact Limac Power Tech**

    For personalized advice on which LiFePO4 battery is right for your application, contact our Thrissur team
    at ${LIMAC.phone.primary} or WhatsApp us at +${LIMAC.whatsapp}.
  `

  return (
    <div className="bg-limac-black pt-24">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 px-4 py-3 bg-limac-navy">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-limac-muted">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-white truncate">{post.title}</span>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="muted">{categoryLabel}</Badge>
          <span className="flex items-center gap-1.5 text-limac-muted text-sm">
            <Calendar size={13} />
            {formatDate(post.publishedDate)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
          {post.title}
        </h1>

        {/* Feature image placeholder */}
        <div className="h-56 bg-gradient-to-br from-gray-900 to-limac-black border border-gray-800 rounded-xl flex items-center justify-center mb-8">
          <div className="text-6xl">
            {post.category === 'battery-tech' ? '🔋' : post.category === 'installation' ? '🔧' : '☀️'}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          {articleContent.split('\n\n').map((para, i) => {
            if (para.trim().startsWith('**') && para.trim().endsWith('**')) {
              return (
                <h2 key={i} className="text-white font-bold text-xl mt-8 mb-3">
                  {para.trim().replace(/\*\*/g, '')}
                </h2>
              )
            }
            if (para.trim().startsWith('-')) {
              const items = para.trim().split('\n').filter((l) => l.startsWith('-'))
              return (
                <ul key={i} className="space-y-2 my-4 pl-4">
                  {items.map((item, j) => (
                    <li key={j} className="text-limac-muted text-base flex items-start gap-2">
                      <span className="text-limac-green mt-1">•</span>
                      {item.replace(/^- /, '')}
                    </li>
                  ))}
                </ul>
              )
            }
            if (para.trim()) {
              return (
                <p key={i} className="text-limac-muted text-base leading-relaxed mb-4">
                  {para.trim()}
                </p>
              )
            }
            return null
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-gray-900 border border-limac-green/30 rounded-xl p-6">
          <h3 className="text-white font-bold text-lg mb-2">Need a LiFePO4 Battery in Kerala?</h3>
          <p className="text-limac-muted text-sm mb-4">
            Limac Power Tech supplies premium LiFePO4 batteries to homes and businesses across Kerala.
            Contact our Thrissur team for pricing and technical advice.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-limac-green hover:bg-green-400 text-limac-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              View Products <ArrowRight size={14} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-gray-800 px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-white font-bold text-xl mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-limac-green/40 rounded-xl p-5 card-hover group"
                >
                  <div className="text-limac-muted text-xs mb-2">{formatDate(rp.publishedDate)}</div>
                  <h3 className="text-white font-bold text-sm leading-snug group-hover:text-limac-green transition-colors">
                    {rp.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
