export type ApiErrorData = {
  detail?: string;
  message?: string;
  nonFieldErrors?: string[];
  non_field_errors?: string[];
  errors?: Record<string, unknown>;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readFirstString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === 'string' && item.trim());
    return typeof firstString === 'string' ? firstString : undefined;
  }
  if (isRecord(value)) {
    if (typeof value.detail === 'string' && value.detail.trim()) return value.detail;
    if (typeof value.message === 'string' && value.message.trim()) return value.message;
  }
  return undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const raw = error as {
    response?: { data?: unknown };
    data?: unknown;
    message?: string;
  };

  const payload = (raw.response?.data ?? raw.data) as unknown;

  if (!payload) {
    return fallback;
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return raw.message?.trim() || fallback;
  }

  const data = payload as ApiErrorData;

  const detail = readFirstString(data.detail);
  if (detail) return detail;

  const message = readFirstString(data.message);
  if (message) return message;

  const nonField = readFirstString(data.nonFieldErrors) ?? readFirstString(data.non_field_errors);
  if (nonField) return nonField;

  if (isRecord(data.errors)) {
    for (const value of Object.values(data.errors)) {
      const nestedMessage = readFirstString(value);
      if (nestedMessage) return nestedMessage;
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (['detail', 'message', 'nonFieldErrors', 'non_field_errors', 'errors'].includes(key)) {
      continue;
    }
    const nestedMessage = readFirstString(value);
    if (nestedMessage) return nestedMessage;
  }

  return raw.message?.trim() || fallback;
};

