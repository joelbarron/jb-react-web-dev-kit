import { TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps } from './types';
import { getJBFieldErrorMessage } from './utils';

export type JBTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<
    TextFieldProps,
    'name' | 'defaultValue' | 'value' | 'onChange' | 'error' | 'helperText'
  >;

export function JBTextField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBTextFieldProps<TFieldValues, TName>) {
  const { control, name, rules, ...textFieldProps } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          {...field}
          value={field.value ?? ''}
          error={!!fieldState.error}
          helperText={getJBFieldErrorMessage(fieldState.error)}
        />
      )}
    />
  );
}
