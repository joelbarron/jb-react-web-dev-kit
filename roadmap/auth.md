# Auth Roadmap

QA reference:
- Auth test matrix: [`roadmap/auth-test-matrix.md`](./auth-test-matrix.md)

## ✅ Completed
- ✅ Decoupled auth architecture for Fuse (`createAuthRoutes`, `createFuseAuthViews`, adapter/provider).
- ✅ JWT login with `login` + `password` payload.
- ✅ Auto-login on reload using token + `me`.
- ✅ OTP via SMS (`request` + `verify`).
- ✅ Refresh token flow for authenticated clients.
- ✅ Signup aligned with current contract (camelCase, `username: null`).
- ✅ Account verification via `uid/token` from query params.
- ✅ Verification resend with 30s cooldown + visible timer.
- ✅ Verify buttons ordering: primary sign-in, secondary resend.
- ✅ Auto-redirect after verify success (5s) with countdown + manual click.
- ✅ Login CTA for unverified account (`Ir a verificar cuenta`).
- ✅ Backend error handling visible in forms.
- ✅ Spanish auth copy.
- ✅ Signup success hook for integrator toast handling (`onSignUpSuccess`).
- ✅ `role` selection support in sign up (camelCase), with per-project options.
- ✅ `createAuthClientFromJBWebConfig` to build auth client from central config.
- ✅ Auth base path fallback to `/authentication`.
- ✅ Improved OTP flow: confirmation before request, input locking after send, `Cambiar número` action.
- ✅ Auth module reorganization by domain (`forms/sign-in`, `forms/sign-up`, `forms/password`, `forms/account`).
- ✅ Fuse reorganization under `auth/fuse/*` (no Fuse files at `auth` root).
- ✅ Backward compatibility for legacy exports (`JB*`) while using clearer internal names (`Auth*`).
- ✅ SDK integration for new contract endpoints: social login/link/unlink.
- ✅ SDK/UI integration for `social precheck` (`POST /login/social/precheck/`) and role-selection decision based on `user_exists`.
- ✅ Full social flow in Fuse views: provider auth -> precheck -> optional role selection -> social login.
- ✅ SDK integration for `PATCH /profile/picture/`.
- ✅ SDK integration for `PATCH|PUT /account/update/` and `DELETE /account/delete/`.
- ✅ SDK integration for profile by id (`GET|PATCH|DELETE /profiles/{id}/`) and creation (`POST /profiles/`).
- ✅ SDK integration for bootstrap admin endpoints (`create-superuser`, `create-staff`).
- ✅ Unified auth page titles into one reusable component (`AuthPageTitle`).
- ✅ `modern` layout responsive fixes (mobile/tablet/desktop) with correct centering when the right panel is hidden.
- ✅ Auth visual scale adjustments (form width, titles, and buttons for better readability).

## 🟡 In Progress
- 🟡 Convert temporary testing defaults to an explicit flag (`enableTestDefaults`).
- 🟡 Standardize the messages/errors catalog for i18n.
- 🟡 Continue `createJBWebConfig` adoption in existing consumer projects (first wiring already applied in Mentalysis).
- 🟡 Unify auth parameters to come from config (`apiBasePath`, roles, default role).

## 🔜 Pending
- 🔜 UI integration for account management (`account/update`, `account/delete`).
- 🔜 UI integration for `profile picture`.
- 🔜 Implement auth test matrix automation (`roadmap/auth-test-matrix.md`).
- 🔜 Stable versioned release + migration guide.

## 🚧 Risks / Technical Debt
- 🚧 Local `file:` package workflow still requires frequent rebuild/reinstall.
- 🚧 Part of auth UI still depends on Fuse conventions and needs further abstraction.
