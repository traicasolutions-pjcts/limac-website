# Deployment Runbook

This document explains how to deploy the website to Vercel and point a BigRock-managed domain to the new deployment.

Do not add real passwords, API keys, secret values, private IP addresses, or production domain names to this file. Use placeholders when documenting examples.

## Overview

The website is a Next.js application. Deploy it as a Node/Next.js app on Vercel, then update the domain DNS in BigRock so the public URL points to Vercel.

Flow:

```text
Domain registrar / DNS provider -> Vercel -> Next.js application
```

## Before You Start

Confirm you have access to:

- BigRock account for the domain.
- GitHub repository that contains this project.
- Vercel account.
- Any required third-party service accounts, such as email, CMS/database, or chatbot providers.

Confirm the app builds locally:

```bash
npm install
npm run build
```

## Vercel Deployment

1. Log in to Vercel.
2. Import the GitHub repository.
3. Confirm Vercel detects the project as `Next.js`.
4. Use the default build settings unless the project requires otherwise:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

5. Add environment variables in Vercel.

Required or commonly used:

```env
NEXT_PUBLIC_SITE_URL=https://www.example.com
PAYLOAD_URL=https://www.example.com
PRODUCT_DATA_SOURCE=csv
PAYLOAD_SECRET=<generated-secret-value>
```

Optional, depending on enabled features:

```env
RESEND_API_KEY=<email-provider-api-key>
ANTHROPIC_API_KEY=<chatbot-api-key>
MONGODB_URI=<database-connection-string>
PAYLOAD_API_KEY=<payload-api-key>
```

6. Deploy the project.
7. Open the temporary Vercel URL and confirm the site loads.

## Manual Production Workflow

The repository includes a manual GitHub Actions workflow for production deployment:

```text
.github/workflows/deploy-production.yml
```

Add these repository secrets in GitHub before running the workflow:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

To run the workflow:

1. Open the GitHub repository.
2. Go to `Actions`.
3. Select `Deploy Production`.
4. Click `Run workflow`.
5. Enter `deploy` in the confirmation field.
6. Run the workflow from the branch that should be deployed.

Keep production environment variables in Vercel. The workflow pulls the production environment from Vercel during deployment.

## Generate `PAYLOAD_SECRET`

Generate a long random value locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated value only in Vercel environment variables or a local `.env` file. Do not commit it.

## Add The Domain In Vercel

1. Open the Vercel project.
2. Go to `Settings -> Domains`.
3. Add the apex domain and the `www` domain.
4. If the site should use `www`, enable the option to redirect the apex domain to `www`.
5. Vercel will show the DNS records required for the domain.

Use the exact DNS values shown by Vercel. Do not guess record values from old notes.

## BigRock DNS Setup

1. Log in to BigRock.
2. Open the domain.
3. Check `Name Servers`.
4. If the domain is still using an old hosting provider's nameservers, change it to BigRock nameservers or the nameservers required by the chosen DNS provider.
5. Open `DNS Records`.
6. Add or update the records requested by Vercel.

Typical shape:

```text
Type: A
Host / Name: @
Value: <vercel-apex-target>
TTL: default
```

```text
Type: CNAME
Host / Name: www
Value: <vercel-cname-target>
TTL: default
```

Notes:

- Some DNS panels use the root domain instead of `@`.
- Some DNS panels allow the root host field to be left blank.
- Do not delete email-related records unless intentionally changing email hosting.

Keep records such as these when email is in use:

```text
MX
TXT
SPF
DKIM
DMARC
```

## Replacing An Old Vendor Website

If an old vendor deployed the previous website, the old hosting server may still exist. You usually do not need access to that server to replace the public website.

The important control point is DNS:

```text
Old setup: domain -> old hosting provider -> old website
New setup: domain -> Vercel -> new website
```

If BigRock DNS records appear empty but the old website still loads, check the domain nameservers. The domain may be using an external DNS provider. Change the nameservers first, then manage DNS records in BigRock.

## Verification

After updating DNS:

1. Wait for DNS propagation. This may take minutes, but can take several hours.
2. In Vercel, open `Settings -> Domains`.
3. Confirm each domain shows `Valid Configuration`.
4. Test both URLs:

```text
https://example.com
https://www.example.com
```

5. If the browser still shows the old website, try:

```bash
ipconfig /flushdns
```

Then test in an incognito window or on mobile data.

## Troubleshooting

If Vercel shows `Invalid Configuration`:

- Confirm the DNS records match the exact values shown in Vercel.
- Confirm the domain is using the same DNS provider where the records were added.
- Check whether old nameservers are still active.
- Wait for propagation and click refresh/verify in Vercel.

If the browser shows a connection or SSL error:

- Confirm Vercel domain status is valid.
- Wait for Vercel to finish issuing SSL.
- Try another network or incognito mode.
- Avoid repeatedly changing DNS records while propagation is still in progress.

If the temporary Vercel URL does not load:

- Check the latest Vercel deployment logs.
- Confirm the deployment completed successfully.
- Re-run `npm run build` locally to reproduce build failures.

## Rollback

To roll back to a previous deployment:

1. Open the Vercel project.
2. Go to `Deployments`.
3. Select a previous successful deployment.
4. Promote it to production.

To roll back DNS to an old provider, restore the previous nameservers or DNS records from a saved screenshot. Only do this if intentionally returning traffic to the old hosting provider.
