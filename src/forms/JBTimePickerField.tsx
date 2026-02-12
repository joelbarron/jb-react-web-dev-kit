import { TextFieldProps } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { ComponentProps } from 'react';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps } from './types';
import { getJBFieldErrorMessage } from './utils';

type MuiTimePickerProps = ComponentProps<typeof TimePicker>;

export type JBTimePickerFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<MuiTimePickerProps, 'value' | 'onChange' | 'slotProps'> & {
    textFieldProps?: TextFieldProps;
  };

export function JBTimePickerField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBTimePickerFieldProps<TFieldValues, TName>) {
  const { control, name, rules, textFieldProps, ...timePickerProps } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <TimePicker
          {...timePickerProps}
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
