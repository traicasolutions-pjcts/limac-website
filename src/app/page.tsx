import type { Metadata } from 'next'
import HeroBanner from '@/components/home/HeroBanner'
import LimacSiteProducts from '@/components/home/LimacSiteProducts'
import WhyChooseLimac from '@/components/home/WhyChooseLimac'
import LatestBlogPosts from '@/components/home/LatestBlogPosts'
import Testimonials from '@/components/home/Testimonials'
import ContactStrip from '@/components/home/ContactStrip'

export const metadata: Metadata = {
  title: "Limac",
  description:
    'Limac Power Tech — Premium LiFePO4 batteries for solar storage, Electric scooters, and residential use. 50,000+ installations across Kerala. Based in Thrissur since 2018.',
  openGraph: {
    title: 'Limac Power Tech | LiFePO4 Battery Specialists Kerala',
    description:
      'Premium lithium iron phosphate batteries for solar, Electric scooters, and homes. Trusted by 50,000+ customers in Kerala since 2018.',
    images: [{ url: '/og-image.jpg' }],
    siteName: 'Limac Power Tech',
  },
}

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <LimacSiteProducts />
      <WhyChooseLimac />
      <LatestBlogPosts />
      <Testimonials />
      <ContactStrip />
    </>
  )
}
