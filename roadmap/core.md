# Core Roadmap

## ✅ Completed
- ✅ Centralized exports per module for simple consumption.
- ✅ Integration with `FuseAuthProvider` and role-based authorization.
- ✅ Foundation to minimize consumer project responsibilities.
- ✅ Simplified and maintainable auth folder structure (domain split + isolated fuse).
- ✅ `createJBWebConfig` integrated as the real source for `apiBasePath` and signup roles in reference wiring.

## 🟡 In Progress
- 🟡 Reduce remaining bridge code in consumer apps.
- 🟡 Strengthen public type contracts to avoid fragile usage.
- 🟡 Standardize `createJBWebConfig` as the single source of truth for auth/runtime settings.

## 🔜 Pending
- 🔜 Stable public API (v1) with formal breaking-change handling.
- 🔜 Compatibility matrix (React, MUI, Router).
- 🔜 Migration template to move existing apps away from hardcoded auth config.

## 🚧 Risks / Technical Debt
- 🚧 Partial coupling to specific consumer implementations.
