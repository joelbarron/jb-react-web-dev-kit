import { DataTypeProvider } from '@devexpress/dx-react-grid';
import { Avatar, Box } from '@mui/material';
import { ReactNode } from 'react';

type FormatterProps = {
  value: unknown;
  column?: {
    type?: 'square' | 'rounded';
    className?: string;
    currency?: string;
  };
};

const formatCurrency = (value: unknown, currency = 'USD') => {
  const amount = typeof value === 'number' ? value : Number(value ?? 0);
  if (Number.isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

const BooleanFormatter = ({ value }: FormatterProps): ReactNode => {
  return <span>{value ? 'Yes' : 'No'}</span>;
};

const CurrencyFormatter = ({ value, column }: FormatterProps): ReactNode => {
  const currency = column?.currency ?? 'USD';
  return <span>{formatCurrency(value, currency)}</span>;
};

const ImageFormatter = ({ value, column }: FormatterProps): ReactNode => {
  const src = typeof value === 'string' ? value : '';
  const type = column?.type ?? 'square';
  const className = column?.className ?? 'h-16 w-16';

  if (type === 'rounded') {
    return (
      <Avatar
        className={className}
        alt="image"
        src={src}
      />
    );
  }

  return (
    <Box className={className}>
      {src ? (
        <img
          className="h-full w-full object-cover rounded"
          alt="image"
          src={src}
        />
      ) : null}
    </Box>
  );
};

export const JBBooleanTypeProvider = (props: { for: string[] }) => (
  <DataTypeProvider
    formatterComponent={BooleanFormatter as never}
    {...props}
  />
);

export const JBCurrencyTypeProvider = (props: { for: string[] }) => (
  <DataTypeProvider
    formatterComponent={CurrencyFormatter as never}
    {...props}
  />
);

export const JBImageTypeProvider = (props: { for: string[] }) => (
  <DataTypeProvider
    formatterComponent={ImageFormatter as never}
    {...props}
  />
);

