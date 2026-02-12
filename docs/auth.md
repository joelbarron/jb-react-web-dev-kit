# Auth

Esta seccion agrupa cliente HTTP, provider/contexto, hooks de query, rutas y UI base para flujos de autenticacion.

## 1) Cliente auth (`createAuthClient`)

```ts
import { createAuthClient } from '@joelbarron/react-web-dev-kit/auth';

export const authClient = createAuthClient({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  apiBasePath: '/authentication',
  defaultClient: 'web',
  onUnauthorized: () => {
    // limpiar sesion, redirigir, etc.
  }
});
```

Alternativa recomendada: crear cliente desde `createJBWebConfig`.

```ts
import { createAuthClientFromJBWebConfig } from '@joelbarron/react-web-dev-kit/auth';

const authClient = createAuthClientFromJBWebConfig(appConfig, {
  defaultClient: 'web'
});
```

Incluye metodos:

- `loginBasic`
- `loginSocial`
- `linkSocial`
- `unlinkSocial`
- `requestOtp`
- `verifyOtp`
- `register`
- `confirmAccountEmail`
- `resendAccountConfirmation`
- `getMe`
- `updateProfilePicture`
- `updateAccount`
- `deleteAccount`
- `refreshToken`
- `getProfiles`
- `getProfileById`
- `createProfile`
- `updateProfile`
- `deleteProfile`
- `switchProfile`
- `createSuperuser`
- `createStaffUser`
- `requestPasswordReset`
- `confirmPasswordReset`
- `changePassword`
- `logout`

## 2) Provider y hook (`JBAuthProvider`, `useJBAuth`)

```tsx
import { JBAuthProvider, useJBAuth } from '@joelbarron/react-web-dev-kit/auth';

function Root() {
  return <JBAuthProvider authClient={authClient}>{/* app */}</JBAuthProvider>;
}

function Example() {
  const { authStatus, isAuthenticated, signIn, signOut } = useJBAuth();
  return null;
}
```

## 3) Query hooks (`createAuthQueryHooks`)

```ts
import { createAuthQueryHooks } from '@joelbarron/react-web-dev-kit/auth';

export const authQueryHooks = createAuthQueryHooks(authClient);

// authQueryHooks.useMeQuery()
// authQueryHooks.useLoginMutation()
// authQueryHooks.useSwitchProfileMutation()
// authQueryHooks.useLogoutMutation()
```

## 4) Rutas (`createAuthRoutes`)

```tsx
import { createAuthRoutes } from '@joelbarron/react-web-dev-kit/auth';
import { Link } from 'react-router';

const authRoutes = createAuthRoutes({
  basePath: '',
  autoFuseViews: true,
  linkComponent: Link,
  signUpRoleOptions: getAuthSignupProfileRoles(appConfig),
  defaultSignUpRole: getAuthDefaultProfileRole(appConfig)
});
```

Opciones comunes:

- `paths` para renombrar rutas (`sign-in`, `sign-up`, etc.)
- `pageComponent` para envolver cada pagina
- `layoutVariant` y `messageSectionProps` para layout/textos
- `routeMeta` para pasar metadata al router
- `signUpRoleOptions` para mostrar roles en registro (`allowSignup`)
- `defaultSignUpRole` para seleccionar rol inicial en registro

## 5) Forms de auth listos para usar

Disponibles desde `@joelbarron/react-web-dev-kit/auth`:

- `AuthPasswordSignInForm`
- `AuthOtpSignInForm`
- `AuthSignUpForm`
- `AuthForgotPasswordForm`
- `AuthResetPasswordForm`
- `AuthPasswordResetConfirmForm`
- `AuthAccountConfirmationForm`

## 6) Constantes reutilizables

`auth/constants` exporta:

- `GENDERS`
- `DEFAULT_GENDER`
- `GENDER_LABELS`
- `GENDER_SELECT_OPTIONS`

Para usar los mismos valores en formularios y payloads.

## 7) Notas de contrato v1

- Endpoints por default en la libreria usan prefijo `/authentication/`.
- Si tu backend esta montado en `/auth/`, configuralo en `createAuthClient({ endpoints: { ... } })`.
- En frontend usamos payloads en `camelCase` de forma consistente.
- `register` soporta `role` en payload (recomendado definir opciones por proyecto desde `createJBWebConfig`).
- Social auth (`login/social`, `login/social/link`, `login/social/unlink`) ya está soportado en el cliente.
- `profile/picture`, `account/update`, `account/delete` ya están soportados en el cliente.
- `register` retorna payload de detalle (no inicia sesion automaticamente).
- Existe vista de confirmacion de cuenta con auto submit por query params `uid` y `token` cuando usas `createAuthRoutes({ autoFuseViews: true, ... })`.
