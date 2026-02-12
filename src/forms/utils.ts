import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

type FormFieldError =
  | FieldError
  | Merge<FieldError, FieldErrorsImpl<Record<string, unknown>>>
  | undefined;

export const getJBFieldErrorMessage = (error: FormFieldError): string | undefined => {
  if (!error) return undefined;
  if (typeof error.message === 'string') return error.message;
  return undefined;
};
