# TradeFlow Ops

TradeFlow Ops is a compact ERP + CRM operations portal for wholesale and distribution teams. It connects customer follow-ups, product stock, an auditable movement ledger, and transactional sales challans with role-based access.

## Architecture

```text
React + MUI + TanStack Query
           |
       REST / JWT
           |
Express routes -> controllers -> services -> Prisma repositories
           |
       PostgreSQL
```

The service layer owns status transitions and transaction boundaries. Confirming a challan locks the relevant records, validates every line, decrements stock, writes movement records, and marks the challan confirmed in one PostgreSQL transaction.

## Applications

- `backend/`: TypeScript, Express, Prisma, PostgreSQL, Zod, JWT.
- `frontend/`: React, TypeScript, Vite, MUI, TanStack Query.
- `postman/`: API collection and local environment.

## Local setup

### Prerequisites

- Node.js 20 or newer.
- npm 10 or newer.
- PostgreSQL 15 or newer, or Docker Desktop.

### 1. Start PostgreSQL

```bash
docker compose up -d db
```

### 2. Configure and run the backend

```bash
cd backend
copy .env.example .env
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

On macOS/Linux, use `cp .env.example .env`.

### 3. Configure and run the frontend

```bash
cd frontend
copy .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:4000/api`.

## Demo users

The seed creates one account per required role. Their default password is `TradeFlow@123` unless `SEED_PASSWORD` is set.

| Role | Email |
|---|---|
| Admin | `admin@tradeflow.local` |
| Sales | `sales@tradeflow.local` |
| Warehouse | `warehouse@tradeflow.local` |
| Accounts | `accounts@tradeflow.local` |

These credentials are for the case-study environment only.

## Commands

Backend:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run db:migrate
npm run db:seed
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run test
```

## Environment variables

Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`, `NODE_ENV`, `LOG_LEVEL`, and optional `SEED_PASSWORD`.

Frontend: `VITE_API_BASE_URL`.

Never commit real environment values. Templates are provided in each application.

## Roles

- Admin: complete access.
- Sales: customer/follow-up management, product and movement visibility, challan creation and confirmation.
- Warehouse: product and stock management, customer and challan visibility.
- Accounts: read-only access to customers, products, movements, and challans.

The API enforces roles even when the frontend hides an action.

## Deployment

1. Provision PostgreSQL on Neon, Supabase, or another provider.
2. Deploy `backend/` to Render or Railway and set backend environment variables.
3. Run `npm run db:deploy` followed by `npm run db:seed` once.
4. Deploy `frontend/` to Vercel or Netlify with `VITE_API_BASE_URL` pointing to the backend `/api` URL.
5. Set `CORS_ORIGIN` to the exact frontend origin.
6. Verify `/api/health`, then run the Postman collection against production.

## Assumptions and known limitations

- Stock uses whole units and products have one current warehouse.
- GST numbers are stored but not verified externally.
- Confirmed challans are immutable; cancellation restores stock through compensating movements.
- Products are archived instead of physically deleted once referenced.
- Purchase orders, invoicing, returns, warehouse transfers, refresh tokens, and multi-tenancy are outside this case-study scope.
- JWT is stored in `sessionStorage` for the demo. A production deployment should use short-lived access tokens with rotated HTTP-only refresh cookies.

