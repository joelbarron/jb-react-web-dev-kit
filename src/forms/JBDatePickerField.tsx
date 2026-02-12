import { TextFieldProps } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { ComponentProps } from 'react';
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
  };

export function JBDatePickerField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBDatePickerFieldProps<TFieldValues, TName>) {
  const { control, name, rules, textFieldProps, ...datePickerProps } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <DatePicker
          {...datePickerProps}
          value={field.value ?? null}
          onChange={(value) => field.onChange(value)}
          slotProps={{
            textField: {
              ...textFieldProps,
              error: !!fieldState.error,
              helperText: getJBFieldErrorMessage(fieldState.error) ?? textFieldProps?.helperText
            }
          }}
        />
      )}
    />
  );
}
