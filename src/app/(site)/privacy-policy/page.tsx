import type { Metadata } from 'next'
import { LIMAC } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy | Limac Power Tech',
  description: 'How Limac Power Tech collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-limac-black text-limac-white min-h-screen">
      {/* Header */}
      <section className="bg-limac-navy py-16 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-limac-green text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-limac-muted text-sm">Last updated: January 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">1. Introduction</h2>
          <p className="text-limac-muted leading-relaxed">
            Limac Power Tech ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, and safeguard your information when you visit our website
            or contact us about our LiFePO₄ battery products and solutions.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">2. Information We Collect</h2>
          <p className="text-limac-muted leading-relaxed mb-3">
            We collect information you voluntarily provide, including:
          </p>
          <ul className="text-limac-muted leading-relaxed space-y-2 pl-5 list-disc">
            <li>Name and phone number (required for enquiries)</li>
            <li>Email address (optional, for sending confirmations)</li>
            <li>Product interest and message content</li>
            <li>Chat messages sent to our AI assistant</li>
          </ul>
          <p className="text-limac-muted leading-relaxed mt-3">
            We also automatically collect standard server logs (IP address, browser type, pages visited)
            for security and analytics purposes.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">3. How We Use Your Information</h2>
          <ul className="text-limac-muted leading-relaxed space-y-2 pl-5 list-disc">
            <li>To respond to your product enquiries and sales queries</li>
            <li>To send confirmation emails when you submit an enquiry</li>
            <li>To improve our website and understand customer interest</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="text-limac-muted leading-relaxed mt-3">
            We do <strong className="text-white">not</strong> sell or rent your personal information
            to third parties.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">4. Sharing of Information</h2>
          <p className="text-limac-muted leading-relaxed">
            We may share your data with the following service providers solely to operate our website:
          </p>
          <ul className="text-limac-muted leading-relaxed space-y-2 pl-5 list-disc mt-3">
            <li><strong className="text-white">Resend</strong> — transactional email delivery</li>
            <li><strong className="text-white">Anthropic</strong> — AI-powered chat responses (no personal data stored by Anthropic beyond the session)</li>
            <li><strong className="text-white">MongoDB Atlas</strong> — secure cloud database hosting</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">5. Data Retention</h2>
          <p className="text-limac-muted leading-relaxed">
            Enquiry records are retained for up to 2 years for business purposes and then deleted. You may
            request deletion of your data at any time by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">6. Cookies</h2>
          <p className="text-limac-muted leading-relaxed">
            We use only essential session cookies required to operate the website. We do not use
            advertising or tracking cookies. No consent banner is required.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">7. Your Rights</h2>
          <p className="text-limac-muted leading-relaxed">
            You have the right to access, correct, or delete your personal data held by us. To exercise
            these rights, please email us at{' '}
            <a href="mailto:info@limac.in" className="text-limac-cyan hover:underline">
              info@limac.in
            </a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">8. Security</h2>
          <p className="text-limac-muted leading-relaxed">
            We implement industry-standard security measures including HTTPS encryption and access
            controls to protect your data. No method of transmission over the internet is 100% secure,
            but we strive to protect your information to the best of our ability.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">9. Changes to This Policy</h2>
          <p className="text-limac-muted leading-relaxed">
            We may update this policy from time to time. The "Last updated" date at the top will reflect
            any changes. Continued use of the site after changes constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-limac-cyan mb-3">10. Contact Us</h2>
          <p className="text-limac-muted leading-relaxed">
            For any privacy-related questions, please contact:
          </p>
          <address className="text-limac-muted not-italic mt-3 space-y-1">
            <p className="text-white font-semibold">Limac Power Tech</p>
            <p>{LIMAC.address.line1}, {LIMAC.address.line2}</p>
            <p>{LIMAC.address.city}, {LIMAC.address.state} - {LIMAC.address.pincode}, {LIMAC.address.country}</p>
            <p>
              <a href={`mailto:${LIMAC.email.info}`} className="text-limac-cyan hover:underline">{LIMAC.email.info}</a>
            </p>
            <p>
              <a href={`tel:${LIMAC.phone.primary.replace(/\s/g, '')}`} className="text-limac-cyan hover:underline">{LIMAC.phone.primary}</a>
            </p>
          </address>
        </div>
      </section>
    </main>
  )
}
