import { Phone, MessageCircle, ArrowRight } from 'lucide-react'
import { LIMAC } from '@/lib/constants'

export default function ContactStrip() {
  return (
    <section className="bg-gradient-to-r from-limac-navy via-limac-black to-limac-navy border-y border-gray-800 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-block bg-limac-green/10 border border-limac-green/30 text-limac-green text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Get in Touch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to Upgrade to <span className="gradient-text">LiFePO4?</span>
          </h2>
          <p className="text-limac-muted text-base leading-relaxed mb-8">
            Speak directly with our battery experts in Thrissur. We&apos;ll help you choose the
            right battery for your solar system, Electric scooter, or application, and provide a
            competitive quote fast.
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
            <button
              type="button"
              disabled
              aria-label="Contact form is temporarily disabled"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-gray-800 px-6 py-3 font-semibold text-gray-500 opacity-60"
            >
              Contact Form <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
