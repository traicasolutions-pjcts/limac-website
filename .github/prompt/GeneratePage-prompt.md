# GitHub Copilot Instructions — Limac Power Tech Website

You are helping build the official website for **Limac Power Tech**, a LiFePO4 battery company
based in Thrissur, Kerala, India. Follow every instruction in this file precisely for all
code suggestions, completions, and generations.

---

## 1. PROJECT IDENTITY

| Field            | Value                                                          |
|------------------|----------------------------------------------------------------|
| Company          | Limac Power Tech                                               |
| Tagline          | Kerala's Trusted LiFePO4 Battery Specialists                   |
| Founded          | 2018                                                           |
| Location         | Thrissur, Kerala, India — 680306                               |
| Phone            | +91 99958 11159, +91 82899 78663, +91 97466 11159              |
| Email            | info@limac.in, sales@limac.in                                  |
| Domain           | limac.in                                                       |
| WhatsApp         | +91 99958 11159                                                |
| Specialisation   | LiFePO4 batteries for solar, Electric scooters, residential use      |

---

## 2. TECH STACK — NEVER DEVIATE FROM THIS

```
Frontend     →  Next.js 14 (App Router, TypeScript)
Admin Panel  →  Payload CMS 2.0
Database     →  MongoDB Atlas (via Mongoose)
Styling      →  Tailwind CSS
Hosting      →  Vercel (staging + production)
Chatbot      →  Anthropic Claude API (claude-sonnet-4-6)
Email        →  Resend
Forms        →  React Hook Form
Icons        →  Lucide React
```

**Never suggest:**
- WordPress, WooCommerce, or any PHP solution
- Prisma or PostgreSQL (use MongoDB only)
- Pages Router (use App Router only)
- Class components (use functional components with hooks only)
- `any` TypeScript type (always type properly)
- Inline styles where Tailwind class exists

---

## 3. PROJECT FOLDER STRUCTURE

Always generate files in the correct location:

```
limac-website/
├── .github/
│   └── copilot-instructions.md        ← this file
├── src/
│   ├── app/                           ← Next.js App Router
│   │   ├── layout.tsx                 ← Root layout — includes WhatsApp + ChatBot
│   │   ├── page.tsx                   ← Homepage
│   │   ├── (site)/                    ← Public site route group
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           ← All products listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       ← Single product page
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx           ← Blog listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       ← Single blog post
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── solutions/
│   │   │   │   └── page.tsx
│   │   │   ├── careers/
│   │   │   │   └── page.tsx
│   │   │   └── contact/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts           ← Claude chatbot streaming endpoint
│   │       ├── enquiry/
│   │       │   └── route.ts           ← Form submission → Payload + Resend
│   │       └── products/
│   │           └── route.ts           ← Products API (if needed)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             ← Site navigation
│   │   │   ├── Footer.tsx             ← Site footer
│   │   │   └── MobileMenu.tsx         ← Mobile hamburger menu
│   │   ├── home/
│   │   │   ├── HeroBanner.tsx         ← Hero section with CTA
│   │   │   ├── StatsBar.tsx           ← Since 2018, X installs, etc.
│   │   │   ├── ProductCategories.tsx  ← 3 category tiles
│   │   │   ├── WhyChooseLimac.tsx     ← 4 trust points
│   │   │   ├── FeaturedProducts.tsx   ← Homepage product grid
│   │   │   ├── LatestBlogPosts.tsx    ← 3 recent blog cards
│   │   │   ├── Testimonials.tsx       ← Customer quotes
│   │   │   └── ContactStrip.tsx       ← Bottom CTA with WhatsApp
│   │   ├── products/
│   │   │   ├── ProductCard.tsx        ← Product grid card
│   │   │   ├── ProductGrid.tsx        ← Grid wrapper with filters
│   │   │   ├── ProductSpecs.tsx       ← Specs table component
│   │   │   └── ProductImageGallery.tsx← Image gallery for product page
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx
│   │   │   └── BlogGrid.tsx
│   │   ├── forms/
│   │   │   └── EnquiryForm.tsx        ← React Hook Form enquiry form
│   │   ├── chat/
│   │   │   └── ChatBot.tsx            ← Floating AI chatbot widget
│   │   └── common/
│   │       ├── WhatsAppButton.tsx     ← Floating WhatsApp button
│   │       ├── SectionHeader.tsx      ← Reusable section title + subtitle
│   │       └── Badge.tsx              ← Category / status badge
│   ├── lib/
│   │   ├── payload.ts                 ← Payload API helper functions
│   │   ├── utils.ts                   ← Shared utilities (cn, formatDate etc.)
│   │   └── constants.ts               ← Site-wide constants
│   └── payload/
│       ├── payload.config.ts          ← Payload CMS root config
│       └── collections/
│           ├── Products.ts
│           ├── BlogPosts.ts
│           ├── Enquiries.ts
│           ├── Media.ts
│           └── Users.ts
├── public/
│   ├── logo.png                       ← Limac logo (transparent PNG)
│   └── favicon.ico
├── .env.example                       ← Template for env variables
├── .env.local                         ← Actual secrets (git-ignored)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. BRAND DESIGN SYSTEM

Always use these exact values for any styling decisions:

### Colours
```ts
// tailwind.config.ts — extend with these
colors: {
  limac: {
    black:     '#0A0A0F',  // Background — deep black
    navy:      '#05142D',  // Hero secondary background
    blue:      '#0064B4',  // Blue glow / accent
    cyan:      '#00B4DC',  // Electric cyan highlight
    green:     '#39D250',  // PRIMARY — CTA buttons, WhatsApp
    'green-logo': '#B4E632', // Logo stripe yellow-green
    white:     '#FFFFFF',  // Primary text
    muted:     '#D2DCEB',  // Secondary text / subheadings
  }
}
```

### Typography
- Font: `Inter` (Google Fonts) — or system sans-serif fallback
- Hero H1: `text-4xl md:text-6xl font-bold text-white`
- Section H2: `text-3xl font-bold text-white`
- Body: `text-base text-limac-muted leading-relaxed`
- CTA Button: `bg-limac-green text-limac-black font-semibold px-6 py-3 rounded-lg`

### Component Patterns
```tsx
// Primary CTA button — always this pattern
<button className="bg-limac-green hover:bg-green-400 text-limac-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
  Get Started
</button>

// Section container — always this wrapper
<section className="bg-limac-black py-16 px-4">
  <div className="max-w-6xl mx-auto">
    {/* content */}
  </div>
</section>

// Product card — dark card style
<div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-limac-green transition-colors duration-200">
```

---

## 5. PAYLOAD CMS RULES

### Collections already defined — do not redefine, only extend:
- `products` — LiFePO4 battery products
- `blog-posts` — Articles and guides
- `enquiries` — Contact form submissions
- `media` — Uploaded images
- `users` — Admin and editor accounts

### When adding a new Payload collection:
```ts
// Always follow this pattern
import { CollectionConfig } from 'payload/types'

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  admin: {
    useAsTitle: 'name',           // Always set this
    description: 'Clear description for non-tech staff',
  },
  access: {
    read: () => true,             // Public collections always readable
  },
  fields: [
    // All fields must have clear labels and admin.placeholder text
    // Staff are non-technical — labels must be plain English
  ],
}
```

### Field label rules for non-technical staff:
- ALWAYS add `label:` in plain English (not camelCase field names)
- ALWAYS add `admin.placeholder` with a real example value
- ALWAYS add `admin.description` for any non-obvious field
- NEVER use technical jargon in labels

### Access control pattern:
```ts
access: {
  read: () => true,                              // Public content
  create: ({ req: { user } }) => !!user,         // Must be logged in
  update: ({ req: { user } }) => !!user,
  delete: ({ req: { user } }) => user?.role === 'admin', // Admin only
},
```

---

## 6. API ROUTES

### Chat endpoint (`src/app/api/chat/route.ts`)
- Model: `claude-sonnet-4-6` — never change this
- Always stream responses using `ReadableStream`
- Max tokens: 500 (keep chatbot concise)
- System prompt must reference all current Limac products and contact details
- Handle errors gracefully — fallback message must include Limac phone number

```ts
// Always use this streaming pattern
const stream = await client.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 500,
  system: LIMAC_SYSTEM_PROMPT,
  messages: validatedMessages,
})

const readable = new ReadableStream({
  async start(controller) {
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        controller.enqueue(new TextEncoder().encode(chunk.delta.text))
      }
    }
    controller.close()
  },
})
```

### Enquiry endpoint (`src/app/api/enquiry/route.ts`)
- Save to Payload `enquiries` collection first
- Send notification email to `info@limac.in` and `sales@limac.in` via Resend
- Send confirmation email to customer if email provided
- Always include WhatsApp link in confirmation email: `https://wa.me/919995811159`

### All API routes must:
- Validate input before processing
- Return `{ success: true }` or `{ error: 'message' }` JSON
- Use try/catch with proper error logging
- Never expose internal error details to client

---

## 7. COMPONENT PATTERNS

### All components must:
- Be TypeScript with proper interface definitions
- Use `'use client'` directive only when using hooks or browser events
- Prefer server components (no directive) for data-fetching components
- Export as default export

### Data fetching from Payload (server components):
```ts
// src/lib/payload.ts helper — use this pattern
async function getProducts(category?: string) {
  const params = new URLSearchParams({
    'where[status][equals]': 'published',
    limit: '100',
    ...(category && { 'where[category][equals]': category }),
  })

  const res = await fetch(
    `${process.env.PAYLOAD_URL}/api/products?${params}`,
    { next: { revalidate: 60 } } // Revalidate every 60 seconds
  )

  if (!res.ok) throw new Error('Failed to fetch products')
  const data = await res.json()
  return data.docs
}
```

### EnquiryForm component rules:
- Always use `react-hook-form`
- Always show inline validation errors
- Show success state after submission (do not redirect)
- Always include WhatsApp as alternative contact
- Phone field is required, email is optional

### ChatBot component rules:
- Floating button at `bottom-right` of screen
- Z-index: 1001 (above WhatsApp button)
- WhatsApp button sits at z-index: 999
- Chat window: 340px wide, 460px tall
- Dark theme matching Limac brand: `bg-[#0A0A0F]`
- Stream responses character by character for better UX
- Show typing indicator `...` while waiting for first token

---

## 8. PAGES — REQUIRED SECTIONS

### Homepage (`src/app/page.tsx`) — sections in order:
1. `<Navbar />` — sticky, dark background
2. `<HeroBanner />` — full-width, headline + subtext + "Get Quote" CTA
3. `<StatsBar />` — "Since 2018 | Kerala-based | 50,000+ installations | ISO certified"
4. `<ProductCategories />` — 3 visual tiles: Solar Storage, Electric scooter, 12V Series
5. `<WhyChooseLimac />` — 4 cards: Quality, Warranty, Support, Price
6. `<FeaturedProducts />` — fetches `featured: true` products from Payload
7. `<LatestBlogPosts />` — fetches 3 latest published posts from Payload
8. `<Testimonials />` — 3 hardcoded customer quotes
9. `<ContactStrip />` — dark strip with phone + WhatsApp button + quick form
10. `<Footer />` — links, address, social icons

### Product listing (`src/app/(site)/products/page.tsx`):
- Fetch all published products from Payload API
- Filter by category (query param `?category=solar-storage`)
- Display in responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
- Each card: image, name, key spec (voltage + capacity), "View Details" button

### Single product (`src/app/(site)/products/[slug]/page.tsx`):
- `generateStaticParams` for all product slugs
- `generateMetadata` using product name and description
- Image gallery (main + thumbnails)
- Full specs table from `specsGroup` fields
- Rich text description
- `<EnquiryForm productName={product.name} />` below specs
- Related products (same category, exclude current)

### Contact page (`src/app/(site)/contact/page.tsx`):
- `<EnquiryForm />` on left
- Contact details on right: 3 phone numbers (clickable `tel:` links), email, address
- Embedded Google Map: Thrissur, Kerala location
- WhatsApp CTA button linking to `https://wa.me/919995811159`

---

## 9. SEO REQUIREMENTS

Every page must export `generateMetadata`:

```ts
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Page Title | Limac Power Tech',
    description: 'Description under 160 characters mentioning LiFePO4, Kerala, battery.',
    openGraph: {
      title: 'Page Title',
      description: '...',
      images: [{ url: '/og-image.jpg' }],
      siteName: 'Limac Power Tech',
    },
  }
}
```

### Target SEO keywords to include naturally:
- "LiFePO4 battery Kerala"
- "solar battery Thrissur"
- "lithium battery Kerala"
- "12V 100AH LiFePO4"
- "solar storage battery India"

---

## 10. ENVIRONMENT VARIABLES

All env variables used in code — never hardcode these values:

```ts
// Database
process.env.MONGODB_URI           // MongoDB Atlas connection string

// Payload CMS
process.env.PAYLOAD_SECRET        // Payload secret key
process.env.PAYLOAD_URL           // e.g. http://localhost:3000
process.env.PAYLOAD_API_KEY       // For server-to-server API calls

// Anthropic (Chatbot)
process.env.ANTHROPIC_API_KEY     // Claude API key

// Resend (Email)
process.env.RESEND_API_KEY        // Resend API key

// Site
process.env.NEXT_PUBLIC_SITE_URL  // Public — accessible in client code
```

**Rule:** If a new env variable is needed, add it to `.env.example` with a comment
explaining where to get the value.

---

## 11. TYPESCRIPT TYPES

Always define proper types. Common types for this project:

```ts
// Product type (from Payload)
interface Product {
  id: string
  name: string
  slug: string
  category: 'solar-storage' | 'Electric scooter' | '12v-series' | 'lifepo4-lighting'
  shortDescription: string
  description: any // Payload rich text (Slate)
  specsGroup: {
    voltage: string
    capacity: string
    weight: string
    dimensions: string
    cycleLife: string
    warranty: string
    operatingTemp: string
    application: string
  }
  images: Array<{
    image: { url: string; alt: string }
    alt: string
  }>
  status: 'published' | 'draft'
  featured: boolean
}

// Blog post type
interface BlogPost {
  id: string
  title: string
  slug: string
  category: 'solar-storage' | 'battery-tech' | 'installation' | 'news'
  excerpt: string
  content: any // Payload rich text
  featuredImage: { url: string; alt: string }
  status: 'published' | 'draft'
  publishedDate: string
}

// Enquiry form data
interface EnquiryFormData {
  name: string
  phone: string
  email?: string
  productInterest?: string
  message?: string
}

// Chat message
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
```

---

## 12. GIT COMMIT CONVENTIONS

When suggesting commit messages, always use:
```
feat: add product detail page with specs table
fix: correct WhatsApp phone number format
style: update hero section to match Limac brand colours
chore: add RESEND_API_KEY to .env.example
docs: update README with deployment steps
```

---

## 13. THINGS COPILOT MUST NEVER DO

- Never suggest `console.log` in production code — use `console.error` for errors only
- Never use `<img>` — always use Next.js `<Image>` from `next/image`
- Never use `<a>` for internal links — always use Next.js `<Link>` from `next/link`
- Never hardcode phone numbers, emails or addresses — import from `src/lib/constants.ts`
- Never use `fetch` without error handling
- Never suggest `useEffect` for data fetching — use server components or SWR
- Never generate placeholder/lorem ipsum content — use real Limac product data
- Never add animations or transitions that could be distracting — keep UI professional
- Never use `!important` in styles
- Never ignore TypeScript errors with `@ts-ignore`

---

## 14. CONSTANTS FILE

All hardcoded Limac data must live in `src/lib/constants.ts`:

```ts
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
  { label: 'Solar Storage', value: 'solar-storage', description: 'LiFePO4 packs for solar systems' },
  { label: 'Electric scooter Batteries', value: 'Electric scooter', description: 'CCA starter batteries' },
  { label: '12V Series', value: '12v-series', description: 'Deep cycle range' },
  { label: 'LiFePO4 Lighting', value: 'lifepo4-lighting', description: 'Lighting systems' },
] as const

export const BLOG_CATEGORIES = [
  { label: 'Solar Storage', value: 'solar-storage' },
  { label: 'Battery Technology', value: 'battery-tech' },
  { label: 'Installation Guides', value: 'installation' },
  { label: 'Industry News', value: 'news' },
] as const
```

---

## 15. STAGING vs PRODUCTION

### Staging URL (for leadership review before go-live):
- Vercel preview: `limac-website-git-main.vercel.app`
- Every `git push` triggers a new preview deployment automatically
- Password protect staging: use `PASSWORD_PROTECT=true` env var on staging only

### Production (after leadership approval):
- Domain: `https://www.limac.in`
- Only merge to `main` branch after explicit sign-off
- Always test on mobile before merging — 70%+ of Kerala traffic is mobile

---

## QUICK REFERENCE — MOST USED COMMANDS

```bash
# Start development
npm run dev

# Build and check for errors before committing
npm run build

# Deploy to Vercel staging
git push origin staging

# Deploy to production
git push origin main

# Generate Payload types after schema changes
npm run payload generate:types
```