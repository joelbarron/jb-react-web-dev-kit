export const formatCurrency = (value: number, currency = 'USD', locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value || 0);
};

export const formatDate = (
  date: string | number | Date | null | undefined,
  locale = 'en-US'
): string => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(locale).format(parsed);
};

export const formatDateTime = (
  date: string | number | Date | null | undefined,
  locale = 'en-US'
): string => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
};

