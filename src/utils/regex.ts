export const JB_PHONE_REGEX =
  /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/;

export const JB_ZIP_CODE_REGEX = /^\d{5}$/;
export const JB_NUMBER_REGEX = /^[0-9]*$/;
export const JB_DECIMAL_NUMBER_REGEX = /^-?\d+(\.\d+)?$/;
export const JB_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const JB_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
export const JB_CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/;
export const JB_RFC_REGEX = /^([A-Z&Ñ]{3,4})\d{6}[A-Z0-9]{3}$/;
export const JB_MX_NSS_REGEX = /^\d{11}$/;

export const normalizeCurp = (value: string): string =>
  String(value ?? '').trim().toUpperCase();

export const normalizeRfc = (value: string): string =>
  String(value ?? '').trim().toUpperCase();

export const normalizeMxNss = (value: string): string =>
  String(value ?? '').replace(/\D+/g, '').trim();

export const isValidOptionalCurp = (value: string): boolean => {
  const normalized = normalizeCurp(value);
  return !normalized || JB_CURP_REGEX.test(normalized);
};

export const isValidOptionalRfc = (value: string): boolean => {
  const normalized = normalizeRfc(value);
  return !normalized || JB_RFC_REGEX.test(normalized);
};

export const isValidOptionalMxNss = (value: string): boolean => {
  const normalized = normalizeMxNss(value);
  return !normalized || JB_MX_NSS_REGEX.test(normalized);
};
