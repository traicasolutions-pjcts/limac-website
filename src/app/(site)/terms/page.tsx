import type { Metadata } from 'next'
import { LIMAC } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service | Limac Power Tech',
  description: 'Terms and conditions governing the use of the Limac Power Tech website.',
}

export default function TermsPage() {
  return (
    <main className="bg-limac-black text-limac-white min-h-screen">
      {/* Header */}
      <section className="bg-limac-navy py-16 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-limac-green text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-limac-muted text-sm">Last updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">1. Acceptance of Terms</h2>
          <p className="text-limac-muted leading-relaxed">
            By accessing or using the Limac Power Tech website (limac.in), you agree to be bound by
            these Terms of Service. If you do not agree, please do not use this website.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">2. Use of the Website</h2>
          <p className="text-limac-muted leading-relaxed mb-3">
            You agree to use this website only for lawful purposes and in a manner that does not:
          </p>
          <ul className="text-limac-muted leading-relaxed space-y-2 pl-5 list-disc">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the rights of others</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Transmit harmful, offensive, or malicious content</li>
            <li>Misuse the AI chat assistant for non-product-related purposes</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">3. Product Information</h2>
          <p className="text-limac-muted leading-relaxed">
            All product specifications, prices, and availability listed on this website are for informational
            purposes only. Limac Power Tech reserves the right to change product specifications, pricing,
            and availability without prior notice. Final pricing and product details are confirmed at the
            time of purchase/order.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">4. Enquiry Submissions</h2>
          <p className="text-limac-muted leading-relaxed">
            By submitting an enquiry form, you consent to being contacted by our sales team via phone,
            WhatsApp, or email. We will not use your contact information for unsolicited marketing
            unrelated to your stated product interest.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">5. AI Chat Assistant</h2>
          <p className="text-limac-muted leading-relaxed">
            Our website includes an AI-powered chat assistant. Responses are generated automatically and
            may not always be fully accurate. Do not rely solely on AI responses for critical purchase
            decisions — always confirm details with our team. Chat data is processed via Anthropic's API
            and is not stored beyond the active session.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">6. Intellectual Property</h2>
          <p className="text-limac-muted leading-relaxed">
            All content on this website — including text, graphics, logos, images, and code — is the
            property of Limac Power Tech or its licensors and is protected by copyright. You may not
            reproduce or redistribute any content without explicit written permission.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">7. Limitation of Liability</h2>
          <p className="text-limac-muted leading-relaxed">
            Limac Power Tech provides this website on an "as is" basis. We make no warranties regarding
            accuracy, availability, or fitness for a particular purpose. To the maximum extent permitted
            by applicable law, we are not liable for any indirect, incidental, or consequential damages
            arising from your use of this website.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">8. Third-Party Links</h2>
          <p className="text-limac-muted leading-relaxed">
            Our website may contain links to third-party websites. We are not responsible for the
            content or privacy practices of those sites and encourage you to review their terms and
            privacy policies independently.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">9. Governing Law</h2>
          <p className="text-limac-muted leading-relaxed">
            These terms are governed by the laws of India. Any disputes arising from these terms
            shall be subject to the exclusive jurisdiction of the courts in Thrissur, Kerala.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">10. Changes to Terms</h2>
          <p className="text-limac-muted leading-relaxed">
            We may update these terms periodically. The "Last updated" date at the top of this page
            will indicate when changes were made. Continued use of the website after changes constitutes
            your acceptance of the revised terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">11. Contact</h2>
          <p className="text-limac-muted leading-relaxed">
            For questions about these terms, contact us:
          </p>
          <address className="text-limac-muted not-italic mt-3 space-y-1">
            <p className="text-white font-semibold">Limac Power Tech</p>
            <p>{LIMAC.address.line1}, {LIMAC.address.line2}</p>
            <p>{LIMAC.address.city}, {LIMAC.address.state} - {LIMAC.address.pincode}, {LIMAC.address.country}</p>
            <p>
              <a href={`mailto:${LIMAC.email.info}`} className="text-limac-cyan hover:underline">{LIMAC.email.info}</a>
            </p>
          </address>
        </div>
      </section>
    </main>
  )
}
