# Architecture (Artillery Web)

This document defines **layers**, **folders**, and **dependency rules** for `artillery-web`. It complements code; it is not a substitute for Firestore rules or server-side auth checks.

## Runtime layout

| Area | Role |
|------|------|
| `app/` | Next.js App Router: routes, layouts, UI, and **`app/api/**` route handlers**. |
| `src/lib/` | Platform adapters (Firebase client/admin), RBAC helpers, audit, validation, plate utilities. |
| `src/context/`, `src/hooks/` | Cross-cutting React state (auth) and data hooks reused by routes. |
| `src/services/` | **Target home for application use-cases** (orchestration + domain validation). Migrate here over time so `app/**` stays thin. |
| `functions/` | Firebase Cloud Functions (callable / triggers): privileged or event-driven flows. |

## Dependency rules (allowed direction)

```
app/pages & components → src/services → src/lib (Firebase, etc.)
                         ↘ optional direct @/lib for reads until migrated

app/api route handlers → src/services (preferred) → @/lib/firebase-admin etc.

functions/src → firebase-admin SDK + shared conventions (mirror validation where needed)
```

- **Forbidden long-term**: UI/route code owning all business logic and Firestore shape without a central use-case.
- **RBAC**: `src/lib/permissions.ts` plus `RequirePagePermission` guard the UI. **Mirror checks** on any mutating endpoint (Route Handler or Cloud Function) so clients cannot bypass the UI.

## Import conventions

- Use the path alias **`@/`** for everything under `src/` (configured in `tsconfig.json`).
- Do not use relative paths like `../../src/lib/...` from `app/`; they churn on refactors.

## Backend surface strategy (recommended direction)

Today the app mixes **Next route handlers** and **Cloud Functions**. To reduce divergence:

1. **Choose one primary spine for mutations** per domain (e.g. records → callable or API route only).
2. Keep the other surface as a thin facade or deprecate duplicates.
3. Document the choice briefly in git history or a one-line ADR when you consolidate.

Firestore security rules remain the last line of defense; server checks are for correctness and abuse mitigation.

## Secrets and local artifacts

- **Never commit** Firebase service account JSON. Use `.env`/Secret Manager per environment.
- Ignore local Firebase deploy caches (`/.firebase/` in `.gitignore`).

## Migration notes (incremental)

1. Extract a pure function or small module from `app/**` into `src/services/<domain>/<action>.ts`.
2. Call it from the page or from `app/api`.
3. Reuse from Cloud Functions where the behavior must match exactly.
