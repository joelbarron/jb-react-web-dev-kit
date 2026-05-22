import { MenuItem, TextField, TextFieldProps, InputAdornment, Select, FormControl } from '@mui/material';
import { Controller, FieldValues, Path } from 'react-hook-form';

import { COUNTRY_CALLING_CODE_OPTIONS, type CountryCallingCodeOption } from '../auth/constants/countryCallingCodes';
import { JBFieldControlProps } from './types';
import { getJBFieldErrorMessage } from './utils';

/**
 * JBPhoneField — input de teléfono con selector de código de país.
 *
 * El field controla **una sola string** en formato E.164-ish:
 *     "+52 1234567890"  →  country code + espacio + número nacional.
 *
 * Al renderear, separa internamente la string en (countryCode, nationalNumber)
 * para mostrar el selector + el número editables. Al cambiar cualquiera,
 * recompone la string y la propaga via `field.onChange`.
 *
 * Default country code: `+52` (México). Override con `defaultCountryCode`.
 *
 * Las opciones de países vienen de `COUNTRY_CALLING_CODE_OPTIONS` que ya
 * incluye banderas emoji (🇲🇽, 🇺🇸, ...).
 *
 * Uso:
 * ```tsx
 * <JBPhoneField
 *   control={control}
 *   name="responsible_phone"
 *   label="Teléfono"
 *   required
 *   fullWidth
 * />
 * ```
 */
export type JBPhoneFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = JBFieldControlProps<TFieldValues, TName> &
  Omit<
    TextFieldProps,
    'name' | 'defaultValue' | 'value' | 'onChange' | 'error' | 'helperText' | 'InputProps'
  > & {
    defaultCountryCode?: string; // ej. '+52'
  };

const DEFAULT_COUNTRY_CODE = '+52';

/** Separa una string E.164-ish en (countryCode, nationalNumber). */
function splitPhone(raw: string | null | undefined, fallbackCode: string): {
  code: string;
  national: string;
} {
  const value = String(raw ?? '').trim();
  if (!value) {
    return { code: fallbackCode, national: '' };
  }

  // Si arranca con '+', buscamos el código de país (1-4 dígitos después del +).
  if (value.startsWith('+')) {
    // Match contra la lista de COUNTRY_CALLING_CODE_OPTIONS, buscando prefijo más largo.
    const sortedByLen = [...COUNTRY_CALLING_CODE_OPTIONS].sort(
      (a, b) => b.dialCode.length - a.dialCode.length,
    );
    for (const opt of sortedByLen) {
      if (value.startsWith(opt.dialCode)) {
        const rest = value.slice(opt.dialCode.length).trim();
        return { code: opt.dialCode, national: rest };
      }
    }
  }

  // Fallback: tratar todo como número nacional, usar fallback code.
  return { code: fallbackCode, national: value };
}

function joinPhone(code: string, national: string): string {
  const trimmedNational = national.trim();
  if (!trimmedNational) {
    return '';
  }
  return `${code} ${trimmedNational}`;
}

export function JBPhoneField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>(props: JBPhoneFieldProps<TFieldValues, TName>) {
  const {
    control,
    name,
    rules,
    defaultCountryCode = DEFAULT_COUNTRY_CODE,
    size = 'medium',
    label,
    required,
    fullWidth,
    disabled,
    placeholder,
    ...textFieldProps
  } = props;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => {
        const { code, national } = splitPhone(field.value as string, defaultCountryCode);

        const handleCodeChange = (newCode: string) => {
          field.onChange(joinPhone(newCode, national));
        };

        const handleNationalChange = (newNational: string) => {
          field.onChange(joinPhone(code, newNational));
        };

        return (
          <TextField
            {...textFieldProps}
            label={label}
            required={required}
            fullWidth={fullWidth}
            disabled={disabled}
            placeholder={placeholder ?? '10 dígitos'}
            size={size}
            value={national}
            onChange={(e) => handleNationalChange(e.target.value)}
            error={!!fieldState.error}
            helperText={getJBFieldErrorMessage(fieldState.error)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FormControl variant="standard" sx={{ minWidth: 90 }}>
                    <Select
                      value={code}
                      onChange={(e) => handleCodeChange(String(e.target.value))}
                      disabled={disabled}
                      disableUnderline
                      sx={{
                        fontSize: 14,
                        '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 0.5 },
                      }}
                      renderValue={(value) => {
                        const opt = COUNTRY_CALLING_CODE_OPTIONS.find((o) => o.dialCode === value);
                        if (!opt) return value;
                        // Solo muestra la bandera + dial code en el trigger.
                        const flag = opt.label.split(' ')[0];
                        return `${flag} ${opt.dialCode}`;
                      }}
                      MenuProps={{
                        PaperProps: { sx: { maxHeight: 320 } },
                      }}
                    >
                      {COUNTRY_CALLING_CODE_OPTIONS.map((opt: CountryCallingCodeOption) => (
                        <MenuItem key={opt.iso2} value={opt.dialCode}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </InputAdornment>
              ),
            }}
          />
        );
      }}
    />
  );
}
