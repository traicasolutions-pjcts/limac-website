import { Shield, Award, HeadphonesIcon, IndianRupee } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'

const TRUST_POINTS = [
  {
    icon: Award,
    title: 'Premium Quality',
    description:
      'Every battery undergoes strict quality control with Grade A LiFePO4 cells. We source only the best chemistry for consistent, reliable performance.',
    stat: 'Grade A Cells',
  },
  {
    icon: Shield,
    title: 'Solid Warranty',
    description:
      'Full 3 to 5-year warranty on solar batteries and 2 years on motorcycle batteries. We back our products because we know they last.',
    stat: '3 to 5-Year Coverage',
  },
  {
    icon: HeadphonesIcon,
    title: 'Expert Support',
    description:
      'Our technical team in Thrissur provides pre-sales consultation, installation guidance, and post-sales support in Malayalam, Tamil, and English.',
    stat: 'Local Support',
  },
  {
    icon: IndianRupee,
    title: 'Best Value',
    description:
      'Direct manufacturer pricing with no middlemen. Get premium LiFePO4 technology at competitive prices with flexible options for every budget.',
    stat: 'Factory Prices',
  },
]

export default function WhyChooseLimac() {
  return (
    <section className="bg-limac-navy py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          badge="Why Limac"
          title="The Limac Advantage"
          subtitle="We don't just sell batteries — we provide complete LiFePO4 power solutions backed by local expertise and genuine after-sales support."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRUST_POINTS.map((point, index) => {
            const Icon = point.icon
            return (
              <div
                key={index}
                className="relative bg-limac-black border border-gray-800 hover:border-limac-green/40 rounded-2xl p-6 card-hover group overflow-hidden"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-limac-green/0 to-limac-green/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 bg-limac-green/10 border border-limac-green/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-limac-green/20 transition-colors">
                    <Icon size={22} className="text-limac-green" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block bg-limac-green/10 text-limac-green text-xs font-bold px-2.5 py-1 rounded-full border border-limac-green/20 mb-3">
                      {point.stat}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">{point.title}</h3>
                    <p className="text-limac-muted text-sm leading-relaxed">{point.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
