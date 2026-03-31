import { Autocomplete, CircularProgress, TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { JBFieldControlProps, SelectOption } from './types';
import { getJBFieldErrorMessage } from './utils';

export type JBAutocompleteFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<
    TextFieldProps,
    'name' | 'defaultValue' | 'value' | 'onChange' | 'error' | 'helperText'
  > & {
    options: SelectOption[];
    loading?: boolean;
    disableClearable?: boolean;
    multiple?: boolean;
    noOptionsText?: string;
    onSearchTextChange?: (value: string) => void;
  };

export function JBAutocompleteField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBAutocompleteFieldProps<TFieldValues, TName>) {
  const {
    control,
    name,
    rules,
    options,
    loading = false,
    disableClearable = false,
    multiple = false,
    noOptionsText = 'Sin opciones',
    onSearchTextChange,
    size = 'medium',
    ...textFieldProps
  } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => {
        const selectedOption = multiple
          ? options.filter((option) =>
              Array.isArray(field.value)
                ? field.value.some((item: unknown) => String(item) === String(option.value))
                : false
            )
          : options.find((option) => String(option.value) === String(field.value ?? '')) ?? null;

        return (
          <Autocomplete
            multiple={multiple}
            options={options}
            value={selectedOption as SelectOption | SelectOption[] | null}
            disabled={textFieldProps.disabled}
            loading={loading}
            disableClearable={disableClearable}
            noOptionsText={noOptionsText}
            disableCloseOnSelect={multiple}
            getOptionDisabled={(option) => !!option.disabled}
            getOptionLabel={(option) => option.label ?? ''}
            isOptionEqualToValue={(option, value) => String(option.value) === String(value.value)}
            onChange={(_, option) => {
              if (multiple) {
                const selectedValues = Array.isArray(option)
                  ? (option as SelectOption[]).map((selectedOptionItem) => selectedOptionItem.value)
                  : [];
                field.onChange(selectedValues);
                return;
              }

              const selectedValue = !Array.isArray(option) ? (option as SelectOption | null) : null;
              field.onChange(selectedValue ? selectedValue.value : '');
            }}
            onInputChange={(_, value, reason) => {
              if (reason === 'input') {
                onSearchTextChange?.(value);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                {...textFieldProps}
                name={field.name}
                size={size}
                error={!!fieldState.error}
                helperText={getJBFieldErrorMessage(fieldState.error)}
                inputRef={field.ref}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress
                          color="inherit"
                          size={16}
                        />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
