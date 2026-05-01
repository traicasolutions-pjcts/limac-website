// src/lib/types.ts

export interface Product {
  id: string
  name: string
  slug: string
  category: string
  shortDescription: string
  longDescription?: string
  description?: unknown // Payload rich text (Slate)
  imageUrl?: string
  imageUrls?: string[]
  imageAlt?: string
  keyFeatures: string[]
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
  images?: Array<{
    image: { url: string; alt: string }
    alt: string
  }>
  status: 'published' | 'draft'
  featured: boolean
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  category: 'solar-storage' | 'battery-tech' | 'installation' | 'news'
  excerpt: string
  content?: unknown // Payload rich text
  featuredImage?: { url: string; alt: string }
  status: 'published' | 'draft'
  publishedDate: string
}

export interface EnquiryFormData {
  name: string
  phone: string
  email?: string
  productInterest?: string
  message?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
