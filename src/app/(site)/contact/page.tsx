import type { Metadata } from 'next'
import { Phone, Mail, MapPin, MessageCircle, ExternalLink } from 'lucide-react'
import EnquiryForm from '@/components/forms/EnquiryForm'
import { LIMAC } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Limac Power Tech — Thrissur, Kerala. Call, WhatsApp, or email us for LiFePO4 battery enquiries, pricing, and technical support.',
  openGraph: {
    title: 'Contact Limac Power Tech | Thrissur, Kerala',
    description: 'Reach our battery experts in Thrissur for quotes, technical advice, and support.',
    images: [{ url: '/og-image.jpg' }],
    siteName: 'Limac Power Tech',
  },
}

export default function ContactPage() {
  return (
    <div className="bg-limac-black pt-24">
      {/* Header */}
      <section className="py-12 px-4 border-b border-gray-800 bg-limac-navy">
        <div className="max-w-6xl mx-auto">
          <div className="inline-block bg-limac-green/10 border border-limac-green/30 text-limac-green text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-limac-muted text-lg max-w-2xl">
            Our Thrissur team is ready to help you choose the right LiFePO4 battery, provide
            pricing, and answer all technical questions.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Form */}
          <div>
            <h2 className="text-white font-bold text-2xl mb-6">Send an Enquiry</h2>
            <EnquiryForm />
          </div>

          {/* Right: Contact details */}
          <div>
            <h2 className="text-white font-bold text-2xl mb-6">Our Contact Details</h2>

            <div className="space-y-4 mb-8">
              {/* Phone */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-limac-green/10 rounded-lg flex items-center justify-center">
                    <Phone size={16} className="text-limac-green" />
                  </div>
                  <span className="text-white font-semibold">Phone</span>
                </div>
                <div className="space-y-2 pl-12">
                  {[LIMAC.phone.primary, LIMAC.phone.secondary, LIMAC.phone.tertiary].map((p) => (
                    <a
                      key={p}
                      href={`tel:${p.replace(/\s/g, '')}`}
                      className="block text-limac-muted hover:text-limac-green text-sm transition-colors"
                    >
                      {p}
                    </a>
                  ))}
                </div>
              </div>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${LIMAC.whatsapp}?text=Hi%20Limac%2C%20I%20would%20like%20to%20enquire%20about%20your%20batteries.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366] rounded-xl p-5 transition-all group"
              >
                <div className="w-9 h-9 bg-[#25D366]/20 rounded-lg flex items-center justify-center">
                  <MessageCircle size={16} className="text-[#25D366]" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm group-hover:text-[#25D366] transition-colors">WhatsApp Us</div>
                  <div className="text-limac-muted text-xs">+{LIMAC.whatsapp}</div>
                </div>
              </a>

              {/* Email */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-limac-green/10 rounded-lg flex items-center justify-center">
                    <Mail size={16} className="text-limac-green" />
                  </div>
                  <span className="text-white font-semibold">Email</span>
                </div>
                <div className="space-y-2 pl-12">
                  {[LIMAC.email.info, LIMAC.email.sales].map((e) => (
                    <a
                      key={e}
                      href={`mailto:${e}`}
                      className="block text-limac-muted hover:text-limac-green text-sm transition-colors"
                    >
                      {e}
                    </a>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-limac-green/10 rounded-lg flex items-center justify-center">
                    <MapPin size={16} className="text-limac-green" />
                  </div>
                  <span className="text-white font-semibold">Address</span>
                </div>
                <address className="not-italic text-limac-muted text-sm leading-relaxed pl-12">
                  {LIMAC.address.line1},<br />
                  {LIMAC.address.line2},<br />
                  {LIMAC.address.city}, {LIMAC.address.state} — {LIMAC.address.pincode},<br />
                  {LIMAC.address.country}
                </address>
                <a
                  href={LIMAC.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-limac-cyan hover:text-cyan-300 text-xs mt-3 pl-12 transition-colors"
                >
                  <ExternalLink size={12} />
                  Open in Google Maps
                </a>
              </div>
            </div>

            {/* Map embed placeholder */}
            <div className="rounded-xl overflow-hidden border border-gray-800 h-56">
              <iframe
                title="Limac Power Tech Location — Thrissur, Kerala"
                src={LIMAC.mapEmbed}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
