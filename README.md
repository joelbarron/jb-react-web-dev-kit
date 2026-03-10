# @joelbarron/react-web-dev-kit

[![npm version](https://img.shields.io/npm/v/%40joelbarron%2Freact-web-dev-kit?label=npm&color=cb3837)](https://www.npmjs.com/package/@joelbarron/react-web-dev-kit)
[![npm downloads](https://img.shields.io/npm/dm/%40joelbarron%2Freact-web-dev-kit?label=downloads)](https://www.npmjs.com/package/@joelbarron/react-web-dev-kit)
[![CI](https://img.shields.io/github/actions/workflow/status/joelbarron/jb-react-web-dev-kit/ci.yml?branch=main&label=CI)](https://github.com/joelbarron/jb-react-web-dev-kit/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/actions/workflow/status/joelbarron/jb-react-web-dev-kit/release.yml?branch=main&label=release)](https://github.com/joelbarron/jb-react-web-dev-kit/actions/workflows/release.yml)

Libreria reusable para apps web React con piezas listas para autenticacion, formularios, grillas, config por ambiente y utilidades comunes.

## Que incluye

| Modulo | Que aporta | Docs |
| --- | --- | --- |
| `auth` | Cliente para `jb-drf-auth`, provider, hooks y rutas de auth | [docs/auth.md](./docs/auth.md) |
| `config` | Config global por stage y helpers de URL/API | [docs/config.md](./docs/config.md) |
| `forms` | Campos base sobre React Hook Form + MUI | [docs/forms.md](./docs/forms.md) |
| `grid` | `JBGrid`, header y providers para tablas | [docs/grid.md](./docs/grid.md) |
| `query` | QueryClient preconfigurado para React Query | [docs/query.md](./docs/query.md) |
| `hooks` | Hooks compartidos para casos de app | [docs/hooks.md](./docs/hooks.md) |
| `utils` | Helpers generales reutilizables | [docs/utils.md](./docs/utils.md) |

## Instalacion

```bash
npm i @joelbarron/react-web-dev-kit
```

Peer deps principales (segun `package.json`):
- `react >= 19`
- `react-dom >= 19`
- `@tanstack/react-query >= 5`
- `react-hook-form >= 7`
- `@mui/material >= 5`

## Inicio rapido

### Auth client

```ts
import { createAuthClient } from '@joelbarron/react-web-dev-kit/auth';

export const authClient = createAuthClient({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  onUnauthorized: () => {
    window.location.href = '/sign-in';
  }
});
```

### Auth Provider

```tsx
import { JBAuthProvider } from '@joelbarron/react-web-dev-kit/auth';
import { authClient } from './authClient';

export function Root() {
  return (
    <JBAuthProvider authClient={authClient}>
      <App />
    </JBAuthProvider>
  );
}
```

### Query client

```ts
import { createReactWebQueryClient } from '@joelbarron/react-web-dev-kit/query';

export const queryClient = createReactWebQueryClient({
  onUnauthorized: () => {
    window.location.href = '/sign-in';
  }
});
```

### Config por ambiente

```ts
import { createJBWebConfigFromEnv, getApiBaseUrl } from '@joelbarron/react-web-dev-kit/config';

const appConfig = createJBWebConfigFromEnv(
  {
    stage: 'qa',
    api: {
      version: 'v1',
      host: {
        production: 'https://api.example.com',
        qa: 'https://api-qa.example.com',
        development: 'http://127.0.0.1:8000',
        local: 'http://localhost:8000'
      }
    }
  },
  import.meta.env as Record<string, string | undefined>
);

export const apiBaseUrl = getApiBaseUrl(appConfig);
```

### Forms y Grid

```tsx
import { JBTextField, JBSelectField, JBDatePickerField, JBGrid, JBGridHeader } from '@joelbarron/react-web-dev-kit';
```

Tambien incluye formularios listos de auth:
- `AuthPasswordSignInForm`
- `AuthForgotPasswordForm`
- `AuthResetPasswordForm`

## Versionado y release

Canales publicados en npm:
- `latest`: versiones estables desde `main`
- `next`: prereleases (`-rc.x`) desde `next`

Consulta rapida de version y dist-tags:

```bash
npm view @joelbarron/react-web-dev-kit version dist-tags --json
```

Guia completa de release automation:
- [docs/release.md](./docs/release.md)

## Documentacion

- [Indice docs](./docs/README.md)
- [Auth](./docs/auth.md)
- [Config](./docs/config.md)
- [Forms](./docs/forms.md)
- [Grid](./docs/grid.md)
- [Query](./docs/query.md)
- [Hooks](./docs/hooks.md)
- [Utils](./docs/utils.md)
- [Release](./docs/release.md)

## Changelog

- [CHANGELOG.md](./CHANGELOG.md)
