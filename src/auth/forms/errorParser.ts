type ParsedAuthError = {
  fieldErrors: Record<string, string>;
  rootMessage?: string;
};

const toCamelCase = (value: string) =>
  value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

const readMessage = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string');
    return typeof first === 'string' ? first : undefined;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.detail === 'string') return record.detail;
  }
  return undefined;
};

export const parseAuthError = (
  error: unknown,
  fieldAliases?: Record<string, string>
): ParsedAuthError => {
  const raw = error as {
    response?: { data?: unknown };
    data?: unknown;
    message?: string;
  };

  const responseData = (raw.response?.data ?? raw.data) as unknown;
  const parsed: ParsedAuthError = { fieldErrors: {} };

  const normalizeField = (key: string) => {
    const camelKey = toCamelCase(key);
    return fieldAliases?.[camelKey] ?? camelKey;
  };

  const legacyErrors = (responseData as { data?: unknown })?.data;
  if (Array.isArray(legacyErrors)) {
    legacyErrors.forEach((entry) => {
      const item = entry as { type?: string; message?: string };
      if (!item?.type || !item?.message) return;
      const field = normalizeField(item.type);
      if (field === 'root') {
        parsed.rootMessage = item.message;
        return;
      }
      parsed.fieldErrors[field] = item.message;
    });
  }

  if (typeof responseData === 'string' && !parsed.rootMessage) {
    parsed.rootMessage = responseData;
  }

  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    const data = responseData as Record<string, unknown>;

    const detailMessage = readMessage(data.detail);
    const nonFieldMessage = readMessage(data.non_field_errors);
    const message = readMessage(data.message);
    parsed.rootMessage = parsed.rootMessage ?? detailMessage ?? nonFieldMessage ?? message;

    Object.entries(data).forEach(([key, value]) => {
      if (['detail', 'non_field_errors', 'message', 'code', 'status'].includes(key)) {
        return;
      }
      const fieldMessage = readMessage(value);
      if (!fieldMessage) return;
      parsed.fieldErrors[normalizeField(key)] = fieldMessage;
    });
  }

  if (!parsed.rootMessage && Object.keys(parsed.fieldErrors).length === 0 && raw.message) {
    parsed.rootMessage = raw.message;
  }

  return parsed;
};
