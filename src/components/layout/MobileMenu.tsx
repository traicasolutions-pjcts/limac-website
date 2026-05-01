'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Phone, MessageCircle } from 'lucide-react'
import { NAV_LINKS, LIMAC } from '@/lib/constants'
import { withBasePath } from '@/lib/basePath'
import ThemeToggle from '@/components/common/ThemeToggle'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 w-80 h-full bg-limac-black border-l border-gray-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="overflow-hidden">
              <Image
                src={withBasePath('/logo.webp')}
                alt="Limac Power Tech Logo"
                width={120}
                height={50}
                className="h-9 w-auto"
              />
            </div>
            <span className="font-bold text-white text-sm">Limac Power Tech</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="p-2 text-limac-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="block px-4 py-3 text-limac-muted hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Contact info */}
        <div className="px-6 py-4 border-t border-gray-800 space-y-3">
          <a
            href={`tel:${LIMAC.phone.primary}`}
            className="flex items-center gap-3 text-limac-muted hover:text-white transition-colors"
          >
            <Phone size={16} className="text-limac-green" />
            <span className="text-sm">{LIMAC.phone.primary}</span>
          </a>
          <a
            href={`https://wa.me/${LIMAC.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-limac-green hover:bg-green-400 text-limac-black font-semibold px-4 py-3 rounded-lg text-sm transition-colors duration-200"
          >
            <MessageCircle size={16} />
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  )
}
