# Query

Helpers para configurar TanStack Query con manejo centralizado de errores 401.

## API

- `createReactWebQueryClient`
- `extractHttpStatusCode`
- `isUnauthorizedError`

## Ejemplo

```ts
import { createReactWebQueryClient } from '@joelbarron/react-web-dev-kit/query';

export const queryClient = createReactWebQueryClient({
  onUnauthorized: () => {
    window.location.href = '/sign-in';
  },
  defaultOptions: {
    queries: {
      staleTime: 30_000
    }
  }
});
```

## Comportamiento por default

- `queries.retry = 1`
- `queries.refetchOnWindowFocus = false`
- `mutations.retry = 0`
