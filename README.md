# @joelbarron/react-web-dev-kit

Core reusable para apps web React.

Incluye:
- `auth` (`createAuthClient` para `jb-drf-auth`)
- `config` (`createJBWebConfig`, overrides por stage/env)
- `forms` (`JBTextField`, `JBSelectField`, `JBCheckboxField`, `JBSwitchField`, `JBRadioGroupField`, `JBDatePickerField`, `JBTimePickerField`)
- `grid` (`JBGrid`, `JBGridHeader`, providers)
- `hooks` y `utils`

## Documentacion por secciones

- [Indice docs](./docs/README.md)
- [Auth](./docs/auth.md)
- [Config](./docs/config.md)
- [Forms](./docs/forms.md)
- [Grid](./docs/grid.md)
- [Query](./docs/query.md)
- [Hooks](./docs/hooks.md)
- [Utils](./docs/utils.md)

## Instalacion

```bash
npm i @joelbarron/react-web-dev-kit
```

## Auth

```ts
import { createAuthClient } from '@joelbarron/react-web-dev-kit';

export const authClient = createAuthClient({
  apiBaseUrl: import.meta.env.VITE_API_URL,
  onUnauthorized: () => {
    // ejemplo: limpiar estado y redirigir
  }
});

await authClient.loginBasic({
  login: 'demo@mail.com',
  password: 'secret',
  client: 'web'
});

const me = await authClient.getMe();
```

### Auth Provider + Hook

```tsx
import { JBAuthProvider, useJBAuth, createAuthClient } from '@joelbarron/react-web-dev-kit/auth';

const authClient = createAuthClient({
  apiBaseUrl: import.meta.env.VITE_API_URL
});

function Root() {
  return (
    <JBAuthProvider authClient={authClient}>
      <App />
    </JBAuthProvider>
  );
}
```

### Auth Routes Factory

```tsx
import { createAuthRoutes } from '@joelbarron/react-web-dev-kit/auth';

const authRoutes = createAuthRoutes({
  pages: {
    signIn: SignInPage,
    signUp: SignUpPage,
    forgotPassword: ForgotPasswordPage,
    resetPassword: ResetPasswordPage,
    signOut: SignOutPage
  },
  pageComponent: ({ children }) => <AuthLayout>{children}</AuthLayout>,
  routeMeta: {
    signIn: { auth: ['guest'] },
    signUp: { auth: ['guest'] }
  }
});
```

### Auth Query Hooks (TanStack Query)

```ts
import { createAuthClient, createAuthQueryHooks } from '@joelbarron/react-web-dev-kit/auth';

const authClient = createAuthClient({
  apiBaseUrl: import.meta.env.VITE_API_URL
});

export const authQueryHooks = createAuthQueryHooks(authClient);
```

## Query Client

```ts
import { createReactWebQueryClient } from '@joelbarron/react-web-dev-kit/query';

const queryClient = createReactWebQueryClient({
  onUnauthorized: () => {
    window.location.href = '/sign-in';
  }
});
```

### Auth Forms Base

Tambien incluye formularios base para auth:
- `JBLoginForm`
- `JBForgotPasswordForm`
- `JBResetPasswordForm`

```tsx
import { JBLoginForm } from '@joelbarron/react-web-dev-kit/auth';
```

## Config Global (overrideable)

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

const apiBaseUrl = getApiBaseUrl(appConfig);
```

## Forms (React Hook Form + MUI)

```tsx
import { Controller, useForm } from 'react-hook-form';
import { JBDatePickerField, JBSelectField, JBTextField } from '@joelbarron/react-web-dev-kit';

type FormValues = {
  name: string;
  status: string;
  birthday: Date | null;
};

const options = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

function ExampleForm() {
  const { control } = useForm<FormValues>({
    defaultValues: { name: '', status: '', birthday: null }
  });

  return (
    <>
      <JBTextField
        control={control}
        name="name"
        label="Name"
        fullWidth
      />
      <JBSelectField
        control={control}
        name="status"
        label="Status"
        options={options}
        fullWidth
      />
      <JBDatePickerField
        control={control}
        name="birthday"
        label="Birthday"
      />
    </>
  );
}
```

## Grid

```tsx
import { JBGrid, JBGridHeader, JBGridConfig } from '@joelbarron/react-web-dev-kit';
import { useState } from 'react';

const gridConfig: JBGridConfig = {
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Name' }
  ],
  columnsWidths: [
    { columnName: 'id', width: 120 },
    { columnName: 'name', width: 320 }
  ],
  defaults: {
    pageSize: 10,
    allowSelection: true
  }
};

function ExampleGrid({ service }: { service: { list: Function } }) {
  const [searchText, setSearchText] = useState('');

  return (
    <>
      <JBGridHeader
        title="Users"
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />
      <JBGrid
        gridConfig={gridConfig}
        service={service as any}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onRowSelected={(row) => console.log(row)}
      />
    </>
  );
}
```
