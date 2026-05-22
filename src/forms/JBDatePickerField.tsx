import { TextFieldProps } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { ComponentProps, FocusEvent } from 'react';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps } from './types';
import { getJBFieldErrorMessage } from './utils';

type MuiDatePickerProps = ComponentProps<typeof DatePicker>;

export type JBDatePickerFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<MuiDatePickerProps, 'value' | 'onChange' | 'slotProps'> & {
    textFieldProps?: TextFieldProps;
    storeAsDateString?: boolean;
  };

const asDateValue = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const isoDateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (isoDateOnlyMatch) {
    const year = Number(isoDateOnlyMatch[1]);
    const month = Number(isoDateOnlyMatch[2]);
    const day = Number(isoDateOnlyMatch[3]);
    const localDate = new Date(year, month - 1, day);
    if (!Number.isNaN(localDate.getTime())) {
      return localDate;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatDateValue = (value: unknown): string => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '';
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

export function JBDatePickerField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBDatePickerFieldProps<TFieldValues, TName>) {
  const {
    control,
    name,
    rules,
    textFieldProps,
    sx: datePickerSx,
    storeAsDateString = false,
    ...datePickerProps
  } = props;
  const { format: dateFormat, ...resolvedDatePickerProps } = datePickerProps;
  const { size = 'medium', ...resolvedTextFieldProps } = textFieldProps ?? {};
  const resolvedDateFormat = dateFormat ?? 'dd/MM/yyyy';
  const asSxArray = (value: unknown) => (Array.isArray(value) ? value : [value]);
  const mergedTextFieldSx = [
    {
      '& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root': {
        backgroundColor: 'common.background'
      }
    },
    ...asSxArray(datePickerSx),
    ...asSxArray(resolvedTextFieldProps.sx)
  ];

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            {...resolvedDatePickerProps}
            sx={datePickerSx}
            format={resolvedDateFormat}
            value={storeAsDateString ? asDateValue(field.value) : field.value ?? null}
            onChange={(value, context) => {
              const hasValidationError = Boolean(context?.validationError);

              if (storeAsDateString) {
                if (!hasValidationError && isValidDate(value)) {
                  field.onChange(formatDateValue(value));
                } else if (!hasValidationError && value === null) {
                  // El campo fue vaciado — limpiar el valor para que
                  // el picker no revierta al valor anterior en el re-render.
                  field.onChange('');
                }
                return;
              }

              if (!hasValidationError && isValidDate(value)) {
                field.onChange(value);
              } else if (!hasValidationError && value === null) {
                field.onChange(null);
              }
            }}
            slotProps={{
              textField: {
                ...resolvedTextFieldProps,
                size,
                inputRef: field.ref,
                sx: mergedTextFieldSx,
                error: !!fieldState.error,
                helperText: getJBFieldErrorMessage(fieldState.error) ?? resolvedTextFieldProps.helperText,
                onBlur: (event: FocusEvent<HTMLInputElement>) => {
                  resolvedTextFieldProps.onBlur?.(event);
                  field.onBlur();
                  // No limpiamos aquí basándonos en event.target.value.
                  // En MUI DatePicker v6+ el input subyacente es section-based
                  // y su .value puede ser "" aunque haya una fecha visible,
                  // lo que causaría borrar un valor válido al perder el foco.
                  // El vaciado real (usuario borra el campo) ya se maneja en
                  // onChange cuando MUI emite value=null sin validationError.
                }
              }
            }}
          />
        </LocalizationProvider>
      )}
    />
  );
}
