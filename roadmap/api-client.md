# API Client Roadmap

## ✅ Completed
- ✅ Centralized Axios auth client.
- ✅ Project-configurable endpoints.
- ✅ Interceptor with 401 handling and refresh token flow.
- ✅ Base normalization for selected responses (`emailSent`, etc.).

## 🟡 In Progress
- 🟡 API error normalization in a shared layer.
- 🟡 Request/response mapping standard per module.

## 🔜 Pending
- 🔜 Retry/timeout/cancellation strategy per endpoint.
- 🔜 Optional request telemetry for debugging.
- 🔜 Integration tests for refresh race conditions.

## 🚧 Risks / Technical Debt
- 🚧 Multi-tab session edge cases and concurrent refresh behavior.
