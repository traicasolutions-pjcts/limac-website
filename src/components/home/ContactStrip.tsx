import Link from 'next/link'
import { Phone, MessageCircle, Mail, ArrowRight } from 'lucide-react'
import { LIMAC } from '@/lib/constants'

export default function ContactStrip() {
  return (
    <section className="bg-gradient-to-r from-limac-navy via-limac-black to-limac-navy border-y border-gray-800 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Text + CTAs */}
          <div>
            <div className="inline-block bg-limac-green/10 border border-limac-green/30 text-limac-green text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              Get in Touch
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Ready to Upgrade to{' '}
              <span className="gradient-text">LiFePO4?</span>
            </h2>
            <p className="text-limac-muted text-base leading-relaxed mb-8">
              Speak directly with our battery experts in Thrissur. We&apos;ll help you choose the
              right battery for your solar system, Electric scooter, or application — and provide
              a competitive quote fast.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={`https://wa.me/${LIMAC.whatsapp}?text=Hi%20Limac%2C%20I%20need%20a%20quote.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bf5c] text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <MessageCircle size={18} />
                WhatsApp Us
              </a>
              <a
                href={`tel:${LIMAC.phone.primary}`}
                className="inline-flex items-center gap-2 border border-limac-green/40 text-limac-green hover:bg-limac-green/10 font-semibold px-6 py-3 rounded-lg transition-all duration-200"
              >
                <Phone size={18} />
                Call Now
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600 font-semibold px-6 py-3 rounded-lg transition-all duration-200"
              >
                Contact Form <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right: Contact info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Phone,
                label: 'Phone',
                lines: [LIMAC.phone.primary, LIMAC.phone.secondary, LIMAC.phone.tertiary],
                href: `tel:${LIMAC.phone.primary}`,
              },
              {
                icon: Mail,
                label: 'Email',
                lines: [LIMAC.email.info, LIMAC.email.sales],
                href: `mailto:${LIMAC.email.info}`,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="bg-limac-black border border-gray-800 hover:border-limac-green/40 rounded-xl p-5 group transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-limac-green/10 border border-limac-green/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-limac-green/20 transition-colors">
                    <Icon size={18} className="text-limac-green" />
                  </div>
                  <div className="text-white font-semibold text-sm mb-2">{item.label}</div>
                  {item.lines.map((line) => (
                    <div key={line} className="text-limac-muted text-sm">
                      {line}
                    </div>
                  ))}
                </a>
              )
            })}

            {/* Location */}
            <div className="sm:col-span-2 bg-limac-black border border-gray-800 hover:border-limac-green/40 rounded-xl p-5 transition-all duration-200">
              <div className="text-white font-semibold text-sm mb-1">📍 Address</div>
              <address className="not-italic text-limac-muted text-sm leading-relaxed">
                {LIMAC.address.line1}, {LIMAC.address.line2},<br />
                {LIMAC.address.city}, {LIMAC.address.state} — {LIMAC.address.pincode}
              </address>
              <a
                href={LIMAC.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-limac-cyan text-xs mt-2 hover:underline"
              >
                Open in Google Maps <ArrowRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
