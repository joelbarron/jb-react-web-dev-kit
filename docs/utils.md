# Utils

Utilidades generales.

## Formato

- `formatCurrency`
- `formatDate`
- `formatDateTime`

```ts
import { formatCurrency, formatDate } from '@joelbarron/react-web-dev-kit/utils';

formatCurrency(1200.5, 'MXN', 'es-MX');
formatDate('2026-02-11', 'es-MX');
```

## Query string

- `objectToQueryString`

```ts
import { objectToQueryString } from '@joelbarron/react-web-dev-kit/utils';

const query = objectToQueryString({ page: 1, search: 'joel' });
// page=1&search=joel
```

## Regex

Constantes listas para validaciones:

- `JB_PHONE_REGEX`
- `JB_ZIP_CODE_REGEX`
- `JB_NUMBER_REGEX`
- `JB_DECIMAL_NUMBER_REGEX`
- `JB_EMAIL_REGEX`
- `JB_PASSWORD_REGEX`
