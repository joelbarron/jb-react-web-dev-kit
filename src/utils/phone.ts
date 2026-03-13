export const DEFAULT_PHONE_COUNTRY_CODE = '+52';

export const getCallingCodeValuesSorted = (options: Array<{ value: string }>) => {
  return options
    .map((option) => String(option.value))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
};

export const buildPhoneWithCountryCode = (
  countryCode: string | undefined,
  value: string | undefined,
  defaultCountryCode = DEFAULT_PHONE_COUNTRY_CODE
): string => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const normalizedCode = String(countryCode ?? '').trim() || defaultCountryCode;
  const safeCode = normalizedCode.startsWith('+') ? normalizedCode : `+${normalizedCode}`;
  return `${safeCode}${digits}`;
};

export const splitPhoneWithCountryCode = (
  value: unknown,
  callingCodes: string[],
  defaultCountryCode = DEFAULT_PHONE_COUNTRY_CODE
): { countryCode: string; localNumber: string } => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return { countryCode: defaultCountryCode, localNumber: '' };
  }
  if (!raw.startsWith('+')) {
    return { countryCode: defaultCountryCode, localNumber: raw.replace(/\D/g, '') };
  }

  const matchedCode = callingCodes.find((code) => raw.startsWith(code));
  if (!matchedCode) {
    return {
      countryCode: defaultCountryCode,
      localNumber: raw.replace(/^\+/, '').replace(/\D/g, '')
    };
  }

  const localNumber = raw.slice(matchedCode.length).replace(/^[\s-]+/, '').trim();
  return {
    countryCode: matchedCode,
    localNumber
  };
};
