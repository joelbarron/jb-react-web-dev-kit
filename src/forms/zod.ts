import { z } from 'zod';

export const normalizeTextInput = (value: string): string => value.trim().replace(/\s+/g, ' ');

export const buildRequiredTextSchema = (label: string, minimumLength = 1): z.ZodString => {
  const field = z.string().trim().min(1, `${label} es obligatorio`);

  if (minimumLength <= 1) {
    return field;
  }

  return field.min(minimumLength, `${label} debe tener al menos ${minimumLength} caracteres`);
};

