import type { Metadata } from 'next'
import { CheckCircle, Users, Award, MapPin, Phone, Mail } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import { LIMAC } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Limac Power Tech — Kerala\'s trusted LiFePO4 battery specialists based in Thrissur since 2018. Our story, mission, and commitment to quality.',
  openGraph: {
    title: 'About Limac Power Tech',
    description: "Kerala's leading LiFePO4 battery company, providing premium lithium batteries since 2018.",
    images: [{ url: '/og-image.jpg' }],
    siteName: 'Limac Power Tech',
  },
}

const MILESTONES = [
  { year: '2018', event: 'Founded in Thrissur, Kerala — started with solar storage batteries.' },
  { year: '2019', event: 'Expanded into Electric scooter LiFePO4 batteries — Kerala first.' },
  { year: '2020', event: 'Launched 12V Series deep cycle battery line for inverters and UPS.' },
  { year: '2021', event: 'Reached 200+ installations — trusted name in South Kerala.' },
  { year: '2022', event: 'Introduced LiFePO4 Lighting series for solar street lights.' },
  { year: '2024', event: 'Crossed 50,000+ installations across Kerala.' },
]

const VALUES = [
  { title: 'Quality First', description: 'Only Grade A LiFePO4 cells, rigorous testing, and genuine BMS protection.' },
  { title: 'Customer Focus', description: 'Pre-sales consultation, installation support, and after-sales service in your language.' },
  { title: 'Local Expertise', description: 'Deep knowledge of Kerala\'s climate, power landscape, and solar conditions.' },
  { title: 'Transparency', description: 'Honest pricing, clear specs, no hidden costs — what you see is what you get.' },
]

export default function AboutPage() {
  return (
    <div className="bg-limac-black pt-24">
      {/* Hero */}
      <section className="py-16 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-limac-green/10 border border-limac-green/30 text-limac-green text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                About Us
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
                Kerala&apos;s Trusted{' '}
                <span className="gradient-text">LiFePO4 Battery</span>{' '}
                Specialists
              </h1>
              <p className="text-limac-muted text-lg leading-relaxed mb-6">
                Limac Power Tech was founded in 2018 in Thrissur, Kerala, with a clear mission:
                to bring world-class lithium iron phosphate battery technology to South India at
                accessible prices, backed by genuine local expertise and support.
              </p>
              <p className="text-limac-muted leading-relaxed">
                The demand for battery power is surging — Energy storage, solar equipment,
                EV scooters, and industrial machinery are all moving to lithium. As the world
                transitions to cleaner technologies, LiFePO4 is perfectly positioned to replace
                fossil fuel dependency. Limac is here to power that transition in Kerala.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '2018', label: 'Founded', sub: 'Thrissur, Kerala' },
                { value: '50,000+', label: 'Installations', sub: 'Across Kerala' },
                { value: '4', label: 'Product Lines', sub: 'Solar, Moto, 12V, Lighting' },
                { value: '5 Yrs', label: 'Warranty', sub: 'On Solar Batteries' },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
                  <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                  <div className="text-white font-semibold text-sm">{stat.label}</div>
                  <div className="text-limac-muted text-xs mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story / Mission */}
      <section className="py-16 px-4 bg-limac-navy border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            badge="Our Mission"
            title="Why We Started"
            highlight="Limac"
            subtitle="The story of how Limac Power Tech came to be Kerala's go-to LiFePO4 battery company."
            centered
          />
          <div className="max-w-3xl mx-auto text-limac-muted leading-relaxed space-y-4 text-base">
            <p>
              When Limac was founded in Thrissur in 2018, lead-acid batteries still dominated
              Kerala&apos;s solar storage and inverter market. But lithium iron phosphate technology
              was making waves globally — longer life, safer chemistry, lighter weight, and
              dramatically better performance.
            </p>
            <p>
              The problem? LiFePO4 batteries were expensive and hard to find locally. When you
              needed support, you were on your own. Limac was built to solve this — to bring
              genuine Grade A LiFePO4 cells to Kerala homeowners, solar installers, and
              Electric scooter enthusiasts, backed by real local support from our Thrissur team.
            </p>
            <p>
              Today, we&apos;ve completed 50,000+ successful battery installations across Kerala.
              We speak your language — literally. Our team assists customers in Malayalam,
              Tamil, and English, and we&apos;re just a WhatsApp message away.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 border-b border-gray-800">
        <div className="max-w-6xl mx-auto">
          <SectionHeader badge="Our Values" title="What We Stand For" centered />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((val) => (
              <div key={val.title} className="bg-gray-900 border border-gray-800 hover:border-limac-green/40 rounded-xl p-5 card-hover">
                <CheckCircle size={22} className="text-limac-green mb-3" />
                <h3 className="text-white font-bold text-sm mb-2">{val.title}</h3>
                <p className="text-limac-muted text-sm leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 bg-limac-navy border-b border-gray-800">
        <div className="max-w-3xl mx-auto">
          <SectionHeader badge="Our Journey" title="Milestones" centered />
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-limac-green to-transparent" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-6 pl-12 relative">
                  <div className="absolute left-3.5 top-1.5 w-3 h-3 bg-limac-green rounded-full border-2 border-limac-black -translate-x-1.5" />
                  <div>
                    <div className="text-limac-green font-bold text-sm mb-1">{m.year}</div>
                    <p className="text-limac-muted text-sm leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact info */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <SectionHeader badge="Visit Us" title="Find Limac Power Tech" centered />
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-left grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-limac-green mt-0.5 shrink-0" />
                <address className="not-italic text-limac-muted text-sm leading-relaxed">
                  {LIMAC.address.line1},<br />
                  {LIMAC.address.line2},<br />
                  {LIMAC.address.city}, {LIMAC.address.state} — {LIMAC.address.pincode}
                </address>
              </div>
            </div>
            <div className="space-y-3">
              {[LIMAC.phone.primary, LIMAC.phone.secondary, LIMAC.phone.tertiary].map((p) => (
                <a key={p} href={`tel:${p}`} className="flex items-center gap-2 text-limac-muted hover:text-limac-green text-sm transition-colors">
                  <Phone size={14} className="text-limac-green" />
                  {p}
                </a>
              ))}
              <a href={`mailto:${LIMAC.email.info}`} className="flex items-center gap-2 text-limac-muted hover:text-limac-green text-sm transition-colors">
                <Mail size={14} className="text-limac-green" />
                {LIMAC.email.info}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
