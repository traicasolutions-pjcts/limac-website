// src/lib/constants.ts
export const LIMAC = {
  name: 'Limac Power Tech',
  tagline: "Kerala's Trusted LiFePO4 Battery Specialists",
  founded: 2018,
  phone: {
    primary: '+91 99958 11159',
    secondary: '+91 82899 78663',
    tertiary: '+91 97466 11159',
  },
  whatsapp: '919995811159',
  email: {
    info: 'info@limac.in',
    sales: 'sales@limac.in',
  },
  address: {
    line1: 'Mother Gardens, Private Industrial Zone',
    line2: 'Puthenkulam Road, Edakunny, Ollur',
    city: 'Thrissur',
    state: 'Kerala',
    pincode: '680306',
    country: 'India',
  },
  social: {
    facebook: 'https://facebook.com/limacpowertech',
  },
  maps: 'https://maps.google.com/?q=Limac+Power+Tech+Thrissur+Kerala',
} as const

export const PRODUCT_CATEGORIES = [
  { label: 'Solar Storage', value: 'solar-storage', description: 'LiFePO4 packs for solar systems', icon: '☀️' },
  { label: 'E Scooter', value: 'escooter', description: 'Battery packs for electric scooters', icon: 'EV' },
  { label: 'Customized Battery Packs', value: 'customized batterys packs', description: 'Custom lithium battery packs', icon: 'Li' },
  { label: 'Motorcycle Batteries', value: 'motorcycle', description: 'CCA starter batteries', icon: '🏍️' },
  { label: '12V Series', value: '12v-series', description: 'Deep cycle range', icon: '⚡' },
  { label: 'LiFePO4 Lighting', value: 'lifepo4-lighting', description: 'Lighting systems', icon: '💡' },
] as const

export const BLOG_CATEGORIES = [
  { label: 'Solar Storage', value: 'solar-storage' },
  { label: 'Battery Technology', value: 'battery-tech' },
  { label: 'Installation Guides', value: 'installation' },
  { label: 'Industry News', value: 'news' },
] as const

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Products', href: '/products' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
] as const

export const STATS = [
  { value: '2018', label: 'Founded' },
  { value: '500+', label: 'Installations' },
  { value: '4', label: 'Product Lines' },
  { value: '100%', label: 'Kerala-Trusted' },
] as const

export const TESTIMONIALS = [
  {
    name: 'Arun Krishnan',
    location: 'Thrissur, Kerala',
    text: 'Limac Power Tech installed a 100AH LiFePO4 battery for my solar system. Exceptional quality and service. The battery has been performing flawlessly for over 2 years now.',
    rating: 5,
  },
  {
    name: 'Sreeja Nair',
    location: 'Ernakulam, Kerala',
    text: 'Switched from lead-acid to Limac\'s LiFePO4 batteries for our residential solar setup. Significant improvement in efficiency and the team\'s support was outstanding throughout the process.',
    rating: 5,
  },
  {
    name: 'Rajeev Menon',
    location: 'Kozhikode, Kerala',
    text: 'Best motorcycle battery I\'ve ever used. Lightweight, powerful cranking, and no maintenance. Limac is the go-to for quality lithium batteries in Kerala.',
    rating: 5,
  },
] as const

export const FEATURED_PRODUCTS_STATIC = [
  {
    id: '1',
    name: '12V 100AH LiFePO4 Solar Battery',
    slug: '12v-100ah-lifepo4-solar-battery',
    category: 'solar-storage' as const,
    shortDescription: 'High-performance solar storage battery with 2000+ cycle life, ideal for residential and commercial solar systems.',
    specsGroup: {
      voltage: '12.8V',
      capacity: '100AH',
      weight: '11.5kg',
      dimensions: '330 × 172 × 215mm',
      cycleLife: '2000+ cycles',
      warranty: '3 Years',
      operatingTemp: '-20°C to 60°C',
      application: 'Solar Storage, Inverter Backup',
    },
    featured: true,
    status: 'published' as const,
  },
  {
    id: '2',
    name: '12V 200AH LiFePO4 Deep Cycle Battery',
    slug: '12v-200ah-lifepo4-deep-cycle',
    category: 'solar-storage' as const,
    shortDescription: 'Large-capacity deep cycle battery for extended solar storage and off-grid systems.',
    specsGroup: {
      voltage: '12.8V',
      capacity: '200AH',
      weight: '22kg',
      dimensions: '520 × 238 × 218mm',
      cycleLife: '2000+ cycles',
      warranty: '3 Years',
      operatingTemp: '-20°C to 60°C',
      application: 'Solar Storage, Off-Grid Systems',
    },
    featured: true,
    status: 'published' as const,
  },
  {
    id: '3',
    name: 'LiFePO4 Motorcycle Starter Battery',
    slug: 'lifepo4-motorcycle-starter-battery',
    category: 'motorcycle' as const,
    shortDescription: 'Lightweight lithium starter battery with high CCA rating for all motorcycle types.',
    specsGroup: {
      voltage: '12.8V',
      capacity: '5AH',
      weight: '0.7kg',
      dimensions: '114 × 38 × 85mm',
      cycleLife: '1500+ cycles',
      warranty: '2 Years',
      operatingTemp: '-20°C to 55°C',
      application: 'Motorcycle, Scooter, ATV',
    },
    featured: true,
    status: 'published' as const,
  },
  {
    id: '4',
    name: '24V 100AH LiFePO4 Battery Pack',
    slug: '24v-100ah-lifepo4-battery-pack',
    category: '12v-series' as const,
    shortDescription: '24V system battery pack for larger solar installations and industrial applications.',
    specsGroup: {
      voltage: '25.6V',
      capacity: '100AH',
      weight: '23kg',
      dimensions: '520 × 238 × 218mm',
      cycleLife: '2000+ cycles',
      warranty: '3 Years',
      operatingTemp: '-20°C to 60°C',
      application: 'Solar, Industrial, UPS',
    },
    featured: true,
    status: 'published' as const,
  },
  {
    id: '5',
    name: 'LiFePO4 Street Light Battery',
    slug: 'lifepo4-street-light-battery',
    category: 'lifepo4-lighting' as const,
    shortDescription: 'Dedicated LiFePO4 battery for solar street lights with built-in BMS protection.',
    specsGroup: {
      voltage: '12.8V',
      capacity: '30AH',
      weight: '4.2kg',
      dimensions: '195 × 130 × 168mm',
      cycleLife: '2000+ cycles',
      warranty: '2 Years',
      operatingTemp: '-20°C to 60°C',
      application: 'Solar Street Light, Garden Light',
    },
    featured: true,
    status: 'published' as const,
  },
  {
    id: '6',
    name: '48V 50AH LiFePO4 Battery Pack',
    slug: '48v-50ah-lifepo4-battery-pack',
    category: 'solar-storage' as const,
    shortDescription: '48V battery pack for hybrid solar inverters and telecom backup applications.',
    specsGroup: {
      voltage: '51.2V',
      capacity: '50AH',
      weight: '28kg',
      dimensions: '520 × 260 × 220mm',
      cycleLife: '2000+ cycles',
      warranty: '3 Years',
      operatingTemp: '-20°C to 60°C',
      application: 'Hybrid Solar, Telecom, UPS',
    },
    featured: true,
    status: 'published' as const,
  },
] as const

export const BLOG_POSTS_STATIC = [
  {
    id: '1',
    title: 'LiFePO4 vs Lead Acid Batteries — A Complete Comparison',
    slug: 'lifepo4-vs-lead-acid-batteries-comparison',
    category: 'battery-tech' as const,
    excerpt: 'When setting up a power backup system for your home or solar project, choosing the right battery technology is crucial. We compare LiFePO4 and lead-acid batteries across all key metrics.',
    publishedDate: '2025-06-01',
    status: 'published' as const,
  },
  {
    id: '2',
    title: 'How to Size Your Solar Battery Bank for Kerala Homes',
    slug: 'size-solar-battery-bank-kerala-homes',
    category: 'installation' as const,
    excerpt: 'Calculating the right battery capacity for your solar system in Kerala is essential for energy independence. This guide walks you through the exact steps to get it right.',
    publishedDate: '2025-05-15',
    status: 'published' as const,
  },
  {
    id: '3',
    title: 'Benefits of LiFePO4 Batteries for Motorcycle Use',
    slug: 'benefits-lifepo4-batteries-motorcycle-use',
    category: 'battery-tech' as const,
    excerpt: 'Switching your motorcycle to a LiFePO4 lithium battery brings massive advantages — lighter weight, faster cranking, longer life. Here\'s everything you need to know.',
    publishedDate: '2025-04-20',
    status: 'published' as const,
  },
] as const
