'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Phone } from 'lucide-react'
import { NAV_LINKS, LIMAC } from '@/lib/constants'
import { withBasePath } from '@/lib/basePath'
import MobileMenu from './MobileMenu'
import ThemeToggle from '@/components/common/ThemeToggle'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-limac-black/95 backdrop-blur-md shadow-lg shadow-black/50 border-b border-gray-800'
            : 'bg-transparent'
        }`}
      >
        {/* Top contact bar */}
        <div className="hidden lg:block bg-limac-navy border-b border-gray-800/50">
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between text-xs text-limac-muted">
            <span>Kerala&apos;s Trusted LiFePO4 Battery Specialists — Since {LIMAC.founded}</span>
            <div className="flex items-center gap-4">
              <a
                href={`tel:${LIMAC.phone.primary}`}
                className="flex items-center gap-1.5 hover:text-limac-green transition-colors"
              >
                <Phone size={11} />
                {LIMAC.phone.primary}
              </a>
              <span className="text-gray-700">|</span>
              <a
                href={`mailto:${LIMAC.email.info}`}
                className="hover:text-limac-green transition-colors"
              >
                {LIMAC.email.info}
              </a>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                  src={withBasePath('/logo-header-dark.webp')}
                  alt="Limac Power Tech Logo"
                  width={1412}
                  height={424}
                  priority
                  className="theme-logo-dark h-auto w-24 sm:w-32 lg:w-40 xl:w-48"
                />
                <Image
                  src={withBasePath('/logo-header.webp')}
                  alt="Limac Power Tech Logo"
                  width={1412}
                  height={424}
                  priority
                  className="theme-logo-light h-auto w-24 sm:w-32 lg:w-40 xl:w-48"
                />
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-limac-muted hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
              <a
                href={`https://wa.me/${LIMAC.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-2 bg-limac-green hover:bg-green-400 text-limac-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors duration-200"
              >
                Get Quote
              </a>
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-2 text-limac-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      <MobileMenu isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </>
  )
}
