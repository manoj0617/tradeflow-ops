# TradeFlow Ops deployment and operations runbook

TradeFlow Ops is deployed as a same-origin Vercel Services application backed by Neon PostgreSQL.

## Production endpoints

| Surface | URL |
|---|---|
| Frontend | [https://tradeflow-ops.vercel.app](https://tradeflow-ops.vercel.app) |
| API | [https://tradeflow-ops.vercel.app/api](https://tradeflow-ops.vercel.app/api) |
| Health | [https://tradeflow-ops.vercel.app/api/health](https://tradeflow-ops.vercel.app/api/health) |

The health endpoint should return HTTP `200` with a JSON payload containing `data.status: "ok"`.

## Production architecture

1. Vercel pulls `main` from `manoj0617/tradeflow-ops`.
2. The root `vercel.json` builds two services:
   - `frontend`: Vite application from `frontend/`.
   - `backend`: Express application from `backend/`.
3. `/api/*` is rewritten to the backend; every other path is rewritten to the frontend.
4. The backend connects to Neon through `DATABASE_URL`.
5. The backend build generates Prisma Client, compiles TypeScript, deploys committed migrations, and runs the idempotent seed.

## Deployment order

1. Provision Neon PostgreSQL.
2. Configure Vercel environment variables.
3. Import and deploy the GitHub repository with the Vercel Services preset.
4. Smoke-test the live application.
5. Verify GitHub Actions on the deployed commit.

## Neon PostgreSQL

1. Create a Neon project in a region close to the Vercel function region.
2. Use the default database or create a dedicated `tradeflow` database.
3. Copy the pooled PostgreSQL connection string.
4. Save it as `DATABASE_URL` in Vercel.
5. For local development only, it may be placed in `backend/.env`, which is Git-ignored.

Never place a database URL in a `VITE_` variable; Vite variables are bundled into browser code.

## Vercel project configuration

Import the repository with:

| Setting | Value |
|---|---|
| Repository | `manoj0617/tradeflow-ops` |
| Application preset | Services |
| Root directory | `./` |
| Production branch | `main` |

The committed `vercel.json` is authoritative. The backend entry module default-exports the Express app so that Vercel can invoke it as a serverless service.

## Environment variables

Configure these under Vercel Project Settings → Environment Variables:

| Variable | Environments | Guidance |
|---|---|---|
| `DATABASE_URL` | Production and Preview | Neon PostgreSQL connection string |
| `JWT_SECRET` | Production and Preview | At least 32 random characters |
| `JWT_EXPIRES_IN` | Production and Preview | For example, `2h` |
| `NODE_ENV` | Production and Preview | `production` |
| `SEED_PASSWORD` | Production and Preview | Password for isolated reviewer accounts |
| `CORS_ORIGIN` | Production | `https://tradeflow-ops.vercel.app` |
| `LOG_LEVEL` | Production and Preview | Recommended: `info` |

`VITE_API_BASE_URL` is not required for this deployment because the browser uses the same-origin `/api` route.

After changing any environment variable, redeploy so the updated value reaches the services.

## Build behavior

Frontend service:

```bash
npm ci --include=dev --no-audit --no-fund
npm run build
```

Backend service:

```bash
npm ci --include=dev --no-audit --no-fund
npm run db:generate
npm run build
npm run db:deploy
npm run db:seed
```

Development dependencies are explicitly included because TypeScript, Vite, Prisma CLI, and `tsx` are build-time tools.

## Production smoke test

Run this flow after every production deployment:

1. Open the live URL in a private browser window.
2. Confirm `/api/health` returns HTTP `200`.
3. Sign in as Admin.
4. Open dashboard, customers, products, stock movements, and challans.
5. Create a customer.
6. Create a product or choose an existing product with sufficient stock.
7. Create and confirm a challan.
8. Verify stock decreases and an `OUT` movement references the challan.
9. Cancel the challan.
10. Verify stock is restored through an `IN` movement.
11. Sign in with Sales, Warehouse, and Accounts users and verify the role matrix.
12. Run the Postman collection with `baseUrl` set to `https://tradeflow-ops.vercel.app/api`.

The deployed health endpoint, demo login, and protected stock-movement list were successfully smoke-tested after deployment.

## Demo accounts

The seed creates one isolated account per role:

| Role | Email |
|---|---|
| Admin | `admin@tradeflow.local` |
| Sales | `sales@tradeflow.local` |
| Warehouse | `warehouse@tradeflow.local` |
| Accounts | `accounts@tradeflow.local` |

The repository fallback password is `TradeFlow@123`. `SEED_PASSWORD` can override it for deployment. Do not reuse this password outside the case-study environment.

## Troubleshooting

### Build reports `tsc: command not found`

Ensure each Vercel service uses:

```text
npm ci --include=dev --no-audit --no-fund
```

Build tools are development dependencies and must be installed during the build.

### API returns a generic HTTP 500 immediately

Check Vercel runtime logs. The Express entry module must default-export the app:

```ts
export default app;
```

Also verify `DATABASE_URL`, `JWT_SECRET`, migrations, and Prisma Client generation.

### Protected endpoint returns HTTP 401

Login returns a Bearer token. Send:

```text
Authorization: Bearer <token>
```

The backend does not use an authentication cookie.

### API list endpoint returns HTTP 422

Inspect the error details and query parameters. Empty optional filters are normalized by the current schemas, while `page` and `limit` still must be valid positive integers.

### Browser shows an older deployment

Confirm the production alias points to the latest `main` deployment, then perform a hard refresh or use a private window.

## Security and operations checklist

- Keep `.env` files and credentials out of Git.
- Use separate secrets for local, Preview, and Production.
- Restrict Neon credentials and rotate them if exposed.
- Rotate `JWT_SECRET` and reviewer passwords before any public/non-demo use.
- Keep demo data synthetic and free of personal information.
- Review Vercel runtime logs without logging passwords or tokens.
- Confirm GitHub Actions passes before treating a deployment as releasable.
- Prefer additive Prisma migrations; do not run destructive development migrations in production.

## Rollback

If a release is faulty:

1. Promote the previous known-good Vercel deployment.
2. Confirm the production alias and `/api/health`.
3. Revert the faulty Git commit through a new commit.
4. Avoid reversing an already-applied database migration until its data impact is understood.
5. Add a forward migration when possible.

## Render fallback

`render.yaml` is retained only as an optional backend fallback. It is not required for the current submission because both frontend and backend are working through Vercel Services.

If used:

1. Deploy the backend with `render.yaml`.
2. Keep the frontend on Vercel.
3. Set `VITE_API_BASE_URL` to the Render backend URL plus `/api`.
4. Set `CORS_ORIGIN` to the Vercel frontend origin.
5. Rebuild the frontend and repeat the smoke test.

## Submission readiness

The assessment form requests only:

1. Résumé link.
2. GitHub repository link.
3. Documentation link.
4. Recording link.

The deployment URL should be included inside the README and demonstrated in the recording, even though it is not a separate form field. See [SUBMISSION.md](./SUBMISSION.md).
