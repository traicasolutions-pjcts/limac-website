# Limac Warranty API

FastAPI backend for the Limac Power Tech warranty registration platform.

## Local Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

## MongoDB For Local Development

The backend must connect to MongoDB on startup because it creates required indexes.

Option A: use MongoDB Atlas by setting `MONGODB_URI` in `.env.local` at the repository root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/limac?retryWrites=true&w=majority
MONGODB_DATABASE=limac
```

Option B: run local MongoDB with Docker:

```bash
cd backend
docker compose -f docker-compose.mongo.yml up -d
uvicorn app.main:app --reload
```

If MongoDB is not running locally and `MONGODB_URI` is not set, startup will fail with a clear MongoDB reachability error.

## Current Implemented Phase

- FastAPI app factory and health endpoints.
- MongoDB connection and idempotent index creation.
- Product serial normalization.
- Advisory public serial validation.
- CSV/XLSX serial import parsing and bulk upsert service.
- Admin serial import upload endpoint scaffold.
- Future Tally integration contract scaffold behind feature flag.

## Commands

```bash
pytest
ruff check .
python scripts/import_serials.py ../samples/product-serial-import-template.csv
python scripts/import_serials.py ../samples/product-serial-import-template.csv --apply
```

## Admin Login

Create the first admin locally:

```bash
cd backend
python scripts/create_admin.py --email admin@example.com --role SUPER_ADMIN
```

The script securely prompts for the password.

Then start the backend and open the frontend admin page:

```text
http://localhost:3000/admin/warranty/login
```

Successful login redirects to:

```text
http://localhost:3000/admin/warranty/registrations
```

You can also create the first production `SUPER_ADMIN` with `INITIAL_ADMIN_EMAIL` and
`INITIAL_ADMIN_PASSWORD` in Render. The backend only uses those values when no admin user exists.
Remove `INITIAL_ADMIN_PASSWORD` from Render after the first successful startup.

## Required Environment

Use placeholders in committed examples only. Production secrets belong in Render.

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
MONGODB_DATABASE=limac
JWT_SECRET_KEY=<generated-secret>
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
TURNSTILE_REQUIRED=true
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_BILL_FOLDER_ROOT=limac/warranty-bills
```

Warranty bills upload to Cloudinary using:

```text
limac/warranty-bills/YYYY/MM
```

For example, an August 2026 bill is stored under:

```text
limac/warranty-bills/2026/08
```

No SMS, OTP, Resend, SMTP, WhatsApp or outbound notification provider is required for V1.

For local development without Cloudflare Turnstile keys, set:

```env
TURNSTILE_REQUIRED=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```
