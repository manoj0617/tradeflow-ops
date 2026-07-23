# TradeFlow Ops deployment runbook

This runbook deploys the case-study environment on Neon PostgreSQL and Vercel Services without paid infrastructure.

## Deployment order

1. Neon PostgreSQL
2. Vercel Services project
3. Production smoke test

Neon must come first because the backend service applies Prisma migrations and runs the idempotent seed during its Vercel build.

## 1. Neon PostgreSQL

1. Create a Neon project in a region close to the Vercel function region.
2. Create the `tradeflow` database if the project did not create it automatically.
3. Copy the PostgreSQL connection string. Keep it private.
4. You may place it in `backend/.env` for local development. That file is Git-ignored.
5. Never put the database URL in a `VITE_` variable because Vite exposes those values to browsers.

## 2. Vercel Services

Import the GitHub repository and use these project settings:

| Setting | Value |
|---|---|
| Application preset | Services |
| Root directory | `./` |
| Production branch | `main` |

The root `vercel.json` defines two services:

- `frontend`: Vite from `frontend/`
- `backend`: Express from `backend/`, publicly routed at `/api`

The backend build installs from the lockfile, generates Prisma Client, compiles TypeScript, applies committed migrations, and runs the idempotent seed.

### Vercel environment variables

Add these in Project Settings -> Environment Variables before the first production deployment:

| Variable | Environments | Value |
|---|---|---|
| `DATABASE_URL` | Production and Preview | Neon PostgreSQL connection string |
| `JWT_SECRET` | Production and Preview | Random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | Production and Preview | `2h` |
| `NODE_ENV` | Production and Preview | `production` |
| `SEED_PASSWORD` | Production and Preview | Strong password for all four demo users |
| `CORS_ORIGIN` | Production | Exact Vercel production origin after it is assigned |

`VITE_API_BASE_URL` is not required on Vercel. Production frontend requests use the same-origin `/api` path. For local development, the frontend continues to default to `http://localhost:4000/api`.

For the initial deployment, `CORS_ORIGIN` may be set to the expected production origin, such as:

```text
https://tradeflow-ops.vercel.app
```

If Vercel assigns a different production domain, update the variable and redeploy. Preview requests remain same-origin through the Services router.

## 3. Verify production

Use the single Vercel production domain for both surfaces:

```text
Frontend: https://your-project.vercel.app
API:      https://your-project.vercel.app/api
Health:   https://your-project.vercel.app/api/health
```

Run this smoke test:

1. Open the Vercel URL in a private browser window.
2. Sign in as Admin.
3. Open customers, products, the stock ledger, and challans.
4. Create a customer and product.
5. Create and confirm a challan; confirm that stock decreases and an OUT movement exists.
6. Cancel the challan; confirm that stock is restored through an IN movement.
7. Sign in once with each non-admin account and verify actions match its role.
8. Run the Postman collection with `baseUrl` set to the Vercel URL plus `/api`.

## Demo accounts

The seed creates these accounts. All use the deployed `SEED_PASSWORD`.

| Role | Email |
|---|---|
| Admin | `admin@tradeflow.local` |
| Sales | `sales@tradeflow.local` |
| Warehouse | `warehouse@tradeflow.local` |
| Accounts | `accounts@tradeflow.local` |

## Render fallback

If Vercel Services is unavailable or fails because the feature is still in beta, deploy the backend using the committed `render.yaml`, keep the frontend on Vercel, and set `VITE_API_BASE_URL` to the Render URL plus `/api`.

## Submission update

Before submitting, add these items to `README.md` and the submission message:

1. GitHub repository URL
2. Vercel frontend URL
3. Vercel backend API URL (`/api` on the same domain)
4. Credentials for all four roles
5. Postman collection path
6. Architecture summary
7. Known limitations
8. A short screen-recording URL

Never commit Neon credentials, JWT secrets, deployed passwords, `.env` files, or provider tokens.
