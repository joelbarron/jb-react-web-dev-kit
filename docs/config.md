# Config

Config central para stage/env y construccion de `apiBaseUrl`.

## API principal

- `createJBWebConfig`
- `createJBWebConfigFromEnv`
- `getApiBaseUrl`
- `getStageValue`
- `getConfigStageValue`
- `getAuthBasePath`
- `getAuthProfileRoles`
- `getAuthSignupProfileRoles`
- `getAuthDefaultProfileRole`
- `resolveApiHostByStage`
- `deepMerge`
- `defaultJBAppConfig`

## Ejemplo

```ts
import { createJBWebConfigFromEnv, getApiBaseUrl } from '@joelbarron/react-web-dev-kit/config';

const appConfig = createJBWebConfigFromEnv(
  {
    stage: 'QA',
    api: {
      version: 'v1',
      host: {
        PRODUCTION: 'https://api.example.com',
        QA: 'https://api-qa.example.com',
        DEVELOPMENT: 'http://127.0.0.1:8000',
        LOCAL: 'http://localhost:8000'
      }
    },
    auth: {
      apiBasePath: '/authentication',
      profileRoles: [
        { value: 'PATIENT', label: 'Patient', allowSignup: true },
        { value: 'DOCTOR', label: 'Doctor', allowSignup: true },
        { value: 'ADMIN', label: 'Admin', allowSignup: false }
      ],
      defaultProfileRole: 'PATIENT'
    },
    integrations: {
      mapboxToken: ''
    }
  },
  import.meta.env as Record<string, string | undefined>
);

const apiBaseUrl = getApiBaseUrl(appConfig);
```

## Resolver valores por stage

Si guardas un valor por ambiente (por ejemplo en `integrations`), usa:

```ts
import { getConfigStageValue } from '@joelbarron/react-web-dev-kit/config';

const mapboxConfig = appConfig.integrations.mapbox as {
  PRODUCTION?: string;
  QA?: string;
  DEVELOPMENT?: string;
  LOCAL?: string;
  production?: string;
  qa?: string;
  development?: string;
  local?: string;
};

const mapboxToken = getConfigStageValue(appConfig, mapboxConfig, '');
```

Notas:
- Soporta llaves en mayúsculas (`PRODUCTION`) y minúsculas (`production`).
- Si no encuentra valor para el stage actual, usa `fallback`.

## Auth base path

- `auth.apiBasePath` define la raiz del backend auth (por defecto: `/authentication`).
- Si no se define en config, la libreria usa fallback `/authentication`.
- `createJBWebConfigFromEnv` soporta `VITE_AUTH_BASE_PATH`.

## Roles de perfil por proyecto

Definir `auth.profileRoles` y `auth.defaultProfileRole` permite:

- reutilizar roles en UI de registro;
- filtrar con `allowSignup` cuales aparecen en formulario de `sign up`;
- evitar hardcodear roles por proyecto.

```ts
import {
  getAuthDefaultProfileRole,
  getAuthSignupProfileRoles
} from '@joelbarron/react-web-dev-kit/config';

const signUpRoleOptions = getAuthSignupProfileRoles(appConfig);
const defaultRole = getAuthDefaultProfileRole(appConfig);
```

## Recomendacion

Usar `createJBWebConfigFromEnv` para proyectos consumidores y derivar desde esta config:

- `apiBaseUrl`
- `auth.apiBasePath`
- roles de `sign up`

Evita mantener parametros de auth duplicados en cada proyecto.
