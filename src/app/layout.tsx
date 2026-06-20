import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/common/WhatsAppButton'
import ChatBot from '@/components/chat/ChatBot'
import { withBasePath } from '@/lib/basePath'
import { getSiteUrl } from '@/lib/siteUrl'

const logoPath = withBasePath('/logo.webp')
const ogImagePath = withBasePath('/og-image.jpg')
const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Limac Power Tech | Kerala\'s Trusted LiFePO4 Battery Specialists',
    template: '%s | Limac Power Tech',
  },
  description:
    'Limac Power Tech — Premium LiFePO4 batteries for solar storage, Electric scooters, and residential systems in Kerala, India. Based in Thrissur since 2018.',
  keywords: [
    'LiFePO4 battery Kerala',
    'solar battery Thrissur',
    'lithium battery Kerala',
    '12V 100AH LiFePO4',
    'solar storage battery India',
    'Electric scooter lithium battery Kerala',
  ],
  authors: [{ name: 'Limac Power Tech' }],
  creator: 'Limac Power Tech',
  icons: {
    icon: logoPath,
    shortcut: logoPath,
    apple: logoPath,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Limac Power Tech',
    title: 'Limac Power Tech | Kerala\'s Trusted LiFePO4 Battery Specialists',
    description:
      'Premium LiFePO4 batteries for solar, Electric scooters, and homes. Trusted by 50,000+ customers in Kerala since 2018.',
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: 'Limac Power Tech — LiFePO4 Batteries Kerala',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Limac Power Tech | LiFePO4 Battery Specialists Kerala',
    description:
      'Premium lithium iron phosphate batteries for solar, Electric scooters, and homes in Kerala.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-limac-black text-white antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppButton />
        <ChatBot />
      </body>
    </html>
  )
}
