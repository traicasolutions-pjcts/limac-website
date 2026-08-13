# Codex Implementation Prompt - Limac Warranty Registration Platform

**Specification version:** 1.2 — Lean production release with manual serial approval and anti-spam controls

## Role
Act as a senior full-stack engineer and solution architect. Build a production-ready warranty registration platform for **Limac Power Tech**. Work iteratively, keep the repository runnable after every phase, and do not invent credentials or provider IDs.

## Existing context
- Existing website: `https://www.limac.in/`
- Existing frontend is React and deployed on Vercel.
- Add warranty pages to the existing application; do not replace or redesign unrelated website pages.
- Preserve current branding. Use the existing Limac logo, typography and components when available. Primary brand colour observed on the website: `#005579`.
- Backend: Python 3.12, FastAPI.
- Database: MongoDB Atlas.
- Backend hosting target: Render.
- Bill storage: Cloudinary using authenticated server-side upload and protected delivery.
- V1 notifications: No SMS, OTP or outbound email integration. Customer confirmation is provided on-screen using the generated registration reference number.
- Future notification integration: Keep notification interfaces loosely coupled so Hostinger SMTP email and SMS/OTP can be added later without changing warranty domain logic. Do not implement them in V1.
- All currently valid product serial numbers will initially be exported and imported into MongoDB.
- A later service will synchronize product serial numbers from Tally. Design for it now, but do not implement a Tally-specific connector unless explicitly requested.


## V1 scope boundary
The first production version is intentionally lean. Implement only:
- Existing React/Vercel website integration.
- Public customer warranty registration using name, address, mobile number, product serial number, purchase details and bill upload. No customer login is required.
- MongoDB product master with all currently available serial numbers preloaded/imported.
- Cloudinary secure bill storage.
- Admin login, review, approve/reject/request-information workflow. Admin accounts are provisioned by the backend; there is no public admin signup.
- Warranty record creation after approval.
- On-screen submission acknowledgement with registration reference number.
- Customer status lookup using reference number plus registered mobile or serial number.
- CSV/XLSX serial import/admin tooling.
- Future Tally sync contract/service boundary.

Explicitly out of scope for V1: SMS, OTP, Resend, Hostinger SMTP/outbound email, WhatsApp, customer accounts, dealer accounts and live Tally synchronization.

## Non-negotiable engineering rules
1. React must never access MongoDB or the Cloudinary API secret directly. Future notification-provider credentials must also remain backend-only.
2. FastAPI is the only trusted business layer.
3. Serial-number lookup is advisory in V1. A customer request must be accepted even when the serial is not found, already registered, or the product master is temporarily unavailable; the admin makes the final approval decision.
4. Multiple submitted/reviewable requests may exist for the same serial so suspicious or accidental duplicates remain visible to admins. Only the final approved warranty must be unique per serial.
5. Enforce uniqueness for authoritative entities such as registration number and final warranty serial, while using application-level duplicate detection for submissions.
6. Bill documents must not have permanent unrestricted public URLs.
7. Never log full customer PII, credentials, bill contents or secret URLs.
8. Approval must be idempotent and safe against concurrent/repeated requests.
9. Every admin decision, serial import and future sync run must be auditable.
10. Use UTC internally and ISO-8601 timestamps.
11. Add tests with each feature. Do not leave the project in a non-running state.
12. Do not implement SMS, OTP, Resend or SMTP in V1. Keep optional interfaces/extension points only.

## Desired repository structure
If the website repository is a monorepo, place the API under `backend/`. Otherwise create a separate backend repository and document the integration.

```text
frontend/                         # existing React app
  src/
    pages/warranty/
    pages/admin/warranty/
    components/warranty/
    services/warrantyApi.ts
    types/warranty.ts
    validation/
backend/
  app/
    main.py
    config.py
    database.py
    api/public/
    api/admin/
    api/integrations/
    models/
    schemas/
    repositories/
    services/
    security/
    storage/
    utils/
  tests/
  scripts/
  requirements.txt or pyproject.toml
  Dockerfile
  render.yaml
.env.example
README.md
```

Use TypeScript in the React frontend if the existing project supports it. Follow the existing package manager and style system; do not introduce a second UI framework unnecessarily.

## Public routes
- `/warranty/register`
- `/warranty/submitted`
- `/warranty/status`

## Admin routes
- `/admin/warranty/login`
- `/admin/warranty/registrations`
- `/admin/warranty/registrations/:id`
- `/admin/warranty/serial-imports`

## Customer registration UX
Create a mobile-first two-step flow:

1. **Customer, Product and Purchase**
   - Name.
   - Address line, city, state and PIN code.
   - Product serial number.
   - Product model may be entered/selected by the customer if required by the existing UI, but any matched product-master model is shown to the approver as authoritative reference data. Do not block submission because of a model mismatch.
   - Purchase date.
   - Invoice/bill number.
   - Dealer/shop name and optional dealer code.
   - Bill upload: JPG, JPEG, PNG or PDF; maximum 2 MB; exactly one file.
   - Validate size/type in React for UX and again in FastAPI for security.
   - Client-side image compression may be used before upload, but FastAPI must still enforce the 2 MB maximum. PDFs are not automatically compressed.

2. **Review and Submit**
   - Display the captured details for final confirmation, masking sensitive values where appropriate.
   - Separate warranty-terms and privacy-policy consent checkboxes.
   - Prevent double-click/repeated submission using an idempotency key.
   - Require anti-bot verification (Cloudflare Turnstile preferred) before final submission.
   - Apply submission throttling and duplicate detection before uploading/storing the bill.
   - On success show reference number such as `LIMAC-REG-2026-000001` and state `PENDING`.

The form must preserve entered data after recoverable API/upload errors. Add accessible labels, keyboard support and clear inline error messages.

## Admin UX
- Secure email/password login.
- Roles: `REVIEWER`, `APPROVER`, `SUPER_ADMIN`.
- Queue filters: Pending, Under Review, More Information Required, Approved, Rejected.
- Search by reference, serial, mobile suffix, invoice, dealer and date.
- Pagination and stable sorting.
- Detail page with customer/product/purchase data and protected bill preview.
- Display serial validation as a clear advisory indicator, product-master details when matched, existing warranty/pending-request matches, duplicate checks and audit history.
- Serial validation indicator values: `FOUND_UNREGISTERED`, `FOUND_ALREADY_REGISTERED`, `NOT_FOUND`, `VALIDATION_NOT_AVAILABLE`.
- The UI must make clear that the indicator is advisory and that the approver makes the final validity decision.
- Actions:
  - Start Review.
  - Approve.
  - Reject with mandatory reason.
  - Request More Information with mandatory message.
- Prevent unauthorized roles from rendering or calling restricted actions.

## Core MongoDB collections
Implement Pydantic schemas and repository abstractions for:

### `products`
```json
{
  "serial_number": "LMC26AB123456",
  "serial_normalized": "LMC26AB123456",
  "product_model": "LM150",
  "product_category": "SOLAR",
  "warranty_months": 60,
  "manufactured_at": null,
  "sold_at": null,
  "dealer_code": null,
  "status": "AVAILABLE",
  "source_system": "INITIAL_EXPORT",
  "source_record_id": "initial:LMC26AB123456",
  "source_updated_at": null,
  "sync_version": 1,
  "created_at": "UTC timestamp",
  "updated_at": "UTC timestamp"
}
```
Product statuses: `AVAILABLE`, `REGISTRATION_PENDING`, `REGISTERED`, `BLOCKED`, `REPLACED`.

### `warranty_registrations`
Include:
- Unique `registration_number`.
- Customer snapshot.
- Product snapshot and normalized serial.
- Purchase data.
- Bill asset metadata, never secret credentials.
- Status.
- Submission/review timestamps.
- Reviewer IDs.
- Rejection or information-request history.
- Consent versions and timestamps.
- Idempotency key/hash.
- Serial-validation snapshot containing result, checked_at, matched_product_id (if any), existing_warranty_id (if any), and product-master reference fields used during review.
- Anti-abuse metadata sufficient for rate limiting/auditing, with IP values hashed/truncated where practical rather than stored as raw long-term PII.

Statuses:
`PENDING`, `UNDER_REVIEW`, `MORE_INFORMATION_REQUIRED`, `APPROVED`, `REJECTED`, `CANCELLED`.

### `warranties`
Include:
- Unique warranty number.
- Registration ID.
- Normalized serial, unique.
- Customer reference/snapshot as needed.
- Start date from purchase date.
- End date calculated from authoritative `warranty_months`.
- Status: `ACTIVE`, `EXPIRED`, `CANCELLED`, `REPLACED`.
- Creation and lifecycle timestamps.

### Other collections
- `admin_users`
- `audit_logs`
- `serial_import_jobs`
- `sync_runs` (schema now, used later)
- `submission_rate_limits` or equivalent TTL-backed anti-abuse store

## Required indexes
Create indexes in an idempotent startup migration or explicit setup script:
- Unique `products.serial_normalized`.
- Unique `warranty_registrations.registration_number`.
- Unique `warranties.warranty_number`.
- Unique `warranties.serial_normalized` so only one approved warranty can exist for a serial.
- Queue/search indexes for status and submitted timestamp.

Do not rely on an ORM that cannot reliably create the required partial indexes. PyMongo is acceptable and preferred.

## Public API
Implement under `/api/v1/public`:

```text
GET  /products/{serial}/validation
POST /warranty-registrations
POST /warranty-registrations/status-lookup
POST /warranty-registrations/{reference}/documents
```

Do not disclose detailed product or customer data from public endpoints. The serial-validation endpoint is advisory only and must return safe values such as `FOUND_UNREGISTERED`, `FOUND_ALREADY_REGISTERED`, `NOT_FOUND` or `VALIDATION_NOT_AVAILABLE`. It must never prevent the customer from continuing to the submission form.

For V1 status lookup, require the customer to provide `registration_reference` plus either the registered mobile number or product serial number. Return only registration status, masked serial/mobile, submission date, warranty number if approved, and rejection/more-information message where applicable. Do not expose name, address, bill URL or other PII. Add rate limiting to prevent enumeration.

## Admin API
Implement under `/api/v1/admin`:

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /registrations
GET  /registrations/{id}
POST /registrations/{id}/start-review
POST /registrations/{id}/approve
POST /registrations/{id}/reject
POST /registrations/{id}/request-information
GET  /registrations/{id}/bill-access
POST /serial-imports
GET  /serial-imports/{job_id}
GET  /audit-logs
```

Use short-lived access JWT and rotating refresh tokens. Hash admin passwords with Argon2. Add role checks at route and service layers.

## Admin account provisioning and recovery
- Customers do not create accounts and do not log in. Public registration/status routes must remain usable without authentication.
- There is no public admin signup endpoint or UI.
- Admin accounts are stored in `admin_users` and passwords are hashed with Argon2.
- Provide `backend/scripts/create_admin.py` that securely prompts for email, password and role and never accepts/logs a plaintext password in source control.
- Provide `backend/scripts/reset_admin_password.py --email <admin-email>` that securely prompts for a new password and resets only that admin account.
- Support optional one-time bootstrap variables such as `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`: on startup, create the initial `SUPER_ADMIN` only when no admin user exists. Never overwrite an existing admin. Document that the bootstrap password should be removed from Render after successful initial provisioning.
- Recommended V1 roles: `SUPER_ADMIN`, `APPROVER`, `REVIEWER`.
- `SUPER_ADMIN` may create/disable other admin users through a protected backend action or CLI. Self-registration is never allowed.
- Password reset by email is out of scope for V1 because outbound email is not implemented. Operational recovery is through the reset script by someone with deployment/backend access.

## Approval transaction semantics
Implement approval as a guarded, idempotent operation:
1. Verify caller role.
2. Load registration and assert it is approvable.
3. Recheck serial/product state and existing warranty. Show the result to the approver, but let the approver make the final validity decision.
4. Before creating the final warranty, enforce that no other approved warranty already exists for the normalized serial. If one exists, require an explicit conflict resolution/rejection path rather than silently creating another warranty.
5. Create the warranty exactly once.
6. Set registration to `APPROVED`.
7. If a matched product-master record exists, set its status to `REGISTERED`; if no product-master record exists, approval is still allowed and must be auditable.
8. Append audit event including the serial-validation result and approver identity.
9. Commit business state.
10. Return the resulting warranty number/status to the admin UI. No external notification is sent in V1.

Atlas Flex transaction capabilities/limitations may vary. Design so correctness is also protected by unique indexes and compare-and-set updates. If a multi-document transaction is unavailable or undesirable, use a recoverable state-machine/saga approach and a repair command. Document the choice in an ADR.

## Serial-number initial import
Build an admin CSV/XLSX import feature and a CLI script.

Expected columns:
- `serial_number` required.
- `product_model` required.
- `product_category` required.
- `warranty_months` required.
- `manufactured_at` optional.
- `sold_at` optional.
- `dealer_code` optional.
- `source_record_id` optional.

Requirements:
- Normalize serial by trimming spaces and uppercasing. Add a clearly isolated normalization function with tests.
- Dry-run mode.
- File checksum to detect accidental duplicate imports.
- Bulk upsert.
- Never overwrite `REGISTERED`, `BLOCKED` or `REPLACED` status during a normal import.
- Per-row accepted/rejected result with reason.
- Import summary: inserted, updated, unchanged, skipped and failed.
- Generate a downloadable error CSV.
- Include a small sample import template in `docs/` or `samples/`.

## Future Tally sync preparation
Do not implement Tally transport/protocol unless requested. Implement the canonical API contract and service boundary under `/api/v1/integrations/tally` behind an `INTEGRATION` identity:

```text
POST /serials:batch-upsert
GET  /sync-runs/{batch_id}
```

Batch request:
```json
{
  "source_company": "LIMAC",
  "batch_id": "2026-08-03T220000-001",
  "cursor": "source cursor",
  "items": [
    {
      "source_record_id": "TALLY-GUID-123",
      "serial_number": "LMC26AB123456",
      "product_model": "LM150",
      "product_category": "SOLAR",
      "warranty_months": 60,
      "sold_at": "2026-08-02",
      "dealer_code": "DLR001",
      "source_updated_at": "2026-08-03T16:00:00Z"
    }
  ]
}
```

Rules:
- Dedicated bearer credential or signed request for the integration.
- Require `Idempotency-Key`.
- Default maximum 500 items.
- Upsert using `source_system + source_record_id`; normalized serial remains globally unique.
- Ignore stale source updates.
- Never downgrade `REGISTERED`, `BLOCKED` or `REPLACED` product state.
- Return per-item status and a checkpoint.
- Record `sync_runs` with counts, duration and errors.
- Add contract tests and replay/idempotency tests, even if endpoint is feature-flagged initially.

## Cloudinary bill storage
- Upload only from FastAPI using authenticated server-side upload.
- Validate file signature and MIME type; do not trust extension.
- Allow JPG/JPEG, PNG and PDF; maximum 2 MB; exactly one bill file per registration.
- Reject empty, corrupted or signature/MIME-mismatched files.
- Return user-friendly validation errors such as `Maximum file size allowed is 2 MB.`
- Strip EXIF metadata from images and optionally resize huge images.
- Compute SHA-256 checksum.
- Store Cloudinary `asset_id`/`public_id`, resource type, bytes, format, checksum and upload time.
- Use protected/authenticated delivery.
- Admin gets a short-lived authorized access response; never persist an unrestricted public URL.
- Create cleanup logic for orphaned or rejected-document assets according to configurable retention.
- Abstract storage behind an interface so Cloudinary can later be replaced by S3/R2 without changing domain services.

## Future notifications — not part of V1
Do **not** implement SMS, OTP, Resend, SMTP or any outbound notification provider in the initial release.

Design the domain services so notifications can be added later through an optional interface such as:

```python
class NotificationService(Protocol):
    async def registration_received(...): ...
    async def warranty_approved(...): ...
    async def registration_rejected(...): ...
```

The V1 implementation should use no-op behavior and must not require notification environment variables. Future preferred email integration is the existing Limac/Hostinger mailbox using SMTP. Future SMS/OTP integration may use an Indian DLT-compliant provider, but neither is a V1 dependency.

Customer confirmation in V1 is handled by:
- An on-screen submission-success page.
- A generated reference number such as `LIMAC-REG-2026-000001`.
- A warranty status lookup page.
- An approved warranty number displayed through the status page after approval.

## Security
- Strict CORS allow list for `https://www.limac.in` and `https://limac.in`, plus explicit development origins.
- HTTPS assumption in production.
- Rate limiting on serial-validation, status-lookup and submission endpoints.
- Require Cloudflare Turnstile (preferred) or an equivalent configurable CAPTCHA/anti-bot provider on warranty submission. Verify the token server-side in FastAPI.
- V1 default submission controls: maximum 5 submissions per IP per hour, 15 per IP per day, and 3 submissions per mobile number per day. Make values configurable through environment variables.
- Duplicate detection before storing a new request: if the same normalized mobile + serial + invoice combination was submitted in the previous 30 days, return the existing registration reference/status instead of creating a new database row or bill asset.
- If the same serial already has a `PENDING`, `UNDER_REVIEW`, or `MORE_INFORMATION_REQUIRED` request, flag it to the customer/admin and avoid accidental identical resubmission, while still allowing an admin-controlled exception path for a genuinely different claim/request.
- Do not rely on IP alone because multiple legitimate users may share an IP.
- Store rate-limit/anti-abuse counters in a TTL-backed collection or an equivalent bounded mechanism so anti-spam data does not grow indefinitely.
- Pydantic request validation.
- Prevent NoSQL injection by never passing client filters directly to MongoDB.
- Safe file handling.
- Disable or protect OpenAPI docs in production.
- Add secure headers where controlled by the app.
- Structured JSON logging with request ID and PII masking.
- `.env.example` with placeholders only.
- Privacy/terms consent versioning.

## Observability and health
Implement:
- `GET /health/live`
- `GET /health/ready` checking MongoDB connectivity without exposing secrets.
- Request ID middleware.
- Structured logs.
- Sentry integration behind environment configuration.
- Metrics or summary endpoints for pending count and import/sync failures, protected for admins.

## Deployment
Provide:
- `Dockerfile` using a non-root user.
- `render.yaml` or clear Render configuration.
- Build command and start command.
- Vercel environment variable example: `VITE_WARRANTY_API_URL=https://api.limac.in/api/v1` or the equivalent convention used by the existing app.
- Production environment-variable checklist.
- DNS instructions for `api.limac.in`.
- Staging environment guidance with a separate database and Cloudinary credentials where practical.

## Tests and quality gates
Use `pytest` for backend and the existing React test stack for frontend. Include:
- Serial normalization and import tests.
- Serial-validation advisory tests for found-unregistered, found-already-registered, not-found and validation-unavailable cases.
- Verify that all serial-validation outcomes can still submit for manual review.
- File-type spoofing and oversized-file tests.
- Anti-spam, CAPTCHA, idempotency and duplicate-submission tests.
- Verify 2 MB upload enforcement on frontend contract/backend implementation.
- Approval idempotency tests.
- Authorization tests for each admin role.
- Tally batch replay and stale-update tests.
- End-to-end happy path from registration through approval and status lookup.

Quality targets:
- Formatting/linting configured.
- Type checking for backend and frontend.
- No committed secrets.
- Meaningful test coverage on domain services and security-critical paths.
- README contains setup, local run, import, test and deployment commands.

## Implementation phases
Proceed in this order and stop after each phase with a concise summary of files changed, commands to run and any required human configuration:

1. Inspect existing repository, framework, package manager, branding and routing. Do not overwrite unrelated code.
2. Add backend foundation, settings, health checks, MongoDB connection, models and indexes.
3. Implement serial import CLI/API and tests.
4. Implement advisory public serial validation; never block submission based only on serial-master lookup.
5. Implement public customer registration, Cloudflare Turnstile verification, rate limiting, duplicate detection and secure 2 MB bill storage.
6. Implement admin authentication, queue and review actions, plus admin bootstrap/reset scripts.
7. Implement approval/warranty creation with idempotency and tests.
8. Implement status lookup and customer confirmation UI without OTP/email/SMS.
9. Add notification extension interface/no-op implementation only; do not connect a provider.
10. Add future Tally contract endpoints behind feature flag and tests.
11. Add deployment files, security hardening, monitoring and complete documentation.

## Definition of done
The application is complete when:
- Customers can submit without login regardless of whether the serial is found in the current imported product master.
- Serial-master results are shown as advisory indicators to the approver; the approver makes the final approval/rejection decision.
- Only one final approved warranty may exist for a normalized serial unless a future replacement/migration workflow explicitly changes that rule.
- A valid JPG/JPEG/PNG/PDF bill up to 2 MB is stored securely and visible only to authorized admins.
- An approver can approve once; retries do not create duplicate warranties.
- Product, registration and warranty states remain consistent.
- Customer receives an on-screen reference number after successful submission.
- Customer can check status using registration reference plus registered mobile number or serial number, with rate limiting and masked output.
- Approved warranty number is visible in the protected status lookup response.
- V1 has no customer login and no dependency on SMS, OTP, Resend or SMTP.
- Repeated/spam submissions are controlled using Turnstile, configurable IP/mobile rate limits, idempotency and duplicate-request detection.
- Import produces a reliable row-level result report.
- All key operations are auditable.
- Local development, tests and Render/Vercel deployment are documented and reproducible.

## First action
Before writing code, inspect the repository and produce:
1. Current frontend stack and route/component structure.
2. Proposed file changes.
3. Any conflicts with this specification.
4. A phase-1 implementation plan.
Then implement phase 1 without asking for confirmation unless a destructive repository change would be required.
