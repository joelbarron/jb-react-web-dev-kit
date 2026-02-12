# Hooks

Hooks utilitarios de la libreria.

## `useJBDebouncedValue`

Debounce para valores de input/filtros.

```ts
import { useJBDebouncedValue } from '@joelbarron/react-web-dev-kit/hooks';

const debouncedSearch = useJBDebouncedValue(searchText, 300);
```

## `useJBRedirect`

Encapsula redirecciones condicionadas.

```ts
import { useJBRedirect } from '@joelbarron/react-web-dev-kit/hooks';
import { useNavigate } from 'react-router';

const navigate = useNavigate();

useJBRedirect({
  shouldRedirect: () => !isAuthenticated,
  getTargetPath: () => '/sign-in',
  navigate,
  deps: [isAuthenticated]
});
```
