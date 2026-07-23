# TradeFlow Ops product specification

## Product summary

TradeFlow Ops is an internal ERP and CRM operations portal for wholesale and distribution teams. It provides one dependable workflow from customer follow-up through warehouse dispatch while preserving role boundaries, stock accuracy, and an explainable audit trail.

## Users

| Role | Primary responsibility |
|---|---|
| Admin | Supervise the complete operation and resolve exceptional cases |
| Sales | Manage customers, follow-ups, and sales challans |
| Warehouse | Maintain product data and adjust physical stock |
| Accounts | Review customers, products, movements, and commercial records |

Users may work on shared office laptops and warehouse tablets, often under time pressure. The next safe action must be understandable without specialist training.

## Product goals

- Give teams a shared source of truth for customers, stock, movements, and challans.
- Prevent negative stock during dispatch.
- Make every inventory change traceable to a user, time, reason, balance, and source record.
- Keep sales and warehouse responsibilities separate through server-enforced roles.
- Make common operational workflows fast while making stock-changing actions explicit.

## Functional scope

### Dashboard

- Active customer, follow-up, low-stock, and draft-challan summaries.
- Recent stock movements with direct navigation to operational records.

### Customer relationship management

- Create, search, filter, inspect, and update customers.
- Track lead, active, and inactive states.
- Record follow-up notes and next follow-up dates.
- Preserve a chronological follow-up history.

### Inventory

- Create, search, filter, inspect, update, and archive products.
- Associate products with a warehouse.
- Track current and minimum stock.
- Add authorized `IN` or `OUT` adjustments with reasons.
- Display a chronological stock ledger with the balance after every movement.

### Sales challans

- Create draft challans for customers with one or more product lines.
- Snapshot product name, SKU, and unit price on each line.
- Confirm a draft only when all requested stock is available.
- Deduct stock and create `OUT` movements atomically.
- Cancel a confirmed challan using compensating `IN` movements.
- Keep confirmed documents immutable.

### Authentication and authorization

- Authenticate internal users with email and password.
- Issue time-limited Bearer JWTs.
- Enforce Admin, Sales, Warehouse, and Accounts permissions in the API.
- Present role-appropriate actions in the frontend.

## Critical business rules

1. A stock quantity and movement quantity must be a positive whole number.
2. An `OUT` operation cannot reduce a product below zero.
3. A challan cannot contain the same product twice.
4. Only a draft challan can be edited or confirmed.
5. Confirmation either completes for every line or changes nothing.
6. Only a confirmed challan can be cancelled.
7. Cancellation requires a reason and restores stock with ledger entries.
8. Referenced products are archived rather than deleted.
9. Authorization is checked on the server for every mutating operation.

## Primary workflow

```text
Sales records customer intent
  -> Sales creates a draft challan
  -> System validates every line
  -> Sales confirms the challan
  -> Stock is deducted and ledger entries are created
  -> Warehouse and Accounts can review the result
```

## Success criteria

- A user can move from customer selection to confirmed dispatch without leaving the application.
- Concurrent or invalid confirmation attempts cannot produce negative stock.
- A reviewer can explain current stock by reading the movement ledger.
- A cancelled challan restores exactly the quantity previously deducted.
- Unauthorized roles receive a clear API denial even if they call the endpoint directly.
- Lists remain usable with pagination, search, filters, loading states, and empty states.
- Core workflows pass automated tests and the production smoke test.

## Non-functional requirements

- Responsive from 375px mobile widths through desktop.
- WCAG 2.1 AA-oriented contrast, focus, labels, keyboard use, and status communication.
- Structured validation and error envelopes.
- Database migrations committed to version control.
- Secrets supplied through environment variables.
- Reproducible npm installs through committed lockfiles.
- CI checks for types, tests, builds, migrations, and seed behavior.

## Assumptions

- Quantities use whole units.
- Each product belongs to one current warehouse.
- The case-study instance represents one organization.
- All users are trusted employees, while their actions remain role-constrained.
- Reviewer/demo data is synthetic.

## Out of scope

- Purchase orders, invoices, payments, taxation calculations, and accounting integration.
- Returns, partial cancellations, and warehouse transfers.
- Multiple organizations or tenant isolation.
- Offline operation and barcode scanning.
- External GST validation, email/SMS notifications, and file attachments.
- Background job processing and analytics warehousing.
- Refresh-token rotation and enterprise single sign-on.

## Future evolution

1. Add purchase, return, transfer, and invoice workflows.
2. Introduce multi-warehouse stock allocation and reservation.
3. Add HTTP-only refresh-token rotation and session revocation.
4. Add tenant isolation and organization administration.
5. Add outbox-driven notifications and background workers.
6. Add operational metrics, audit exports, and reconciliation reports.
