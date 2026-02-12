import {
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  FormControlProps,
  FormHelperText,
  Switch,
  SwitchProps
} from '@mui/material';
import { ReactNode } from 'react';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps } from './types';
import { getJBFieldErrorMessage } from './utils';

export type JBSwitchFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<SwitchProps, 'name' | 'checked' | 'onChange' | 'defaultChecked'> & {
    label: ReactNode;
    formControlProps?: Omit<FormControlProps, 'error'>;
    formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>;
  };

export function JBSwitchField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBSwitchFieldProps<TFieldValues, TName>) {
  const { control, name, rules, label, formControlProps, formControlLabelProps, ...switchProps } =
    props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl
          {...formControlProps}
          error={!!fieldState.error}>
          <FormControlLabel
            {...formControlLabelProps}
            label={label}
            control={
              <Switch
                {...switchProps}
                inputRef={field.ref}
                checked={!!field.value}
                onBlur={field.onBlur}
                onChange={(_, checked) => {
                  field.onChange(checked);
                }}
              />
            }
          />
          <FormHelperText>{getJBFieldErrorMessage(fieldState.error)}</FormHelperText>
        </FormControl>
      )}
    />
  );
}
