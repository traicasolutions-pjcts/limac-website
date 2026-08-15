# Limac Warranty Registration - Phase 1 Inspection

## Branch

- Local branch: `warranty-registration-platform`
- Base branch at creation: `main`

## Current Frontend Stack

- Framework: Next.js App Router, React, TypeScript.
- Styling: Tailwind CSS with Limac theme tokens in `src/app/globals.css` and `tailwind.config.ts`.
- CMS/API integration already present: Payload CMS 3 with MongoDB adapter.
- Package manager: npm with `package-lock.json`.
- Deployment target already configured for Vercel through `vercel.json`.
- Important dependency note: `resend` is installed in the existing frontend project, but the V1 warranty platform must not implement outbound email.

## Route And Component Structure

- Public site routes are under `src/app/(site)/`.
- Existing site pages include:
  - `/about`
  - `/products`
  - `/products/[slug]`
  - `/contact`
  - `/careers`
  - `/blog`
  - `/blog/[slug]`
  - `/solutions`
  - `/terms`
  - `/privacy-policy`
- API routes currently exist under `src/app/api/`, including Payload catch-all routing.
- Shared layout is defined in `src/app/layout.tsx`.
- Global navigation uses:
  - `src/components/layout/Navbar.tsx`
  - `src/components/layout/MobileMenu.tsx`
  - `src/lib/constants.ts`
- Shared UI patterns already available:
  - `src/components/common/Badge.tsx`
  - `src/components/common/SectionHeader.tsx`
  - `src/components/common/RevealOnScroll.tsx`
  - `src/lib/utils.ts`
- Existing Limac logo assets are available in `public/`.

## Branding Observations

- The current app uses the Limac logo from `public/logo*.webp`.
- Tailwind theme colors are based on CSS variables:
  - `limac.black`
  - `limac.navy`
  - `limac.blue`
  - `limac.cyan`
  - `limac.green`
  - `limac.green-logo`
  - `limac.white`
  - `limac.muted`
- The observed requested primary brand color `#005579` is not currently a named token. It should be introduced carefully only if needed for warranty-specific states, while preserving the existing palette.
- Typography is Manrope via Google Fonts.

## Proposed File Changes

### Frontend

- Add public warranty routes:
  - `src/app/(site)/warranty/register/page.tsx`
  - `src/app/(site)/warranty/submitted/page.tsx`
  - `src/app/(site)/warranty/status/page.tsx`
- Add admin warranty routes:
  - `src/app/admin/warranty/login/page.tsx`
  - `src/app/admin/warranty/registrations/page.tsx`
  - `src/app/admin/warranty/registrations/[id]/page.tsx`
  - `src/app/admin/warranty/serial-imports/page.tsx`
- Add warranty frontend modules:
  - `src/components/warranty/`
  - `src/services/warrantyApi.ts`
  - `src/types/warranty.ts`
  - `src/validation/warranty.ts`
- Add environment documentation for:
  - `VITE_WARRANTY_API_URL` equivalent for Next.js, likely `NEXT_PUBLIC_WARRANTY_API_URL`.
  - Cloudflare Turnstile site key, likely `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- Add a nav entry for warranty registration only after the public route is implemented and stable.

### Backend

- Add FastAPI service under `backend/`:
  - `backend/app/main.py`
  - `backend/app/config.py`
  - `backend/app/database.py`
  - `backend/app/api/public/`
  - `backend/app/api/admin/`
  - `backend/app/api/integrations/`
  - `backend/app/models/`
  - `backend/app/schemas/`
  - `backend/app/repositories/`
  - `backend/app/services/`
  - `backend/app/security/`
  - `backend/app/storage/`
  - `backend/app/utils/`
  - `backend/tests/`
  - `backend/scripts/`
  - `backend/pyproject.toml`
  - `backend/Dockerfile`
  - `backend/render.yaml`
- Add backend documentation:
  - `docs/warranty-architecture.md`
  - `docs/warranty-deployment.md`
  - `docs/adr/warranty-approval-state-machine.md`
- Add sample import template:
  - `samples/product-serial-import-template.csv`
- Add root environment sample entries in `.env.example`.

## Specification Conflicts Or Gaps

- The prompt says "Existing frontend is React and deployed on Vercel"; this repository is specifically a Next.js App Router React app, so warranty pages should use App Router conventions rather than `src/pages`.
- The desired `frontend/` directory does not match the current repository layout. The existing frontend is rooted at `src/`, so moving it into `frontend/` would be an unnecessary disruptive change.
- The repository already has Payload CMS with a MongoDB dependency, but the warranty specification requires FastAPI as the trusted business layer. Warranty data should not be implemented as Payload collections unless explicitly scoped to non-authoritative content.
- The current dependency list includes `resend`; V1 warranty notification rules prohibit implementing Resend, SMTP, SMS, OTP or outbound email. Any existing Resend usage must remain unrelated to warranty V1.
- The prompt asks for Cloudflare Turnstile or equivalent. No Turnstile dependency or site key is currently present, so final submission must be wired to configurable frontend and backend environment variables.
- The prompt names `VITE_WARRANTY_API_URL`, but this Next.js app should use a `NEXT_PUBLIC_` variable for browser-visible API configuration.

## Phase 1 Implementation Plan

1. Keep the new work on `warranty-registration-platform`.
2. Preserve the current Next.js/Payload site structure.
3. Add the warranty backend as a separate `backend/` FastAPI service inside this repository.
4. Add frontend warranty routes under the existing App Router tree.
5. Keep frontend API calls behind a small `warrantyApi.ts` client that only talks to FastAPI.
6. Add backend foundation first: settings, request IDs, health checks, MongoDB connection, indexes, and test scaffolding.
7. Add serial import and validation before registration, because registration depends on advisory product-master snapshots.
8. Add public registration with idempotency, rate limiting, Turnstile verification, and secure server-side bill storage.
9. Add admin auth/review/approval after public submission is testable.
10. Keep notification and Tally features as no-op/interface or feature-flagged contracts only in V1.

## Phase 1 Result

Phase 1 is complete when this inspection is committed or otherwise reviewed, and the repository remains runnable with no production behavior changed.
