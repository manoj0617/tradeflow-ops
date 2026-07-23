# TradeFlow Ops deployment runbook

This runbook deploys the case-study environment without paid infrastructure.

## Deployment order

Use this order because each layer needs the URL produced by the layer below it:

1. Neon PostgreSQL
2. Render API
3. Vercel frontend
4. Final Render CORS update

## 1. Neon PostgreSQL

1. Create a Neon project in a region close to the Render service.
2. Create the `tradeflow` database if the project did not create it automatically.
3. Copy the direct PostgreSQL connection string. Keep it private.
4. Do not commit this value to Git or store it in a frontend environment variable.

The Render build runs committed Prisma migrations and the idempotent seed. The seed creates the demo warehouse, products, customer, follow-up, and all four role accounts.

## 2. Render API

1. In Render, create a new Blueprint connected to this repository.
2. Select the root `render.yaml` file.
3. Provide the prompted secret values:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon direct PostgreSQL connection string |
| `JWT_SECRET` | Render-generated value from the blueprint |
| `SEED_PASSWORD` | A strong password shared by the four demo accounts |
| `CORS_ORIGIN` | `http://localhost:5180` temporarily; replace after Vercel deploys |

The blueprint configures Node 22, installs from the lockfile, generates Prisma Client, builds the API, applies migrations, runs the idempotent seed, starts the compiled server, and checks `/api/health`.

Save the resulting URL, for example:

```text
https://tradeflow-ops-api.onrender.com
```

Verify:

```text
https://tradeflow-ops-api.onrender.com/api/health
```

The free Render service may sleep after inactivity, so the first request can be slow.

## 3. Vercel frontend

Import the same GitHub repository with these project settings:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | `frontend` |
| Install command | `npm ci --no-audit --no-fund` |
| Build command | `npm run build` |
| Output directory | `dist` |

Add this production environment variable before deploying:

```text
VITE_API_BASE_URL=https://tradeflow-ops-api.onrender.com/api
```

`frontend/vercel.json` rewrites application routes to `index.html`, so direct visits to `/customers`, `/products`, and `/challans` work.

## 4. Final CORS update

In Render, replace the temporary `CORS_ORIGIN` with the exact Vercel production origin, without a trailing slash:

```text
CORS_ORIGIN=https://your-tradeflow-project.vercel.app
```

For both production and local access, use a comma-separated list:

```text
CORS_ORIGIN=https://your-tradeflow-project.vercel.app,http://localhost:5180
```

Redeploy or restart the Render service after changing the variable.

## Production smoke test

1. Open the Vercel URL in a private browser window.
2. Sign in as Admin.
3. Open customers, products, the stock ledger, and challans.
4. Create a customer and product.
5. Create and confirm a challan; confirm that stock decreases and an OUT movement exists.
6. Cancel the challan; confirm that stock is restored through an IN movement.
7. Sign in once with each non-admin account and verify actions match its role.
8. Run the Postman collection with its `baseUrl` set to the Render URL plus `/api`.

## Demo accounts

The seed creates these accounts. All use the deployed `SEED_PASSWORD`.

| Role | Email |
|---|---|
| Admin | `admin@tradeflow.local` |
| Sales | `sales@tradeflow.local` |
| Warehouse | `warehouse@tradeflow.local` |
| Accounts | `accounts@tradeflow.local` |

## Submission update

Before submitting, add the following to `README.md` and the submission message:

1. GitHub repository URL
2. Vercel frontend URL
3. Render backend API URL
4. Credentials for all four roles
5. Postman collection path
6. Architecture summary
7. Known limitations
8. A short screen-recording URL as a fallback for free-tier cold starts

Never commit Neon credentials, JWT secrets, deployed passwords, or provider tokens.
