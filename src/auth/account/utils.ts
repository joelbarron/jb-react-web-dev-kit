export const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
};

export const asString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
};

export const pickValue = (source: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
};

export const pickString = (source: Record<string, unknown>, keys: string[]): string => {
  return asString(pickValue(source, keys)).trim();
};

export const toBase64DataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(file);
  });

export const toSnakeCaseProofFields = (tokens: {
  emailVerificationProofToken?: string;
  phoneVerificationProofToken?: string;
}) => {
  const payload: Record<string, unknown> = {};
  if (tokens.emailVerificationProofToken) {
    payload.email_verification_proof_token = tokens.emailVerificationProofToken;
  }
  if (tokens.phoneVerificationProofToken) {
    payload.phone_verification_proof_token = tokens.phoneVerificationProofToken;
  }
  return payload;
};

export const normalizeProfilesList = (payload: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload.map((item) => asRecord(item));
  }

  const record = asRecord(payload);
  if (Array.isArray(record.results)) {
    return record.results.map((item) => asRecord(item));
  }
  return [];
};

export const isDefaultProfile = (profile: Record<string, unknown>): boolean =>
  Boolean(profile.is_default ?? profile.isDefault);

export const findDefaultProfile = (profiles: Array<Record<string, unknown>>): Record<string, unknown> | null => {
  return profiles.find((profile) => isDefaultProfile(profile)) ?? profiles[0] ?? null;
};

const KNOWN_PHONE_CODES = ['+52', '+1', '+34', '+57', '+54', '+56', '+51', '+593', '+595', '+598'];

export const splitPhoneWithCode = (value: string): { countryCode: string; phone: string } => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return {
      countryCode: '',
      phone: ''
    };
  }

  for (const code of KNOWN_PHONE_CODES.sort((left, right) => right.length - left.length)) {
    if (normalized.startsWith(code)) {
      return {
        countryCode: code,
        phone: normalized.slice(code.length).replace(/\D+/g, '')
      };
    }
  }

  const genericMatch = normalized.match(/^(\+\d{1,4})(\d+)$/);
  if (genericMatch) {
    return {
      countryCode: genericMatch[1],
      phone: genericMatch[2]
    };
  }

  return {
    countryCode: '',
    phone: normalized.replace(/\D+/g, '')
  };
};

export const buildPhoneWithCode = (countryCode: string, phone: string): string => {
  const normalizedCode = String(countryCode || '').trim();
  const normalizedPhone = String(phone || '').replace(/\D+/g, '');
  if (!normalizedPhone) {
    return '';
  }
  return normalizedCode ? `${normalizedCode}${normalizedPhone}` : normalizedPhone;
};
