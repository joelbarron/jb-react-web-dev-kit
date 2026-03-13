import { JB_ZIP_CODE_REGEX } from './regex';

export const POSTAL_CODE_ERROR_MESSAGE =
  'Debes ingresar un código postal válido de 5 dígitos.';

export const isValidMxPostalCode = (value: string): boolean =>
  JB_ZIP_CODE_REGEX.test(String(value ?? '').trim());
