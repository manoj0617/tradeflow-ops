# TradeFlow Ops submission checklist

The assessment requests exactly four links. Replace the two placeholders below before submitting.

| Required field | Submission value |
|---|---|
| Résumé link | **Add public résumé URL** |
| GitHub repository | https://github.com/manoj0617/tradeflow-ops |
| Documentation link | https://github.com/manoj0617/tradeflow-ops/blob/main/README.md |
| Recording link | **Add public recording URL** |

## Live demo

The deployment is documented and demonstrated even though the assessment does not provide a separate deployment-link field:

- Application: https://tradeflow-ops.vercel.app
- Health check: https://tradeflow-ops.vercel.app/api/health

## Recording outline

Aim for a focused 5–10 minute walkthrough:

1. Introduce the problem and architecture.
2. Sign in as Admin and show the dashboard.
3. Create or inspect a customer and add a follow-up.
4. Create or inspect a product and show a stock adjustment.
5. Create and confirm a challan.
6. Show the reduced stock and linked `OUT` movement.
7. Cancel the challan and show the compensating `IN` movement.
8. Demonstrate one restricted role and explain server-side authorization.
9. Briefly show the repository, tests/CI, README, and deployment.
10. Close with assumptions and known limitations.

Do not expose Neon credentials, Vercel secrets, JWTs, `.env` contents, or personal browser data while recording.

## Final checks

- [ ] Repository is public or shared with the reviewer.
- [ ] GitHub Actions is green on the submitted commit.
- [ ] Live application opens in a private browser window.
- [ ] Health, login, and core workflow smoke tests pass.
- [ ] Demo credentials work and contain only synthetic data.
- [ ] README contains the live URL, architecture, setup, roles, API overview, and limitations.
- [ ] Résumé permission is “Anyone with the link can view.”
- [ ] Recording permission is “Anyone with the link can view.”
- [ ] Recording audio and text are clear.
- [ ] All four submitted URLs open without requesting access.

## Supporting documentation

- [README](./README.md)
- [Deployment runbook](./DEPLOYMENT.md)
- [Product specification](./PRODUCT.md)
- [Design system](./DESIGN.md)
