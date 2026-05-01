import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Facebook, ExternalLink } from 'lucide-react'
import { LIMAC, NAV_LINKS, PRODUCT_CATEGORIES } from '@/lib/constants'
import { withBasePath } from '@/lib/basePath'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-limac-navy border-t border-gray-800">
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={withBasePath('/logo.webp')}
                  alt="Limac Power Tech Logo"
                  width={132}
                  height={55}
                  className="h-10 w-auto"
                />
              </div>
              <div className="leading-none">
                <div className="font-bold text-white text-lg">Limac</div>
                <div className="text-limac-green text-[10px] font-medium tracking-widest uppercase">Power Tech</div>
              </div>
            </Link>
            <p className="text-limac-muted text-sm leading-relaxed mb-4">
              Kerala&apos;s trusted LiFePO4 battery specialists since {LIMAC.founded}. Powering homes,
              businesses, and vehicles across South India with premium lithium batteries.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={LIMAC.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-limac-green/20 hover:border-limac-green border border-gray-700 rounded-lg flex items-center justify-center text-limac-muted hover:text-limac-green transition-all duration-200"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Quick Links</h3>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-limac-muted hover:text-limac-green text-sm transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 bg-limac-green rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Products</h3>
            <ul className="space-y-2.5">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat.value}>
                  <Link
                    href={`/products?category=${cat.value}`}
                    className="text-limac-muted hover:text-limac-green text-sm transition-colors duration-200"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="text-limac-green hover:text-green-300 text-sm font-medium transition-colors duration-200">
                  View All Products →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-limac-green mt-0.5 shrink-0" />
                <address className="not-italic text-limac-muted text-sm leading-relaxed">
                  {LIMAC.address.line1},<br />
                  {LIMAC.address.line2},<br />
                  {LIMAC.address.city}, {LIMAC.address.state} — {LIMAC.address.pincode}
                </address>
              </li>
              <li className="flex flex-col gap-2">
                <a
                  href={`tel:${LIMAC.phone.primary}`}
                  className="flex items-center gap-2 text-limac-muted hover:text-limac-green text-sm transition-colors"
                >
                  <Phone size={14} className="text-limac-green" />
                  {LIMAC.phone.primary}
                </a>
                <a
                  href={`tel:${LIMAC.phone.secondary}`}
                  className="flex items-center gap-2 text-limac-muted hover:text-limac-green text-sm transition-colors"
                >
                  <Phone size={14} className="text-limac-green" />
                  {LIMAC.phone.secondary}
                </a>
              </li>
              <li className="flex flex-col gap-2">
                <a
                  href={`mailto:${LIMAC.email.info}`}
                  className="flex items-center gap-2 text-limac-muted hover:text-limac-green text-sm transition-colors"
                >
                  <Mail size={14} className="text-limac-green" />
                  {LIMAC.email.info}
                </a>
                <a
                  href={`mailto:${LIMAC.email.sales}`}
                  className="flex items-center gap-2 text-limac-muted hover:text-limac-green text-sm transition-colors"
                >
                  <Mail size={14} className="text-limac-green" />
                  {LIMAC.email.sales}
                </a>
              </li>
              <li>
                <a
                  href={LIMAC.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-limac-cyan hover:text-cyan-300 text-sm transition-colors"
                >
                  <ExternalLink size={13} />
                  View on Google Maps
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 bg-limac-black/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-limac-muted text-xs">
            © {currentYear} Limac Power Tech. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-limac-muted hover:text-white text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-limac-muted hover:text-white text-xs transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
