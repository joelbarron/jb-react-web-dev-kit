import { MenuItem, TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps, SelectOption } from './types';
import { getJBFieldErrorMessage } from './utils';

export type JBSelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<
    TextFieldProps,
    'name' | 'defaultValue' | 'value' | 'onChange' | 'error' | 'helperText' | 'select'
  > & {
    options: SelectOption[];
    emptyOptionLabel?: string;
  };

export function JBSelectField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBSelectFieldProps<TFieldValues, TName>) {
  const { control, name, rules, options, emptyOptionLabel, ...textFieldProps } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          {...field}
          select
          value={field.value ?? ''}
          error={!!fieldState.error}
          helperText={getJBFieldErrorMessage(fieldState.error)}>
          {emptyOptionLabel ? <MenuItem value="">{emptyOptionLabel}</MenuItem> : null}
          {options.map((option, index) => (
            <MenuItem
              key={`${option.value}-${index}`}
              value={option.value}
              disabled={option.disabled}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
