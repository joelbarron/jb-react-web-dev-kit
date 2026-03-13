import { z } from 'zod';
import {
  isValidOptionalCurp,
  isValidOptionalMxNss,
  isValidOptionalRfc
} from '../utils';

export const normalizeTextInput = (value: string): string => value.trim().replace(/\s+/g, ' ');

export const buildRequiredTextSchema = (label: string, minimumLength = 1): z.ZodString => {
  const field = z.string().trim().min(1, `${label} es obligatorio`);

  if (minimumLength <= 1) {
    return field;
  }

  return field.min(minimumLength, `${label} debe tener al menos ${minimumLength} caracteres`);
};

export const buildOptionalRegexTextSchema = (
  validateFn: (value: string) => boolean,
  invalidMessage: string
): z.ZodString =>
  z
    .string()
    .trim()
    .refine((value) => validateFn(value), invalidMessage);

export const buildOptionalCurpSchema = (
  invalidMessage = 'La CURP debe tener un formato válido.'
): z.ZodString => buildOptionalRegexTextSchema(isValidOptionalCurp, invalidMessage);

export const buildOptionalRfcSchema = (
  invalidMessage = 'El RFC debe tener un formato válido.'
): z.ZodString => buildOptionalRegexTextSchema(isValidOptionalRfc, invalidMessage);

export const buildOptionalMxNssSchema = (
  invalidMessage = 'El número de seguro social debe tener un formato válido.'
): z.ZodString => buildOptionalRegexTextSchema(isValidOptionalMxNss, invalidMessage);
