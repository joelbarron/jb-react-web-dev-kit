import { zodResolver } from '@hookform/resolvers/zod';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { JBAuthRequiredProfileFields } from '../../../config';
import { JBCheckboxField, JBDatePickerField, JBSelectField, JBTextField, SelectOption } from '../../../forms';
import { GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { RegisterPayload } from '../../types';
import { AuthPrimaryButton } from '../../ui';
import { getDjangoLikePasswordError, isPasswordTooSimilar } from '../password/passwordValidation';
import { parseAuthError } from '../errorParser';

const DEFAULT_REQUIRED_PROFILE_FIELDS: JBAuthRequiredProfileFields = {
  firstName: true,
  lastName1: true,
  lastName2: false,
  birthday: true,
  gender: true,
  label: false
};

const createSignUpSchema = (requiredProfileFields: JBAuthRequiredProfileFields) => z
  .object({
    firstName: z.string(),
    lastName1: z.string(),
    lastName2: z.string().optional(),
    email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo'),
    birthday: z.string().optional(),
    gender: z.union([z.enum(GENDERS), z.literal('')]).optional(),
    role: z.string().optional(),
    password: z.string().nonempty('Debes ingresar la contraseña.'),
    passwordConfirm: z.string().nonempty('La confirmación de contraseña es obligatoria'),
    acceptTermsConditions: z.boolean().refine((val) => val === true, 'Debes aceptar los términos y condiciones.')
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas deben coincidir',
    path: ['passwordConfirm']
  })
  .superRefine((data, ctx) => {
    if (requiredProfileFields.firstName && !data.firstName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes ingresar el nombre',
        path: ['firstName']
      });
    }

    if (requiredProfileFields.lastName1 && !data.lastName1.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes ingresar el primer apellido',
        path: ['lastName1']
      });
    }

    if (requiredProfileFields.lastName2 && !String(data.lastName2 || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes ingresar el segundo apellido',
        path: ['lastName2']
      });
    }

    if (requiredProfileFields.birthday && !String(data.birthday || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes ingresar la fecha de nacimiento',
        path: ['birthday']
      });
    }

    const gender = String(data.gender || '').trim().toUpperCase();
    if (gender && !GENDERS.includes(gender as (typeof GENDERS)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes seleccionar un género válido',
        path: ['gender']
      });
    }

    if (requiredProfileFields.gender && !gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes seleccionar el género',
        path: ['gender']
      });
    }

    const passwordError = getDjangoLikePasswordError(data.password);
    if (passwordError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: passwordError,
        path: ['password']
      });
    }

    if (isPasswordTooSimilar(data.password, [data.email, data.firstName, data.lastName1, data.lastName2])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La contraseña es demasiado similar a tus datos personales.',
        path: ['password']
      });
    }
  });

type SignUpSchema = ReturnType<typeof createSignUpSchema>;
export type AuthSignUpFormValues = z.infer<SignUpSchema>;

export type AuthSignUpFormProps = {
  defaultValues?: Partial<AuthSignUpFormValues>;
  loading?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  fieldsScrollable?: boolean;
  formMaxHeight?: string | number;
  roleOptions?: Array<SelectOption<string> & { allowSignup?: boolean }>;
  defaultRole?: string;
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>;
  onSubmit: (values: RegisterPayload) => unknown | Promise<unknown>;
};

const defaultValues: AuthSignUpFormValues = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  email: '',
  birthday: '',
  gender: '',
  role: '',
  password: '',
  passwordConfirm: '',
  acceptTermsConditions: false
};

export function AuthSignUpForm(props: AuthSignUpFormProps) {
  const {
    defaultValues: valuesFromProps,
    loading = false,
    disabled = false,
    submitLabel = 'Crear cuenta',
    fieldsScrollable = false,
    formMaxHeight = 'min(72dvh, 620px)',
    roleOptions,
    defaultRole,
    requiredProfileFields,
    onSubmit
  } = props;
  const resolvedRequiredProfileFields = useMemo(
    () => ({
      ...DEFAULT_REQUIRED_PROFILE_FIELDS,
      ...(requiredProfileFields ?? {})
    }),
    [requiredProfileFields]
  );
  const signUpSchema = useMemo(
    () => createSignUpSchema(resolvedRequiredProfileFields),
    [resolvedRequiredProfileFields]
  );
  const signupRoleOptions = (roleOptions ?? []).filter((roleOption) => roleOption.allowSignup !== false);
  const resolvedDefaultRole =
    valuesFromProps?.role ??
    defaultRole ??
    signupRoleOptions[0]?.value ??
    defaultValues.role;
  const { control, formState, handleSubmit, setError, clearErrors, trigger, watch } = useForm<AuthSignUpFormValues>({
    mode: 'onChange',
    defaultValues: {
      ...defaultValues,
      role: resolvedDefaultRole,
      ...(valuesFromProps ?? {})
    },
    resolver: zodResolver(signUpSchema)
  });

  const { isValid, dirtyFields, errors, isSubmitting } = formState;
  const isLoading = loading || isSubmitting;
  const passwordValue = useWatch({ control, name: 'password' });
  const passwordConfirmValue = useWatch({ control, name: 'passwordConfirm' });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (!passwordConfirmValue) {
      return;
    }
    void trigger('passwordConfirm');
  }, [passwordValue, passwordConfirmValue, trigger]);

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name) {
        clearErrors(name as keyof AuthSignUpFormValues);
      }
      clearErrors('root');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, clearErrors]);

  async function onSubmitForm(values: AuthSignUpFormValues) {
    try {
      await onSubmit({
        firstName: values.firstName,
        lastName1: values.lastName1,
        lastName2: values.lastName2 || undefined,
        username: null,
        email: values.email,
        birthday: values.birthday || undefined,
        gender: values.gender || undefined,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
        role: values.role || defaultRole || undefined,
        termsAndConditionsAccepted: values.acceptTermsConditions
      });
    } catch (error) {
      const parsed = parseAuthError(error, {
        username: 'email'
      });
      const allowedFields: Array<keyof AuthSignUpFormValues> = [
        'firstName',
        'lastName1',
        'lastName2',
        'email',
        'birthday',
        'gender',
        'role',
        'password',
        'passwordConfirm',
        'acceptTermsConditions'
      ];

      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        if (allowedFields.includes(field as keyof AuthSignUpFormValues)) {
          setError(field as keyof AuthSignUpFormValues, { type: 'manual', message });
          return;
        }

        setError('root', {
          type: 'manual',
          message
        });
      });

      if (parsed.rootMessage) {
        setError('root', {
          type: 'manual',
          message: parsed.rootMessage
        });
        return;
      }

      setError('root', {
        type: 'manual',
        message: 'No se pudo crear la cuenta. Inténtalo de nuevo.'
      });
    }
  }

  return (
    <form
      name="registerForm"
      noValidate
      style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        paddingTop: 4,
        ...(fieldsScrollable
          ? {
              height: '100%',
              maxHeight: typeof formMaxHeight === 'number' ? `${formMaxHeight}px` : formMaxHeight,
              minHeight: 0,
              overflow: 'hidden'
            }
          : null)
      }}
      onSubmit={handleSubmit(onSubmitForm)}>
      <Box
        sx={{
          ...(fieldsScrollable
            ? {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                pr: 0.5,
                pb: 1
              }
            : null)
        }}>
        <JBTextField
          control={control}
          name="firstName"
          sx={{ mb: 3 }}
          label="Nombre(s)"
          autoFocus
          type="text"
          variant="outlined"
          required={resolvedRequiredProfileFields.firstName}
        fullWidth
        disabled={disabled}
      />

        <JBTextField
          control={control}
          name="lastName1"
          sx={{ mb: 3 }}
          label="Primer apellido"
          type="text"
          variant="outlined"
          required={resolvedRequiredProfileFields.lastName1}
        fullWidth
        disabled={disabled}
      />

        <JBTextField
          control={control}
          name="lastName2"
          sx={{ mb: 3 }}
          label="Segundo apellido"
          type="text"
          variant="outlined"
          required={resolvedRequiredProfileFields.lastName2}
          fullWidth
          disabled={disabled}
        />

        <JBTextField
          control={control}
          name="email"
          sx={{ mb: 3 }}
          label="Correo electrónico"
          type="email"
          variant="outlined"
          required
          fullWidth
          disabled={disabled}
        />

        <JBDatePickerField
          control={control}
          name="birthday"
          sx={{ mb: 3 }}
          label="Fecha de nacimiento"
          disableFuture
          storeAsDateString
          textFieldProps={{
            variant: 'outlined',
            fullWidth: true,
            required: resolvedRequiredProfileFields.birthday
          }}
          disabled={disabled}
        />

        <JBSelectField
          control={control}
          name="gender"
          sx={{ mb: 3 }}
          label="Género"
          variant="outlined"
          required={resolvedRequiredProfileFields.gender}
          fullWidth
          emptyOptionLabel="Selecciona"
          options={GENDER_SELECT_OPTIONS}
          disabled={disabled}
        />

        {signupRoleOptions.length > 0 ? (
          <JBSelectField
            control={control}
            name="role"
            sx={{ mb: 3 }}
            label="Rol de perfil"
            variant="outlined"
            fullWidth
            options={signupRoleOptions}
            required
            disabled={disabled}
          />
        ) : null}

        <JBTextField
          control={control}
          name="password"
          sx={{ mb: 3 }}
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
          variant="outlined"
          required
          fullWidth
          disabled={disabled}
        />

        <JBTextField
          control={control}
          name="passwordConfirm"
          sx={{ mb: 3 }}
          label="Confirmar contraseña"
          type={showPasswordConfirm ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showPasswordConfirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}>
                  {showPasswordConfirm ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
          variant="outlined"
          required
          fullWidth
          disabled={disabled}
        />

        <JBCheckboxField
          control={control}
          name="acceptTermsConditions"
          size="small"
          label="Acepto términos y políticas de privacidad"
          disabled={disabled}
        />
      </Box>

      {errors.root?.message ? (
        <Alert
          sx={{ mt: 2 }}
          severity="error">
          {errors.root.message}
        </Alert>
      ) : null}

      <AuthPrimaryButton
        sx={{ mt: 3 }}
        aria-label={submitLabel}
        disabled={disabled || isLoading || _.isEmpty(dirtyFields) || !isValid}
        loading={isLoading}
        loadingLabel="Creando cuenta..."
        startIcon={<PersonAddAlt1OutlinedIcon fontSize="small" />}
        type="submit"
        size="large">
        {submitLabel}
      </AuthPrimaryButton>
    </form>
  );
}
