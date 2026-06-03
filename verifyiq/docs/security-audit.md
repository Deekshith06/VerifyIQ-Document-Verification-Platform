# VerifyIQ Zero-Retention Security Audit

Date: 2026-06-03

## Scope

Reviewed the rebuilt public verification path:

- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/verify/page.tsx`
- `apps/web/app/results/[id]/page.tsx`
- `apps/web/app/guide/page.tsx`
- `apps/web/app/lib/verification.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/verify/*`

## Findings

### Pass: no account requirement

The public web app has no login route in navigation and no user identity UI. The NestJS `VerifyController` no longer uses `ApiKeyGuard`, JWT guards, organization IDs, or actor IDs.

### Pass: no browser persistence

The rebuilt web app uses React component state only. No `localStorage`, `sessionStorage`, IndexedDB, cookies, or document-data analytics calls are used in the verification workflow.

### Pass: no default database-backed verification path

The default `AppModule` imports only `ConfigModule`, `ThrottlerModule`, `VerifyModule`, and `FraudModule`. It no longer imports Prisma, Auth, Audit, Dashboard, Documents, Schedule, or Queue modules.

### Pass: no result history

`POST /verify` returns the result directly. `GET /verify/:id` and `GET /verify/:id/reasoning` return `410 Gone` semantics through `GoneException`, explaining that results are not retained for lookup.

### Pass: transparent reasoning

The UI shows document name, ID number, risk score, failure point, all checks, exact calculation text, evidence, and risk contribution. Verified results use green backgrounds and failed results use red backgrounds.

## Residual Notes

Legacy Prisma, auth, audit, dashboard, and queue source files still exist for historical compatibility, but they are not imported by the default API module. If this project is packaged for production, unused legacy modules and Prisma dependencies should be removed in a follow-up cleanup to reduce maintenance surface.

Installing API dependencies reported 31 npm audit findings in the dependency tree (3 low, 21 moderate, 7 high). These are dependency-level findings and should be triaged separately before deployment, especially the deprecated Multer 1.x warning.

## Conclusion

The rebuilt default application path satisfies the requested stateless, anonymous, zero-retention model: process in memory, return results, and retain no user data or verification history.
