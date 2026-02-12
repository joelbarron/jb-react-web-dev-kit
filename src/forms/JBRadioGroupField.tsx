import {
  FormControl,
  FormControlLabel,
  FormControlProps,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  RadioGroupProps
} from '@mui/material';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps, SelectOption } from './types';
import { getJBFieldErrorMessage } from './utils';

export type JBRadioGroupFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<RadioGroupProps, 'name' | 'value' | 'onChange'> & {
    label?: string;
    options: SelectOption[];
    formControlProps?: Omit<FormControlProps, 'error'>;
  };

export function JBRadioGroupField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBRadioGroupFieldProps<TFieldValues, TName>) {
  const { control, name, rules, label, options, formControlProps, ...radioGroupProps } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl
          {...formControlProps}
          error={!!fieldState.error}>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <RadioGroup
            {...radioGroupProps}
            name={field.name}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            onChange={(_, value) => field.onChange(value)}>
            {options.map((option) => (
              <FormControlLabel
                key={`${option.value}`}
                value={option.value}
                disabled={option.disabled}
                control={<Radio inputRef={field.ref} />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          <FormHelperText>{getJBFieldErrorMessage(fieldState.error)}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
