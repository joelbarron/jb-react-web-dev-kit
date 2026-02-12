import {
  Checkbox,
  CheckboxProps,
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  FormControlProps,
  FormHelperText,
  SxProps,
  Theme
} from '@mui/material';
import { ReactNode } from 'react';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps } from './types';
import { getJBFieldErrorMessage } from './utils';

export type JBCheckboxFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<CheckboxProps, 'name' | 'checked' | 'onChange' | 'defaultChecked'> & {
    label: ReactNode;
    formControlProps?: Omit<FormControlProps, 'error'>;
    formControlLabelProps?: Omit<FormControlLabelProps, 'control' | 'label'>;
    checkboxSx?: SxProps<Theme>;
  };

export function JBCheckboxField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBCheckboxFieldProps<TFieldValues, TName>) {
  const {
    control,
    name,
    rules,
    label,
    formControlProps,
    formControlLabelProps,
    checkboxSx,
    ...checkboxProps
  } = props;

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
            sx={{
              alignItems: 'center',
              m: 0,
              columnGap: 1,
              '& .MuiFormControlLabel-label': {
                fontSize: 14,
                lineHeight: 1.35,
                color: 'text.primary'
              }
            }}
            control={
              <Checkbox
                {...checkboxProps}
                size={checkboxProps.size ?? 'small'}
                inputRef={field.ref}
                checked={!!field.value}
                onBlur={field.onBlur}
                onChange={(_, checked) => {
                  field.onChange(checked);
                }}
                sx={{
                  p: 0.25,
                  borderRadius: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: 18
                  },
                  '&:not(.Mui-checked) .MuiSvgIcon-root': {
                    color: 'transparent',
                    border: '1px solid',
                    borderColor: 'rgba(15, 23, 42, 0.35)',
                    borderRadius: '4px',
                    backgroundColor: 'background.paper'
                  },
                  '&:hover:not(.Mui-checked) .MuiSvgIcon-root': {
                    borderColor: 'rgba(15, 23, 42, 0.55)'
                  },
                  ...(checkboxSx ?? {})
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
