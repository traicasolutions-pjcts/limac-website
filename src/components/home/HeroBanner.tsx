import Link from 'next/link'
import { ArrowRight, Zap, Shield } from 'lucide-react'
import { LIMAC } from '@/lib/constants'

export default function HeroBanner() {
  return (
    <section className="relative flex items-center overflow-hidden bg-limac-black lg:min-h-screen">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(57,210,80,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,210,80,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,100,180,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(57,210,80,0.08),transparent_60%)]" />

      {/* Decorative orb */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-limac-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-limac-green/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-10 lg:pt-28 lg:pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-limac-green/10 border border-limac-green/30 rounded-full px-4 py-1.5 mb-6">
              <Zap size={13} className="text-limac-green" fill="currentColor" />
              <span className="text-limac-green text-xs font-semibold tracking-wide uppercase">
                Kerala&apos;s #1 LiFePO4 Battery Specialist
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Power Your World with{' '}
              <span className="gradient-text">LiFePO4</span>{' '}
              Technology
            </h1>

            <p className="text-limac-muted text-lg leading-relaxed mb-8 max-w-lg">
              Limac Power Tech delivers premium lithium iron phosphate batteries for solar
              storage, Electric scooters, Commercial systems and residential systems. Trusted by 50,000+ customers
              across Kerala since 2018.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                '✓ 6000+ Cycle Life',
                '✓ 3 to 5-Year Warranty',
                '✓ Built-in BMS',
                '✓ ISO Certified',
              ].map((badge) => (
                <span
                  key={badge}
                  className="text-limac-muted text-sm bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-limac-green hover:bg-green-400 text-limac-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Explore Products
                <ArrowRight size={18} />
              </Link>
              <a
                href={`https://wa.me/${LIMAC.whatsapp}?text=Hi%20Limac%2C%20I%20need%20a%20quote%20for%20LiFePO4%20batteries.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-limac-green/40 text-limac-green hover:bg-limac-green/10 font-semibold px-6 py-3 rounded-lg transition-all duration-200"
              >
                Get a Quote
              </a>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[21rem] sm:max-w-sm lg:max-w-md aspect-square">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-limac-green/10 animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-limac-cyan/10 animate-[spin_20s_linear_infinite_reverse]" />

              {/* Center battery visual */}
              <div className="absolute inset-8 sm:inset-10 lg:inset-12 bg-gradient-to-br from-gray-900 to-limac-black rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-4 lg:p-6">
                <div className="w-10 h-16 sm:w-12 sm:h-20 lg:w-16 lg:h-24 relative mb-2 lg:mb-4 battery-charge-shell">
                  <div className="absolute inset-0 bg-limac-green/10 border-2 border-limac-green rounded-lg shadow-[0_0_22px_rgba(180,230,50,0.2)]" />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 lg:w-6 h-1.5 lg:h-2 bg-limac-green rounded-sm -mt-2" />
                  <div className="battery-charge-fill absolute bottom-1 left-1 right-1 rounded-b-md bg-gradient-to-t from-limac-green to-limac-green/45" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={24} className="battery-charge-zap h-4 w-4 lg:h-6 lg:w-6 text-limac-green" fill="currentColor" />
                  </div>
                  <div className="battery-charge-spark absolute -right-3 lg:-right-4 top-5 lg:top-7 h-1.5 lg:h-2 w-1.5 lg:w-2 rounded-full bg-limac-green" />
                </div>
                <div className="text-center">
                  <div className="text-limac-green font-bold text-xl lg:text-2xl">LiFePO4</div>
                  <div className="text-limac-muted text-[11px] lg:text-xs mt-1">Lithium Iron Phosphate</div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 lg:gap-3 mt-4 lg:mt-6 w-full">
                  {[
                    { label: 'Cycle Life', value: '6000+' },
                    { label: 'Efficiency', value: '98%' },
                    { label: 'Warranty', value: '5 Yrs' },
                    { label: 'DOD', value: '80%' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-black/50 rounded-lg px-2 py-1.5 lg:p-2 text-center border border-gray-800">
                      <div className="text-white font-bold text-xs lg:text-sm">{stat.value}</div>
                      <div className="text-limac-muted text-[10px]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute top-5 right-2 lg:top-6 lg:right-0 bg-limac-navy border border-gray-700 rounded-xl px-2.5 lg:px-3 py-1.5 lg:py-2 text-center shadow-lg">
                <Shield size={14} className="text-limac-green mx-auto mb-1" />
                <div className="text-white text-[11px] lg:text-xs font-semibold">Safe</div>
                <div className="text-limac-muted text-[9px] lg:text-[10px]">Chemistry</div>
              </div>
              <div className="absolute bottom-7 left-2 lg:bottom-12 lg:left-0 bg-limac-navy border border-gray-700 rounded-xl px-2.5 lg:px-3 py-1.5 lg:py-2 text-center shadow-lg">
                <div className="text-limac-green text-sm lg:text-lg font-bold">50,000+</div>
                <div className="text-limac-muted text-[9px] lg:text-[10px]">Installs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-6 lg:mt-16 flex justify-center">
          <div className="flex flex-col items-center gap-2 text-limac-muted text-xs animate-bounce">
            <span>Scroll to explore</span>
            <div className="w-px h-8 bg-gradient-to-b from-limac-green/50 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
