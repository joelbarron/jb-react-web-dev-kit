export type JBGeoOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const COUNTRY_PRIORITY = ['MX', 'US', 'ES', 'AR', 'CO', 'CL', 'PE', 'EC', 'BR', 'CA'];

const FALLBACK_COUNTRY_CODES = [
  'MX',
  'US',
  'CA',
  'ES',
  'AR',
  'CO',
  'CL',
  'PE',
  'EC',
  'UY',
  'PY',
  'BO',
  'BR',
  'FR',
  'DE',
  'IT',
  'GB',
  'PT'
];

const MEXICO_STATES: JBGeoOption[] = [
  { value: 'Aguascalientes', label: 'Aguascalientes' },
  { value: 'Baja California', label: 'Baja California' },
  { value: 'Baja California Sur', label: 'Baja California Sur' },
  { value: 'Campeche', label: 'Campeche' },
  { value: 'Chiapas', label: 'Chiapas' },
  { value: 'Chihuahua', label: 'Chihuahua' },
  { value: 'Ciudad de Mexico', label: 'Ciudad de Mexico' },
  { value: 'Coahuila', label: 'Coahuila' },
  { value: 'Colima', label: 'Colima' },
  { value: 'Durango', label: 'Durango' },
  { value: 'Estado de Mexico', label: 'Estado de Mexico' },
  { value: 'Guanajuato', label: 'Guanajuato' },
  { value: 'Guerrero', label: 'Guerrero' },
  { value: 'Hidalgo', label: 'Hidalgo' },
  { value: 'Jalisco', label: 'Jalisco' },
  { value: 'Michoacan', label: 'Michoacan' },
  { value: 'Morelos', label: 'Morelos' },
  { value: 'Nayarit', label: 'Nayarit' },
  { value: 'Nuevo Leon', label: 'Nuevo Leon' },
  { value: 'Oaxaca', label: 'Oaxaca' },
  { value: 'Puebla', label: 'Puebla' },
  { value: 'Queretaro', label: 'Queretaro' },
  { value: 'Quintana Roo', label: 'Quintana Roo' },
  { value: 'San Luis Potosi', label: 'San Luis Potosi' },
  { value: 'Sinaloa', label: 'Sinaloa' },
  { value: 'Sonora', label: 'Sonora' },
  { value: 'Tabasco', label: 'Tabasco' },
  { value: 'Tamaulipas', label: 'Tamaulipas' },
  { value: 'Tlaxcala', label: 'Tlaxcala' },
  { value: 'Veracruz', label: 'Veracruz' },
  { value: 'Yucatan', label: 'Yucatan' },
  { value: 'Zacatecas', label: 'Zacatecas' }
];

const UNITED_STATES: JBGeoOption[] = [
  { value: 'Alabama', label: 'Alabama' },
  { value: 'Alaska', label: 'Alaska' },
  { value: 'Arizona', label: 'Arizona' },
  { value: 'Arkansas', label: 'Arkansas' },
  { value: 'California', label: 'California' },
  { value: 'Colorado', label: 'Colorado' },
  { value: 'Connecticut', label: 'Connecticut' },
  { value: 'Delaware', label: 'Delaware' },
  { value: 'Florida', label: 'Florida' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Hawaii', label: 'Hawaii' },
  { value: 'Idaho', label: 'Idaho' },
  { value: 'Illinois', label: 'Illinois' },
  { value: 'Indiana', label: 'Indiana' },
  { value: 'Iowa', label: 'Iowa' },
  { value: 'Kansas', label: 'Kansas' },
  { value: 'Kentucky', label: 'Kentucky' },
  { value: 'Louisiana', label: 'Louisiana' },
  { value: 'Maine', label: 'Maine' },
  { value: 'Maryland', label: 'Maryland' },
  { value: 'Massachusetts', label: 'Massachusetts' },
  { value: 'Michigan', label: 'Michigan' },
  { value: 'Minnesota', label: 'Minnesota' },
  { value: 'Mississippi', label: 'Mississippi' },
  { value: 'Missouri', label: 'Missouri' },
  { value: 'Montana', label: 'Montana' },
  { value: 'Nebraska', label: 'Nebraska' },
  { value: 'Nevada', label: 'Nevada' },
  { value: 'New Hampshire', label: 'New Hampshire' },
  { value: 'New Jersey', label: 'New Jersey' },
  { value: 'New Mexico', label: 'New Mexico' },
  { value: 'New York', label: 'New York' },
  { value: 'North Carolina', label: 'North Carolina' },
  { value: 'North Dakota', label: 'North Dakota' },
  { value: 'Ohio', label: 'Ohio' },
  { value: 'Oklahoma', label: 'Oklahoma' },
  { value: 'Oregon', label: 'Oregon' },
  { value: 'Pennsylvania', label: 'Pennsylvania' },
  { value: 'Rhode Island', label: 'Rhode Island' },
  { value: 'South Carolina', label: 'South Carolina' },
  { value: 'South Dakota', label: 'South Dakota' },
  { value: 'Tennessee', label: 'Tennessee' },
  { value: 'Texas', label: 'Texas' },
  { value: 'Utah', label: 'Utah' },
  { value: 'Vermont', label: 'Vermont' },
  { value: 'Virginia', label: 'Virginia' },
  { value: 'Washington', label: 'Washington' },
  { value: 'West Virginia', label: 'West Virginia' },
  { value: 'Wisconsin', label: 'Wisconsin' },
  { value: 'Wyoming', label: 'Wyoming' }
];

const STATES_BY_COUNTRY: Record<string, JBGeoOption[]> = {
  MX: MEXICO_STATES,
  US: UNITED_STATES
};

const countryOptionsCache = new Map<string, JBGeoOption[]>();

const isValidCountryCode = (code: string) => /^[A-Z]{2}$/.test(code);

const sortCountryCodes = (countryCodes: string[]) => {
  return [...countryCodes].sort((left, right) => {
    const leftIndex = COUNTRY_PRIORITY.indexOf(left);
    const rightIndex = COUNTRY_PRIORITY.indexOf(right);

    if (leftIndex >= 0 && rightIndex >= 0) {
      return leftIndex - rightIndex;
    }

    if (leftIndex >= 0) {
      return -1;
    }

    if (rightIndex >= 0) {
      return 1;
    }

    return left.localeCompare(right);
  });
};

const resolveCountryCodes = (): string[] => {
  const intlValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof intlValuesOf === 'function') {
    try {
      // NOTE: "region" is not supported in all runtimes and may throw RangeError.
      const values = intlValuesOf('region')
        .map((value) => value.toUpperCase())
        .filter((value) => isValidCountryCode(value));

      if (values.length > 0) {
        return sortCountryCodes(Array.from(new Set(values)));
      }
    } catch (_error) {
      // Fallback list is used when runtime does not support region values.
    }
  }

  return sortCountryCodes(FALLBACK_COUNTRY_CODES);
};

const resolveCountryName = (countryCode: string, locale: string): string => {
  if (typeof Intl.DisplayNames !== 'function') {
    return countryCode;
  }

  const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
  return displayNames.of(countryCode) ?? countryCode;
};

export const jbCountryCodeToFlagEmoji = (countryCode: string): string => {
  const normalized = countryCode.trim().toUpperCase();
  if (!isValidCountryCode(normalized)) {
    return '🏳️';
  }

  const points = [...normalized].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
};

export const getJBCountryOptions = (locale = 'es-MX'): JBGeoOption[] => {
  const cacheKey = locale.toLowerCase();
  const cached = countryOptionsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const options = resolveCountryCodes().map((countryCode) => {
    const countryName = resolveCountryName(countryCode, locale);
    const flag = jbCountryCodeToFlagEmoji(countryCode);
    return {
      value: countryCode,
      label: `${flag} ${countryName}`
    };
  });

  countryOptionsCache.set(cacheKey, options);
  return options;
};

export const getJBStateOptionsByCountry = (countryCode?: string | null): JBGeoOption[] => {
  const normalizedCountry = (countryCode ?? '').trim().toUpperCase();
  if (!normalizedCountry) {
    return [];
  }

  return STATES_BY_COUNTRY[normalizedCountry] ?? [];
};
