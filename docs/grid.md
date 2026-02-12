# Grid

Tabla reusable basada en `@devexpress/dx-react-grid` con header, paginacion y tipos de columna.

Nota: actualmente la libreria esta definida solo para flujo paginado (sin infinite scroll).

## Componentes principales

- `JBGrid`
- `JBGridHeader`
- `JBBooleanTypeProvider`
- `JBCurrencyTypeProvider`
- `JBImageTypeProvider`

## Ejemplo minimo

```tsx
import { useState } from 'react';
import { JBGrid, JBGridHeader, JBGridConfig } from '@joelbarron/react-web-dev-kit/grid';

type UserRow = { id: number; name: string; active: boolean };

const gridConfig: JBGridConfig = {
  columns: [
    { name: 'id', title: 'ID' },
    { name: 'name', title: 'Nombre' },
    { name: 'active', title: 'Activo' }
  ],
  columnsWidths: [
    { columnName: 'id', width: 90 },
    { columnName: 'name', width: 260 },
    { columnName: 'active', width: 120 }
  ],
  booleanColumns: ['active'],
  defaults: {
    pageSize: 10,
    allowSelection: true
  }
};

const service = {
  list: async (currentPage: number, pageSize: number, searchText?: string) => {
    // implementar request real
    return {
      data: {
        results: [],
        count: 0
      }
    };
  }
};

function UsersPage() {
  const [searchText, setSearchText] = useState('');

  return (
    <>
      <JBGridHeader
        title="Usuarios"
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />
      <JBGrid
        gridConfig={gridConfig}
        service={service}
        searchText={searchText}
        onSearchTextChange={setSearchText}
      />
    </>
  );
}
```
