# Internal Installation, Deployment, Configuration, and Operation Guide

Last updated: 30 August 2026

This guide explains how to set up the Limac website and warranty registration platform from the beginning, configure all required third-party services, deploy to production, and operate the system safely.

Production secrets must not be committed to Git. Store secrets only in Vercel, Render, Cloudflare, MongoDB Atlas, Cloudinary, or the approved internal password manager.

## 1. System Components

| Component | Provider | Purpose |
| --- | --- | --- |
| Frontend website | Vercel | Public website, warranty registration UI, admin UI |
| Backend API | Render | FastAPI warranty backend |
| Database | MongoDB Atlas | Warranty registrations, product serials, admin users, change logs |
| Captcha | Cloudflare Turnstile | Bot protection for public warranty registration |
| Bill file storage | Cloudflare R2 or Cloudinary | Private storage for bill PDF/image files |
| DNS | Domain provider/Vercel DNS | Production domain routing |
| Source control/deployment | GitHub/GitHub Actions | Code repository, security scan, deployment workflow |

## 2. Deployment Order

Recommended setup order:

1. Create MongoDB Atlas database.
2. Create bill storage provider: Cloudflare R2 preferred, Cloudinary supported.
3. Create Cloudflare Turnstile widget.
4. Deploy backend API on Render.
5. Deploy frontend website on Vercel.
6. Configure DNS/domain.
7. Create initial warranty admin user.
8. Run production verification checklist.

## 3. Cost-Control Plan for Small Startup

Limac is an Indian customer and a small startup, so always choose the lowest practical production cost. Amounts below are approximate and shown in INR first, with USD in brackets. Use `1 USD ~= Rs. 95.5` only for rough planning. Final billing can change based on provider pricing, tax, exchange rate, region, and actual usage.

Recommended starting approach:

- Keep Vercel on free plan initially.
- Keep MongoDB Atlas on free plan initially.
- Keep Cloudflare Turnstile on free plan initially.
- Keep bill files on Cloudinary free plan initially, or move new bill files to Cloudflare R2 when Cloudinary usage approaches limit.
- Upgrade Render backend first if customer/admin users face slow loading because of free-server sleep/cold start.

Approximate minimum monthly infrastructure and maintenance cost:

| Stage | Server/Storage Paid By Limac | Low-Cost Guidance |
| --- | ---: | --- |
| Very early usage | Rs. 0/month ($0) | Use free tiers while usage is small |
| Practical production minimum | Rs. 700 to Rs. 1,000/month ($7 to $10) | Pay Render backend first to avoid slow loading |
| More warranty requests | Rs. 700 to Rs. 1,200/month ($7 to $13) | Use R2 for low-cost bill storage |
| More data/performance required | Rs. 1,500 to Rs. 4,000/month ($16 to $42) | Add MongoDB paid plan when database limit/performance requires it |
| High website traffic/team requirement | Add about Rs. 1,900/month ($20) per Vercel user/seat if required | Add Vercel Pro only when necessary |

Common Traica maintenance/support for the overall program:

```text
Rs. 4,000 per month
```

This is separate from Limac-paid server/storage/provider cost.

This Rs. 4,000/month support amount is for the initial support period covering the current Phase 1 website and Phase 2 warranty registration features. If modules, integrations, usage, or operational support requirements increase, Traica maintenance/support charges should be reviewed separately with Limac approval.

Simple provider cost notes:

| Provider | Low-Cost Guidance |
| --- | --- |
| Render | Free is okay for testing/early use, but may sleep. Paid starter is the first recommended upgrade for better response time. |
| MongoDB Atlas | Free can continue until database size/performance/backup requirement needs paid plan. |
| Cloudinary | Use free/initial limit only. If bill storage grows, avoid costly Cloudinary upgrade by switching new bills to Cloudflare R2. |
| Cloudflare R2 | Preferred low-cost bill storage. The app already supports R2. Old Cloudinary files can remain accessible. |
| Vercel | Keep free initially. Move to Pro only if traffic, commercial/account policy, or team requirement demands it. |
| Turnstile | Free should be enough unless enterprise security/SLA is required. |

Bill storage estimate:

- Current max file size is 2 MB per bill.
- If average bill size is 500 KB, 10 GB can hold around 20,000 bills.
- If average bill size is 1 MB, 10 GB can hold around 10,000 bills.
- If average bill size is 2 MB, 10 GB can hold around 5,000 bills.
- Bill files are stored outside MongoDB, so PDF/image files do not heavily increase database size.

Ownership and support:

- All subscriptions and paid provider accounts must be purchased and owned by Limac/customer accounts.
- Traica supports setup, configuration, deployment, monitoring, and maintenance.
- Traica maintenance/support is separate from server/storage cost and is estimated at Rs. 4,000 per month only for the initial support period covering the current Phase 1 website and Phase 2 warranty registration features.
- Do not upgrade to any paid plan without customer approval.
- Server, database, storage, and provider costs are based on current published plans and current market/exchange-rate assumptions. These charges may change based on provider pricing, taxes, exchange rate, usage volume, or market conditions.

## 4. MongoDB Atlas Setup

MongoDB Atlas stores application data. The backend creates required indexes automatically on startup.

### 4.1 Create Account and Project

1. Go to https://www.mongodb.com/cloud/atlas/register.
2. Create or sign in to the customer-owned MongoDB Atlas account.
3. Create an organization if required.
4. Create a project, for example:

```text
Limac Production
```

### 4.2 Create Cluster

1. In the project, click **Build a Database**.
2. Select a free/shared cluster for initial use if available.
3. Select a nearby cloud region.
4. Name the cluster, for example:

```text
limac-prod
```

5. Create the cluster.

### 4.3 Create Database User

1. Go to **Database Access**.
2. Click **Add New Database User**.
3. Authentication method: password.
4. Username suggestion:

```text
limac_app
```

5. Generate a strong password and store it securely.
6. Grant access to the application database. Minimum recommended role:

```text
readWrite
```

7. Database name:

```text
limac
```

### 4.4 Configure Network Access

1. Go to **Network Access**.
2. Add the Render outbound IP address if using fixed outbound IPs.
3. If Render fixed outbound IP is not available on the selected plan, temporarily allow:

```text
0.0.0.0/0
```

4. If using `0.0.0.0/0`, ensure the database username/password is strong and not reused.

### 4.5 Get Connection String

1. Go to **Database**.
2. Click **Connect**.
3. Select driver connection string.
4. Copy the URI and replace username/password.

Render backend variables:

```env
MONGODB_URI=mongodb+srv://limac_app:<password>@<cluster-host>/limac?retryWrites=true&w=majority
MONGODB_DATABASE=limac
```

## 5. Cloudflare Turnstile Setup

Turnstile protects the public warranty registration form.

### 5.1 Create Widget

1. Go to https://dash.cloudflare.com.
2. Open **Turnstile**.
3. Click **Add site** or **Create widget**.
4. Site/widget name:

```text
Limac Warranty Production
```

5. Add allowed hostnames:

```text
limac.in
www.limac.in
```

6. For local testing, optionally add:

```text
localhost
127.0.0.1
```

7. Widget mode: use **Managed** unless a different mode is approved.
8. Create the widget.
9. Copy:
   - Site key
   - Secret key

Frontend Vercel variable:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile-site-key>
```

Render backend variables:

```env
TURNSTILE_REQUIRED=true
TURNSTILE_SECRET_KEY=<turnstile-secret-key>
```

Local development without captcha:

```env
TURNSTILE_REQUIRED=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

## 6. Bill Storage Setup

The system supports both Cloudflare R2 and Cloudinary.

Recommended production approach:

- Use Cloudflare R2 for new bill uploads because it is low-cost object storage.
- Keep Cloudinary credentials configured if old bills are still stored in Cloudinary.
- The MongoDB `warranty_registrations.bill_asset.provider` field tells the backend where each bill is stored.

## 7. Cloudflare R2 Setup

Use this section when `BILL_STORAGE_PROVIDER=r2`.

### 7.1 Create R2 Bucket

1. Go to https://dash.cloudflare.com.
2. Open **Storage & Databases**.
3. Select **R2 Object Storage**.
4. If asked, enable R2 and complete billing setup.
5. Click **Create bucket**.
6. Bucket name:

```text
limac-warranty-bills
```

7. Location: **Automatic** unless a specific location is approved.
8. Create the bucket.

### 7.2 Create R2 API Credentials

1. In Cloudflare dashboard, open **R2 Object Storage**.
2. Open **Manage API tokens** or **API Tokens** for R2.
3. Click **Create API token**.
4. Token name:

```text
limac-warranty-backend-production
```

5. Permission:

```text
Object Read & Write
```

6. Bucket scope:

```text
Apply to specific buckets only
limac-warranty-bills
```

7. Create token.
8. Copy and store:
   - Access Key ID
   - Secret Access Key

Important: save the secret immediately. It may not be shown again.

### 7.3 Get Cloudflare Account ID

1. Open Cloudflare dashboard.
2. Select the account.
3. Copy the **Account ID** from the right sidebar or R2 account details.

The S3 endpoint is:

```text
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

The backend builds this endpoint automatically from `R2_ACCOUNT_ID`.

### 7.4 Render Variables for R2

```env
BILL_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET_NAME=limac-warranty-bills
R2_BILL_KEY_PREFIX=limac/warranty-bills
```

Expected R2 object path:

```text
limac/warranty-bills/YYYY/MM/<registration-reference>-HHMMSS.<extension>
```

Example:

```text
limac/warranty-bills/2026/08/LIMAC-REG-2026-000120-103045.pdf
```

## 8. Cloudinary Setup

Use this section when `BILL_STORAGE_PROVIDER=cloudinary`, or when old Cloudinary bills must remain accessible.

### 8.1 Create Account and Get Credentials

1. Go to https://cloudinary.com.
2. Create or sign in to the customer-owned Cloudinary account.
3. Open Cloudinary Console.
4. Go to **Settings**.
5. Open **API Keys**.
6. Copy:
   - Cloud name
   - API key
   - API secret

### 8.2 Render Variables for Cloudinary

```env
BILL_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_BILL_FOLDER_ROOT=limac/warranty-bills
```

Expected Cloudinary folder:

```text
limac/warranty-bills/YYYY/MM
```

Example:

```text
limac/warranty-bills/2026/08
```

### 8.3 Hybrid Cloudinary + R2 Mode

To store new files in R2 but keep old Cloudinary files accessible:

1. Set:

```env
BILL_STORAGE_PROVIDER=r2
```

2. Keep the Cloudinary variables in Render:

```env
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_BILL_FOLDER_ROOT=limac/warranty-bills
```

3. Add the R2 variables from section 7.4.

Result:

- New uploads go to R2.
- Old `provider=cloudinary` bills continue to open.
- Admin preview works through the backend `/bill-file` endpoint for both providers.

## 9. Render Backend Deployment

Render hosts the FastAPI backend.

### 9.1 Create Web Service

1. Go to https://dashboard.render.com.
2. Click **New**.
3. Select **Web Service**.
4. Connect the GitHub repository.
5. Select the backend service/root configuration.
6. Runtime/deployment type: Docker, using:

```text
backend/Dockerfile
```

7. Service name:

```text
limac-warranty-api
```

8. Region: choose the nearest available region.
9. Branch: production branch, usually:

```text
main
```

10. Health check path:

```text
/api/v1/health/ready
```

11. Add environment variables.
12. Create service and wait for deployment.

### 9.2 Required Render Environment Variables

```env
ENVIRONMENT=production
API_V1_PREFIX=/api/v1
MONGODB_URI=<mongodb-atlas-uri>
MONGODB_DATABASE=limac
JWT_SECRET_KEY=<strong-random-secret>
TURNSTILE_REQUIRED=true
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
BILL_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET_NAME=limac-warranty-bills
R2_BILL_KEY_PREFIX=limac/warranty-bills
CORS_ORIGINS=["https://www.limac.in","https://limac.in"]
```

If Cloudinary is active or old Cloudinary bills must be read:

```env
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_BILL_FOLDER_ROOT=limac/warranty-bills
```

For initial admin bootstrap only:

```env
INITIAL_ADMIN_EMAIL=<admin-email>
INITIAL_ADMIN_PASSWORD=<temporary-strong-password>
```

Remove `INITIAL_ADMIN_PASSWORD` after the first successful startup and admin creation.

### 9.3 Backend Verification

After deployment, check:

```text
https://<render-service-url>/api/v1/health/live
https://<render-service-url>/api/v1/health/ready
```

Expected:

- `/live` returns service health.
- `/ready` confirms database connectivity.

## 10. Vercel Frontend Deployment

Vercel hosts the Next.js frontend.

### 10.1 Create Project

1. Go to https://vercel.com.
2. Create or sign in to the customer-owned Vercel account.
3. Click **Add New Project**.
4. Import the GitHub repository.
5. Framework preset: Next.js.
6. Production branch: usually `main`.
7. Configure environment variables.
8. Deploy.

### 10.2 Required Vercel Environment Variables

Production:

```env
NEXT_PUBLIC_SITE_URL=https://www.limac.in
NEXT_PUBLIC_WARRANTY_API_URL=https://<render-service-url>/api/v1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
PRODUCT_DATA_SOURCE=csv
```

Payload/website variables, if the website runtime uses Payload:

```env
PAYLOAD_URL=https://www.limac.in
PAYLOAD_SECRET=<strong-random-secret>
PAYLOAD_API_KEY=<optional-api-key-if-used>
MONGODB_URI=<mongodb-uri-if-payload-runtime-requires-it>
```

### 10.3 Vercel Deployment Behavior

- Vercel can auto-deploy GitHub commits and pull requests.
- Production deployments happen from the configured production branch.
- Environment variables must be added for the correct environment: Production, Preview, and Development as required.
- Browser-visible variables must start with `NEXT_PUBLIC_`.
- Do not put backend secrets such as MongoDB password, Cloudinary secret, R2 secret, JWT secret, or Turnstile secret in Vercel browser-visible variables.

## 11. DNS and Domain Setup

1. In Vercel, open the project.
2. Go to **Settings** -> **Domains**.
3. Add:

```text
limac.in
www.limac.in
```

4. Vercel will show required DNS records.
5. In the domain/DNS provider, add records exactly as shown by Vercel.
6. Preserve email records unless intentionally migrating email:
   - MX
   - SPF
   - DKIM
   - DMARC
7. Wait for DNS propagation.
8. Confirm both domains show valid status in Vercel.

## 12. GitHub and Security Scan Setup

1. Store source code in the customer-approved GitHub repository.
2. Enable branch protection for the production branch if required.
3. Enable Dependabot/security alerts if available.
4. Confirm production deploy workflow exists:

```text
.github/workflows/deploy-production.yml
```

5. Add required GitHub Actions secrets for Vercel deployment if manual workflow is used:

```env
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

6. Run the security scan/deployment workflow after secrets are configured.

## 13. Local Development Setup

Frontend:

```powershell
npm install
npm run dev
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Local MongoDB using Docker:

```powershell
cd backend
docker compose -f docker-compose.mongo.yml up -d
```

Local frontend `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WARRANTY_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
PRODUCT_DATA_SOURCE=csv
```

Local backend `.env.local`:

```env
ENVIRONMENT=development
MONGODB_URI=mongodb://localhost:27018
MONGODB_DATABASE=limac
JWT_SECRET_KEY=local-development-secret-change-me
TURNSTILE_REQUIRED=false
BILL_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_BILL_FOLDER_ROOT=limac/warranty-bills
```

For local R2 testing:

```env
BILL_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=limac-warranty-bills
R2_BILL_KEY_PREFIX=limac/warranty-bills
```

## 14. Initial Admin Setup

Option A: Render bootstrap.

1. Add `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` in Render.
2. Deploy/restart backend.
3. Confirm admin login works.
4. Remove `INITIAL_ADMIN_PASSWORD` from Render.
5. Restart backend.

Option B: Run script locally against production database, only from a secure machine:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\create_admin.py --email admin@limac.in --role SUPER_ADMIN
```

Use this only if the environment is configured to point to the intended production MongoDB database.

## 15. Production Verification Checklist

After deployment:

1. Open public website:

```text
https://www.limac.in
```

2. Open warranty registration:

```text
https://www.limac.in/warranty/register
```

3. Confirm Turnstile appears.
4. Submit a test registration using valid test data.
5. Upload a JPG, PNG, or PDF bill under 2 MB.
6. Confirm MongoDB `warranty_registrations` has the record.
7. Confirm `bill_asset.provider` is correct:

```text
r2
```

or

```text
cloudinary
```

8. Login to admin:

```text
https://www.limac.in/admin/warranty/login
```

9. Open the registration.
10. Click **View bill** and confirm PDF/image preview opens.
11. Approve with replacement and service warranty dates.
12. Confirm product serial status changes to `REGISTERED`.
13. Confirm change log records approval.
14. Export CSV if super admin and check warranty/date/bill fields.

## 16. Operations Guide

### 16.1 Routine Checks

Weekly:

- Check Render service status and logs.
- Check MongoDB Atlas storage usage.
- Check Cloudflare R2 or Cloudinary storage usage.
- Check Vercel deployment status.
- Confirm warranty registration form is working.
- Confirm admin bill preview is working.

Monthly:

- Review admin users.
- Remove unused admin accounts.
- Confirm no exposed secrets are committed to Git.
- Review third-party usage against free-tier or paid plan limits.
- Export CSV backup if required by operations.

### 16.2 Backup Notes

- MongoDB Atlas should be the primary data backup source.
- Free tiers may have limited backup options.
- Before moving to production scale, enable a paid MongoDB tier with backup/snapshot support if required.
- Bill files are stored outside MongoDB, so database backup alone does not back up uploaded bills.
- For R2/Cloudinary, keep account access and object lifecycle settings under customer control.

### 16.3 Bill Storage Operation

Current max bill file size:

```text
2 MB per bill
```

Allowed file types:

```text
JPG, PNG, PDF
```

Hybrid storage behavior:

- `provider=cloudinary`: backend downloads from Cloudinary.
- `provider=r2`: backend downloads from R2.
- Frontend always uses backend `/bill-file`, so users do not need to know where the file is stored.

### 16.4 Switching New Uploads From Cloudinary to R2

1. Create R2 bucket and keys.
2. Add R2 variables in Render.
3. Keep Cloudinary variables in Render.
4. Set:

```env
BILL_STORAGE_PROVIDER=r2
```

5. Redeploy/restart backend.
6. Upload a new test bill.
7. Confirm new MongoDB record has:

```json
{
  "bill_asset": {
    "provider": "r2"
  }
}
```

8. Confirm old Cloudinary bills still open.

### 16.5 Secret Rotation

Rotate secrets if an account is compromised, a team member leaves, or credentials were exposed.

Rotate in this order:

1. Create new provider secret/key.
2. Add new secret to Render/Vercel/GitHub as applicable.
3. Redeploy affected service.
4. Verify application works.
5. Disable old secret/key.
6. Record the rotation date internally.

Secrets to rotate when needed:

- `JWT_SECRET_KEY`
- `MONGODB_URI` password
- `TURNSTILE_SECRET_KEY`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAYLOAD_SECRET`
- `VERCEL_TOKEN`

Changing `JWT_SECRET_KEY` invalidates existing admin sessions.

## 17. Troubleshooting

### Backend Cannot Start

Check:

- Render environment variables are present.
- MongoDB URI is correct.
- MongoDB network access allows Render.
- `JWT_SECRET_KEY` is set.
- Docker build completed successfully.

### Public Registration Fails Captcha

Check:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in Vercel.
- `TURNSTILE_SECRET_KEY` is set in Render.
- `TURNSTILE_REQUIRED=true` in production.
- Turnstile widget has correct domains.

### Bill Upload Fails

Check:

- File is JPG, PNG, or PDF.
- File is not empty.
- File is 2 MB or less.
- `BILL_STORAGE_PROVIDER` is set correctly.
- R2 or Cloudinary credentials are present in Render.
- R2 bucket permission includes object read/write.

### Bill Preview Fails

Check:

- MongoDB record has `bill_asset`.
- `bill_asset.provider` is `r2` or `cloudinary`.
- For R2, confirm `bucket` and `object_key`.
- For Cloudinary, confirm `asset_id` and `public_id`.
- Keep old provider credentials configured if old bills remain there.

### Admin Login Fails

Check:

- Admin user exists in MongoDB.
- Password is correct.
- `JWT_SECRET_KEY` is stable and not empty.
- MongoDB connection is healthy.
- Admin account is not disabled.

## 18. Production Environment Variable Checklist

Render backend:

```env
ENVIRONMENT=production
API_V1_PREFIX=/api/v1
MONGODB_URI=
MONGODB_DATABASE=limac
JWT_SECRET_KEY=
TURNSTILE_REQUIRED=true
TURNSTILE_SECRET_KEY=
BILL_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=limac-warranty-bills
R2_BILL_KEY_PREFIX=limac/warranty-bills
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_BILL_FOLDER_ROOT=limac/warranty-bills
CORS_ORIGINS=["https://www.limac.in","https://limac.in"]
```

Vercel frontend:

```env
NEXT_PUBLIC_SITE_URL=https://www.limac.in
NEXT_PUBLIC_WARRANTY_API_URL=https://<render-service-url>/api/v1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
PRODUCT_DATA_SOURCE=csv
PAYLOAD_URL=https://www.limac.in
PAYLOAD_SECRET=
PAYLOAD_API_KEY=
```

GitHub Actions, if using manual Vercel production workflow:

```env
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

## 19. Official References

- MongoDB Atlas free cluster: https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- MongoDB Atlas database users: https://www.mongodb.com/docs/atlas/security-add-mongodb-users/
- MongoDB Atlas connection guide: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- MongoDB Atlas network access: https://www.mongodb.com/docs/atlas/security/ip-access-list/
- Cloudflare Turnstile get started: https://developers.cloudflare.com/turnstile/get-started/
- Cloudflare Turnstile widgets: https://developers.cloudflare.com/turnstile/concepts/widget/
- Cloudflare R2 S3 API: https://developers.cloudflare.com/r2/api/s3/api/
- Cloudflare R2 S3 setup: https://developers.cloudflare.com/r2/get-started/s3/
- Cloudflare R2 tokens: https://developers.cloudflare.com/r2/api/tokens/
- Render Docker deployment: https://render.com/docs/docker
- Render web services: https://render.com/docs/web-services
- Render environment variables: https://render.com/docs/configure-environment-variables
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel Git deployments: https://vercel.com/docs/git
- Cloudinary credentials: https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials
- Cloudinary authenticated media: https://cloudinary.com/documentation/control_access_to_media
