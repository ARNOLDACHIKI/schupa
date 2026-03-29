# Schupa Connect

Scholarship application platform with a Vite frontend and Express + Prisma backend.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + Prisma
- Database: PostgreSQL
- Email: SMTP (Gmail, SendGrid, Mailpit, etc.)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Set required values in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- `VITE_API_URL` (for local, typically `http://localhost:4000/api`)

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run app:

```bash
npm run dev:full
```

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:4000`

## Vercel Deployment

This repository is configured to deploy both layers on Vercel:

- Frontend as static build output (`dist`)
- Backend as serverless function via `api/[...all].js`

Configuration is in `vercel.json`.

### Steps

1. Import this repo into Vercel.
2. Keep build command as default (`npm run build`).
3. Set the following Vercel Environment Variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL` (your Vercel app URL, e.g. `https://your-app.vercel.app`)
- `CORS_ORIGIN` (same as `FRONTEND_URL`)
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`

Important for preview deployments:

- Add these variables to both Production and Preview environments in Vercel.
- If a preview URL should be shared for testing, disable Vercel Deployment Protection for that preview (or use a protection bypass) so `/api/*` routes are reachable.

For Neon, use the SSL connection string format in `DATABASE_URL`, for example:

`postgresql://USER:PASSWORD@HOST/DB?sslmode=require`

4. Deploy.

The frontend defaults to same-origin API calls (`/api`) in production when `VITE_API_URL` is not set, so no extra frontend API URL is required on Vercel.

## Verify Deployment

After deploy:

1. Open `/api/health` and confirm `{ "ok": true }`.
2. Create a new scholarship applicant account.
3. Verify applicant cannot sign in until approved.
4. Approve applicant in admin dashboard.
5. Verify applicant can sign in after approval.
6. Send a contact inquiry and confirm acknowledgement/reply email flow.

## Notes

- Uploaded files use local filesystem in development.
- On serverless platforms, local filesystem storage is temporary. For production-grade document retention, use durable object storage (S3, Vercel Blob, Cloudinary, etc.).
# schupa
