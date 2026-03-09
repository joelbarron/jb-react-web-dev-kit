import { DataTypeProvider } from '@devexpress/dx-react-grid';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { Avatar, Box, Chip } from '@mui/material';
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

const formatDate = (value: unknown) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const BooleanFormatter = ({ value }: FormatterProps): ReactNode => {
  const normalized = String(value ?? '').trim().toLowerCase();
  const isTrue =
    value === true ||
    value === 1 ||
    value === '1' ||
    normalized === 'true';

  return (
    <Chip
      size="small"
      variant="outlined"
      color={isTrue ? 'success' : 'error'}
      icon={isTrue ? <CheckCircleRoundedIcon fontSize="small" /> : <CancelRoundedIcon fontSize="small" />}
      label={isTrue ? 'Sí' : 'No'}
    />
  );
};

const CurrencyFormatter = ({ value, column }: FormatterProps): ReactNode => {
  const currency = column?.currency ?? 'USD';
  return <span>{formatCurrency(value, currency)}</span>;
};

const DateFormatter = ({ value }: FormatterProps): ReactNode => {
  return <span>{formatDate(value)}</span>;
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

export const JBDateTypeProvider = (props: { for: string[] }) => (
  <DataTypeProvider
    formatterComponent={DateFormatter as never}
    {...props}
  />
);

export const JBImageTypeProvider = (props: { for: string[] }) => (
  <DataTypeProvider
    formatterComponent={ImageFormatter as never}
    {...props}
  />
);
