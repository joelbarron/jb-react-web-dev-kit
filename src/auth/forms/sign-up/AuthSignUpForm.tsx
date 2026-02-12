import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import _ from 'lodash';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { JBCheckboxField, JBSelectField, JBTextField, SelectOption } from '../../../forms';
import { DEFAULT_GENDER, GENDERS, GENDER_SELECT_OPTIONS } from '../../constants';
import { RegisterPayload } from '../../types';
import { AuthPrimaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';

const signUpSchema = z
  .object({
    firstName: z.string().nonempty('Debes ingresar el nombre'),
    lastName1: z.string().nonempty('Debes ingresar el primer apellido'),
    lastName2: z.string().optional(),
    email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo'),
    birthday: z.string().optional(),
    gender: z.enum(GENDERS).optional(),
    role: z.string().optional(),
    password: z
      .string()
      .nonempty('Debes ingresar la contraseña.')
      .min(8, 'La contraseña es muy corta - mínimo 8 caracteres.'),
    passwordConfirm: z.string().nonempty('La confirmación de contraseña es obligatoria'),
    acceptTermsConditions: z.boolean().refine((val) => val === true, 'Debes aceptar los términos y condiciones.')
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas deben coincidir',
    path: ['passwordConfirm']
  });

export type AuthSignUpFormValues = z.infer<typeof signUpSchema>;

export type AuthSignUpFormProps = {
  defaultValues?: Partial<AuthSignUpFormValues>;
  loading?: boolean;
  submitLabel?: string;
  fieldsScrollable?: boolean;
  formMaxHeight?: string | number;
  roleOptions?: Array<SelectOption<string> & { allowSignup?: boolean }>;
  defaultRole?: string;
  onSubmit: (values: RegisterPayload) => unknown | Promise<unknown>;
};

const defaultValues: AuthSignUpFormValues = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  email: '',
  birthday: '',
  gender: DEFAULT_GENDER,
  role: '',
  password: '',
  passwordConfirm: '',
  acceptTermsConditions: false
};

export function AuthSignUpForm(props: AuthSignUpFormProps) {
  const {
    defaultValues: valuesFromProps,
    loading = false,
    submitLabel = 'Crear cuenta',
    fieldsScrollable = false,
    formMaxHeight = 'min(72dvh, 620px)',
    roleOptions,
    defaultRole,
    onSubmit
  } = props;
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
          required
          fullWidth
        />

        <JBTextField
          control={control}
          name="lastName1"
          sx={{ mb: 3 }}
          label="Primer apellido"
          type="text"
          variant="outlined"
          required
          fullWidth
        />

        <JBTextField
          control={control}
          name="lastName2"
          sx={{ mb: 3 }}
          label="Segundo apellido"
          type="text"
          variant="outlined"
          fullWidth
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
        />

        <JBTextField
          control={control}
          name="birthday"
          sx={{ mb: 3 }}
          label="Fecha de nacimiento"
          type="date"
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          fullWidth
        />

        <JBSelectField
          control={control}
          name="gender"
          sx={{ mb: 3 }}
          label="Género"
          variant="outlined"
          fullWidth
          options={GENDER_SELECT_OPTIONS}
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
          />
        ) : null}

        <JBTextField
          control={control}
          name="password"
          sx={{ mb: 3 }}
          label="Contraseña"
          type="password"
          variant="outlined"
          required
          fullWidth
        />

        <JBTextField
          control={control}
          name="passwordConfirm"
          sx={{ mb: 3 }}
          label="Confirmar contraseña"
          type="password"
          variant="outlined"
          required
          fullWidth
        />

        <JBCheckboxField
          control={control}
          name="acceptTermsConditions"
          size="small"
          label="Acepto términos y políticas de privacidad"
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
        disabled={isLoading || _.isEmpty(dirtyFields) || !isValid}
        loading={isLoading}
        loadingLabel="Creando cuenta..."
        type="submit"
        size="large">
        {submitLabel}
      </AuthPrimaryButton>
    </form>
  );
}
