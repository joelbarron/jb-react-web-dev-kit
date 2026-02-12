import { RegisterOptions } from 'react-hook-form';

type FieldRules = RegisterOptions<any, any>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const jbRules = {
  required: (message = 'Este campo es obligatorio'): FieldRules => ({ required: message }),
  email: (message = 'Correo electrónico inválido'): FieldRules => ({
    pattern: { value: EMAIL_REGEX, message }
  }),
  minLength: (value: number, message?: string): FieldRules => ({
    minLength: { value, message: message ?? `Mínimo ${value} caracteres` }
  }),
  maxLength: (value: number, message?: string): FieldRules => ({
    maxLength: { value, message: message ?? `Máximo ${value} caracteres` }
  }),
  pattern: (value: RegExp, message: string): FieldRules => ({
    pattern: { value, message }
  }),
  compose: (...rules: FieldRules[]): FieldRules => Object.assign({}, ...rules) as FieldRules
};

/**
 * Puedes usar `rules` junto con `zodResolver`.
 * Si ambos validan la misma regla, el mensaje visible depende del error que primero reciba el campo.
 */
