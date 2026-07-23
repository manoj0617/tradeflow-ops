# TradeFlow Ops

[![CI](https://github.com/manoj0617/tradeflow-ops/actions/workflows/ci.yml/badge.svg)](https://github.com/manoj0617/tradeflow-ops/actions/workflows/ci.yml)

TradeFlow Ops is a full-stack ERP and CRM case study for wholesale and distribution teams. It connects customer follow-ups, warehouse stock, an auditable movement ledger, and sales challans while enforcing role-based access and transactional inventory rules.

## Live application

| Resource | Link |
|---|---|
| Application | [tradeflow-ops.vercel.app](https://tradeflow-ops.vercel.app) |
| API base | [tradeflow-ops.vercel.app/api](https://tradeflow-ops.vercel.app/api) |
| Health check | [tradeflow-ops.vercel.app/api/health](https://tradeflow-ops.vercel.app/api/health) |
| Source code | [github.com/manoj0617/tradeflow-ops](https://github.com/manoj0617/tradeflow-ops) |

The application and API are deployed together with Vercel Services. PostgreSQL is hosted on Neon.

## Case-study coverage

- Customer profiles, statuses, search, follow-up dates, notes, and follow-up history.
- Products, warehouses, minimum-stock thresholds, stock adjustments, and an immutable movement ledger.
- Draft, confirmed, and cancelled sales challans with line-item snapshots.
- Atomic challan confirmation: validate stock, deduct inventory, write ledger entries, and update status in one PostgreSQL transaction.
- Compensating stock movements when a confirmed challan is cancelled.
- Admin, Sales, Warehouse, and Accounts roles enforced by both the UI and API.
- Responsive React interface with loading, empty, validation, permission, and error states.
- Automated backend, integration, schema, and frontend tests in GitHub Actions.

## Architecture

```text
Browser
  |
  | HTTPS, REST, Bearer JWT
  v
Vercel Services
  |-- React + Vite + MUI + TanStack Query
  `-- Express + TypeScript + Zod
         |
         | Prisma ORM
         v
      Neon PostgreSQL
```

The backend follows a route → controller → service → repository flow. Controllers translate HTTP requests, services own business rules and transaction boundaries, and repositories isolate persistence. Prisma migrations define the database contract.

The root `vercel.json` routes `/api/*` to Express and all remaining paths to Vite. This same-origin arrangement avoids a separate public API origin in production.

## Key inventory invariant

Stock is changed only through controlled service operations. Confirming a challan locks the relevant product records, verifies every requested quantity, decrements stock, records the resulting balance, and confirms the document atomically. If any line fails, the complete transaction rolls back.

Confirmed challans are not edited. Cancelling one records compensating `IN` movements, which preserves the audit history instead of rewriting it.

## Demo accounts

The isolated case-study seed creates the following users:

| Role | Email | Case-study password |
|---|---|---|
| Admin | `admin@tradeflow.local` | `TradeFlow@123` |
| Sales | `sales@tradeflow.local` | `TradeFlow@123` |
| Warehouse | `warehouse@tradeflow.local` | `TradeFlow@123` |
| Accounts | `accounts@tradeflow.local` | `TradeFlow@123` |

These credentials are only for the demo environment and must not be reused for a real system. A deployment can override the seed password with `SEED_PASSWORD`.

## Role matrix

| Capability | Admin | Sales | Warehouse | Accounts |
|---|:---:|:---:|:---:|:---:|
| View dashboard and operational records | Yes | Yes | Yes | Yes |
| Create/update customers and follow-ups | Yes | Yes | No | No |
| Create/update products and adjust stock | Yes | No | Yes | No |
| Create/update/confirm/cancel challans | Yes | Yes | No | No |
| View products, stock ledger, and challans | Yes | Yes | Yes | Yes |

Authorization is enforced server-side; hiding an action in the frontend is not treated as a security boundary.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Material UI, TanStack Query, React Hook Form, Zod |
| Backend | Node.js 20+, Express 5, TypeScript, Zod, JWT, bcrypt |
| Data | PostgreSQL, Prisma ORM |
| Hosting | Vercel Services, Neon PostgreSQL |
| Quality | Vitest, Supertest, TypeScript checks, GitHub Actions |

## Local setup

### Prerequisites

- Node.js 20 or newer.
- npm 10 or newer.
- PostgreSQL 15 or newer, or Docker Desktop.

This repository uses npm and committed lockfiles for both applications.

### 1. Start PostgreSQL

```bash
docker compose up -d db
```

### 2. Start the backend

Windows PowerShell:

```powershell
Set-Location backend
Copy-Item .env.example .env
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

macOS/Linux:

```bash
cd backend
cp .env.example .env
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### 3. Start the frontend

Windows PowerShell:

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

macOS/Linux:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`. The local API is `http://localhost:4000/api`.

## Environment variables

### Backend

| Variable | Required | Purpose |
|---|:---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret; use at least 32 random characters |
| `JWT_EXPIRES_IN` | No | Access-token lifetime; defaults are defined by the application |
| `CORS_ORIGIN` | Yes | Allowed browser origin |
| `PORT` | No | Local server port |
| `NODE_ENV` | No | Runtime environment |
| `LOG_LEVEL` | No | Application logging level |
| `SEED_PASSWORD` | No | Overrides the demo seed password |

### Frontend

| Variable | Required | Purpose |
|---|:---:|---|
| `VITE_API_BASE_URL` | Local/standalone only | API base URL; omitted for same-origin Vercel deployment |

Never commit `.env` files, database URLs, JWT secrets, or provider tokens.

## Commands

Run commands from the relevant package directory.

Backend:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run preview
```

## API overview

All protected endpoints require `Authorization: Bearer <token>`.

| Area | Methods and endpoints |
|---|---|
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Dashboard | `GET /api/dashboard/summary` |
| Customers | `GET/POST /api/customers`, `GET/PATCH /api/customers/:id`, `POST /api/customers/:id/follow-ups` |
| Inventory | `GET /api/warehouses`, `GET/POST /api/products`, `GET/PATCH /api/products/:id`, `POST /api/products/:id/stock-adjustments` |
| Stock ledger | `GET /api/stock-movements` |
| Challans | `GET/POST /api/challans`, `GET/PATCH /api/challans/:id`, `POST /api/challans/:id/confirm`, `POST /api/challans/:id/cancel` |

The Postman collection is available at [`postman/TradeFlow-Ops.postman_collection.json`](./postman/TradeFlow-Ops.postman_collection.json).

## Verification

GitHub Actions runs on pushes to `main` and pull requests. It installs from both lockfiles, provisions PostgreSQL for the backend, applies migrations and seed data, then runs:

- Backend TypeScript checks, unit/integration tests, and production build.
- Frontend TypeScript checks, tests, and production build.

The deployed health, login, and authenticated stock-movement endpoints were smoke-tested after the Vercel deployment.

## Repository structure

```text
tradeflow-ops/
|-- backend/              Express, services, Prisma, migrations, tests
|-- frontend/             React application and frontend tests
|-- postman/              API collection and environment template
|-- .github/workflows/    Continuous integration
|-- vercel.json           Multi-service production routing
|-- render.yaml           Optional backend fallback
|-- DEPLOYMENT.md         Deployment and operations runbook
|-- PRODUCT.md            Product scope and acceptance criteria
|-- DESIGN.md             Interface principles and design system
`-- SUBMISSION.md         Required case-study links and final checklist
```

## Assumptions and known limitations

- Stock is represented in whole units and each product belongs to one current warehouse.
- GST numbers are stored but are not verified against an external service.
- Confirmed challans are immutable; cancellation restores stock through compensating movements.
- Products referenced by operations are archived rather than physically deleted.
- Purchase orders, invoices, returns, warehouse transfers, refresh-token rotation, multi-tenancy, and external notifications are outside this case-study scope.
- The demo stores its short-lived JWT in `sessionStorage`. A production-grade public system should add rotated HTTP-only refresh cookies and stronger session revocation.
- Vercel serverless execution is appropriate for the case study; long-running jobs would require a worker/queue architecture.

## Documentation

- [Deployment and operations](./DEPLOYMENT.md)
- [Product scope](./PRODUCT.md)
- [Design system](./DESIGN.md)
- [Submission checklist](./SUBMISSION.md)

## Submission

The assessment requests four links: résumé, GitHub repository, documentation, and recording. Use this README as the documentation link:

`https://github.com/manoj0617/tradeflow-ops/blob/main/README.md`

See [SUBMISSION.md](./SUBMISSION.md) before submitting.
