# Auth Test Matrix

## Scope
Flows covered for `auth` module:
- Sign in (password)
- Sign in (OTP SMS)
- Sign up
- Account confirmation (`verify-email`)
- Forgot password
- Reset password
- Sign out
- Social auth (Google/Facebook/Apple)
- Session lifecycle (auto-login, refresh, unauthorized)

Test levels:
- `U`: Unit (pure logic/helpers)
- `I`: Integration (forms + provider/client mocks)
- `E2E`: End-to-end (real browser + API or staging backend)

## Environment Matrix
| Env | API Base | Notes |
|---|---|---|
| Local | `/authentication` (mock or local backend) | Fast validation of UI + form states |
| QA | Configured `auth.apiBasePath` | Contract validation + real backend errors |
| Staging | Configured `auth.apiBasePath` | Final regression before release |

## Data Matrix
| Data Set | Description |
|---|---|
| `user_active` | User with verified account and valid password |
| `user_unverified` | User exists but email not verified |
| `user_locked_or_invalid` | User that should trigger auth failure |
| `user_signup_new` | New email/phone not registered |
| `user_phone_existing` | Phone already mapped to existing user |
| `user_phone_new` | Phone not registered yet |
| `otp_valid` | Correct OTP code in validity window |
| `otp_invalid` | Wrong OTP code |
| `otp_expired` | Expired OTP code |
| `token_reset_valid` | Valid uid/token pair for password reset |
| `token_reset_invalid` | Invalid or expired uid/token pair |
| `token_verify_valid` | Valid uid/token pair for account verification |
| `token_verify_invalid` | Invalid or expired account verification pair |

## Core Flow Matrix
| ID | Flow | Level | Scenario | Steps | Expected |
|---|---|---|---|---|---|
| AUTH-SI-001 | Sign in password | I/E2E | Happy path | Fill login + password, submit | User authenticated, redirected, auth state `authenticated` |
| AUTH-SI-002 | Sign in password | I/E2E | Invalid credentials | Submit wrong password | Field/root error shown, no session |
| AUTH-SI-003 | Sign in password | I/E2E | Unverified account | Login with `user_unverified` | Error shown + CTA `Ir a verificar cuenta` visible |
| AUTH-SI-004 | Sign in password | I | Empty form validation | Submit empty form | Required errors for login/password |
| AUTH-SI-005 | Sign in password | I | Disabled/loading state | Trigger loading submit | Submit disabled + loading label shown |
| AUTH-SI-006 | Sign in password | E2E | Forgot-password link | Click `Forgot your password?` | Navigates to `/forgot-password` |
| AUTH-OTP-001 | OTP sign in | I/E2E | Request OTP happy path | Enter phone + request | Confirm dialog appears, OTP requested, success info shown |
| AUTH-OTP-002 | OTP sign in | I/E2E | Verify OTP happy path | Request OTP then verify with `otp_valid` | User authenticated |
| AUTH-OTP-003 | OTP sign in | I/E2E | Wrong code | Verify with `otp_invalid` | Error message shown, stays on OTP form |
| AUTH-OTP-004 | OTP sign in | I/E2E | Expired code | Verify with `otp_expired` | Expired/invalid code error shown |
| AUTH-OTP-005 | OTP sign in | I | Request OTP failure | Backend returns error on request | Root error shown |
| AUTH-OTP-006 | OTP sign in | I/E2E | Back to password | OTP mode -> click back | Returns to password mode without crash |
| AUTH-SU-001 | Sign up | I/E2E | Happy path | Complete form with valid data | Register success, navigate to `/verify-email?email=...` |
| AUTH-SU-002 | Sign up | I | Client validation | Invalid email/password mismatch/terms unchecked | Field errors shown |
| AUTH-SU-003 | Sign up | I/E2E | Backend field errors | API returns field errors | Mapped to correct inputs |
| AUTH-SU-004 | Sign up | I | Role required flow | `requiresRoleSelection=true` and no role chosen | Submission blocked |
| AUTH-SU-005 | Sign up | I | Scrollable fields mode | `fieldsScrollable=true` | Form usable in constrained height |
| AUTH-AC-001 | Account confirmation | E2E | Valid token | Open verify URL with `token_verify_valid` | Success alert + auto-redirect countdown |
| AUTH-AC-002 | Account confirmation | E2E | Invalid/expired token | Open verify URL invalid token | Error shown, resend option available when email present |
| AUTH-AC-003 | Account confirmation | I/E2E | Missing uid/token | Open verify without params | Warning shown, no crash |
| AUTH-AC-004 | Account confirmation | I/E2E | Resend cooldown | Trigger resend | Cooldown timer shown, button disabled until finish |
| AUTH-AC-005 | Account confirmation | I/E2E | Manual go-to-sign-in | Click `Ir a iniciar sesión` | Redirects immediately |
| AUTH-FP-001 | Forgot password | I/E2E | Happy path | Submit valid email | Success alert message shown |
| AUTH-FP-002 | Forgot password | I/E2E | Backend failure | Submit and force API error | Root/field error shown |
| AUTH-RP-001 | Reset password | I/E2E | Happy path | Valid uid/token + valid new passwords | Password reset success |
| AUTH-RP-002 | Reset password | I/E2E | Password mismatch | Submit different passwords | Validation error shown |
| AUTH-RP-003 | Reset password | E2E | Invalid token | Use `token_reset_invalid` | Error shown, no success |
| AUTH-SO-001 | Sign out | I/E2E | Sign out view action | Open sign-out page and click go-to-sign-in | Navigation works, no session |
| AUTH-SOC-001 | Social auth | I/E2E | Provider enabled happy path | Click provider button and complete auth | `loginSocial` called, user authenticated |
| AUTH-SOC-002 | Social auth | I/E2E | Provider popup/callback error | Cancel/fail provider flow | Error alert shown |
| AUTH-SOC-003 | Social auth | I | Disabled providers | Missing `clientId` or disabled config | Button not rendered |
| AUTH-SOC-004 | Social auth | I | Busy state exclusivity | One provider in progress | Other providers and SMS button disabled |
| AUTH-SOC-005 | Social auth | I/E2E | Precheck user exists | `social/precheck` returns `user_exists=true` | No role modal, continue to social login |
| AUTH-SOC-006 | Social auth | I/E2E | Precheck user does not exist | `social/precheck` returns `user_exists=false` | Role modal opens, role required before social login |
| AUTH-SES-001 | Session | I/E2E | Auto login from token | App load with valid token | `getMe` called, auth restored |
| AUTH-SES-002 | Session | I/E2E | Refresh token success | Expired access + valid refresh | Session remains authenticated |
| AUTH-SES-003 | Session | I/E2E | Unauthorized handling | API 401 and refresh fails | Session cleared, auth `unauthenticated` |
| AUTH-SES-004 | Session | I | Logout cleanup | Call logout | Tokens removed and user null |

## Error Matrix (Contract/Backend)
| ID | Error Type | Source | Expected Behavior |
|---|---|---|---|
| AUTH-ERR-001 | Field validation error | API `fieldErrors` | Mapped to exact field via `setError` |
| AUTH-ERR-002 | Root error | API `detail`/root | Visible alert with fallback message |
| AUTH-ERR-003 | Unknown error shape | Network/unexpected payload | Generic fallback error, no crash |
| AUTH-ERR-004 | Timeout/offline | Network | User-facing recoverable error |
| AUTH-ERR-005 | Unauthorized on protected calls | API 401 | Trigger logout/unauthenticated flow |

## UI/Accessibility Matrix
| ID | Scenario | Expected |
|---|---|---|
| AUTH-UI-001 | Keyboard navigation on all forms | Logical tab order and visible focus |
| AUTH-UI-002 | Submit with Enter key | Submits primary form action correctly |
| AUTH-UI-003 | Buttons disabled while loading | Prevents duplicate submit |
| AUTH-UI-004 | Mobile width (320px) | No broken layout or clipped controls |
| AUTH-UI-005 | Error text visibility | Errors readable and attached to inputs |
| AUTH-UI-006 | Countdown/cooldown text | Updates every second and remains stable |

## Non-Functional Matrix
| ID | Area | Validation |
|---|---|---|
| AUTH-NF-001 | Performance | First auth view interactive under target budget |
| AUTH-NF-002 | Security | Tokens not logged in console in production |
| AUTH-NF-003 | Security | Sensitive fields use password type/masking |
| AUTH-NF-004 | Reliability | No infinite retries/loops on failed refresh |
| AUTH-NF-005 | Observability | Errors include enough context for debugging |

## Release Exit Criteria
All must pass before release:
- 100% pass on `AUTH-SI-*`, `AUTH-SU-*`, `AUTH-AC-*`, `AUTH-FP-*`, `AUTH-RP-*`, `AUTH-SES-*`
- No blocker/high severity defects open
- QA + Staging smoke run completed
- Contract-critical errors (`AUTH-ERR-*`) validated against current backend

## Suggested Automation Split
| Suite | IDs |
|---|---|
| Unit | `AUTH-ERR-*`, parsing/normalization helpers, schema validations |
| Integration | `AUTH-SI-*` (except full redirect), `AUTH-OTP-*`, `AUTH-SU-*`, `AUTH-AC-*`, `AUTH-SOC-*` with mocked SDK |
| E2E Smoke | `AUTH-SI-001`, `AUTH-SU-001`, `AUTH-AC-001`, `AUTH-FP-001`, `AUTH-RP-001`, `AUTH-SES-001` |
| E2E Full Regression | Entire `AUTH-*` matrix |
