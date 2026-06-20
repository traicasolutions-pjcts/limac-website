# Limac Website — Development Architecture Summary

_Last updated: 2026-03-15_

## 1) Current Product + Design State

- Framework: Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS
- Theme: **Light mode default**, user toggle for light/dark from navbar (desktop + mobile)
- Brand assets: `public/logo.webp`, `public/bot.png`
- Product data source: **CSV-first by default** (`PRODUCT_DATA_SOURCE=csv`)
- Product images: **local only** from `public/product/*`
- Homepage order:
  1. Hero
  2. Battery Solutions for Every Application
  3. Limac Battery Classification
  4. Why Choose Limac
  5. Blog / Testimonials / Contact strip

---

## 2) Data Architecture (Current)

Primary product pipeline is implemented in `src/lib/payload.ts`:

- Reads `public/product/products.csv`
- Matches images by filename from `public/product`
- Returns local image paths like `/product/<filename>.webp`
- Supports source mode: `csv | cms | hybrid`
  - Default: `csv`
  - `cms`/`hybrid` can be enabled via env without structural code changes

### Important behavior

- Remote product image URLs are not used
- Product cards and category/classification sections all consume the same local image path flow
- Next image optimization is disabled globally (`images.unoptimized = true`) to avoid redirect issues with encoded local filenames

---

## 3) Key Modules

### App Shell
- `src/app/layout.tsx` — Global metadata + favicon + shared layout wrappers
- `src/app/globals.css` — Theme tokens, typography, utility styles
- `src/app/page.tsx` — Homepage section composition

### Product Experience
- `src/app/(site)/products/page.tsx` — Listing page
- `src/app/(site)/products/[slug]/page.tsx` — Detail page with `generateStaticParams`
- `src/components/home/ProductCategories.tsx` — “Battery Solutions for Every Application” with category images
- `src/components/home/LimacSiteProducts.tsx` — “Limac Battery Classification” with image cards

### Shared UI
- `src/components/layout/Navbar.tsx` / `MobileMenu.tsx` — Navigation and theme toggle availability
- `src/components/common/ThemeToggle.tsx` — Theme persistence and switching logic

### API (Node-hosted only)
- `src/app/api/chat/route.ts`
- `src/app/api/enquiry/route.ts`
- `src/app/api/[...slug]/route.ts` (Payload REST handlers)

---

## 4) Deployment Modes

## A) GitHub Pages (Static)

Workflow: `.github/workflows/publish-pages.yml`

- Uses `STATIC_EXPORT=true`
- Builds static output to `out/`
- Publishes via `peaceiris/actions-gh-pages`
- Site URL: `https://traicasolutions.github.io/limac-website/`

### Notes for static hosting

- API routes are not available on GitHub Pages runtime
- Chatbot backend/enquiry API require Node hosting for full functionality

## B) Full Runtime Hosting (Node)

Use Vercel or another Node-capable platform for:
- `/api/chat`
- `/api/enquiry`
- Payload REST/API runtime

---

## 5) Environment Variables

Defined in `.env.example`:

- `PRODUCT_DATA_SOURCE` (`csv` default)
- `NEXT_PUBLIC_SITE_URL`
- `MONGODB_URI`
- `PAYLOAD_URL`
- `PAYLOAD_SECRET`
- `PAYLOAD_API_KEY`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`

---

## 6) Operational Guide

## Product update (current default flow)

1. Update `public/product/products.csv`
2. Add/update matching image file in `public/product/`
3. Ensure `ProductImage` or product name matches image filename (without extension differences)
4. Run build and deploy

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`

---

## 7) Known Notes

- Payload wrapper with Next 14 may print non-blocking config warnings related to newer Next keys.
- On Windows, `.next/trace` may lock; stop Node processes before clean build.
- If product images fail, first verify exact filename match between CSV and `public/product` files.
