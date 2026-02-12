import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBCheckboxField, JBTextField } from '../../../forms';
import { AuthPrimaryButton, AuthSecondaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';
import type { AuthLinkComponent } from '../../ui';

export type AuthPasswordSignInFormValues = {
  login: string;
  password: string;
  remember?: boolean;
};

export type AuthPasswordSignInFormProps = {
  defaultValues?: Partial<AuthPasswordSignInFormValues>;
  loading?: boolean;
  submitLabel?: string;
  forgotPasswordPath?: string;
  rememberLabel?: string;
  loginLabel?: string;
  passwordLabel?: string;
  accountConfirmationPath?: string;
  verifyAccountLabel?: string;
  LinkComponent?: AuthLinkComponent;
  onSubmit: (values: AuthPasswordSignInFormValues) => unknown | Promise<unknown>;
};

const signInSchema = z.object({
  login: z.string().nonempty('Debes ingresar tu usuario o correo'),
  password: z
    .string()
    .min(4, 'La contraseña es muy corta - mínimo 4 caracteres.')
    .nonempty('Debes ingresar tu contraseña.'),
  remember: z.boolean().optional()
});

export function AuthPasswordSignInForm(props: AuthPasswordSignInFormProps) {
  const {
    defaultValues,
    loading = false,
    submitLabel = 'Iniciar sesión',
    forgotPasswordPath = '/forgot-password',
    rememberLabel = 'Recuérdame',
    loginLabel = 'Usuario o correo',
    passwordLabel = 'Contraseña',
    accountConfirmationPath = '/verify-email',
    verifyAccountLabel = 'Ir a verificar cuenta',
    LinkComponent,
    onSubmit
  } = props;
  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<AuthPasswordSignInFormValues>({
    mode: 'onChange',
    defaultValues: {
      login: defaultValues?.login ?? '',
      password: defaultValues?.password ?? '',
      remember: defaultValues?.remember ?? true
    },
    resolver: zodResolver(signInSchema)
  });
  const { errors, isSubmitting } = formState;
  const loginValue = watch('login');
  const passwordValue = watch('password');
  const isLoading = loading || isSubmitting;

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name) {
        clearErrors(name as keyof AuthPasswordSignInFormValues);
      }
      clearErrors('root');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, clearErrors]);

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const shouldShowVerifyAccountCta = (message?: string) => {
    if (!message) {
      return false;
    }
    const normalizedMessage = normalizeText(message);
    return normalizedMessage.includes('no esta verificada') || normalizedMessage.includes('not verified');
  };

  const getAccountConfirmationTo = () => {
    const login = loginValue?.trim() ?? '';
    const isEmail = login.includes('@');
    if (!isEmail) {
      return accountConfirmationPath;
    }
    return `${accountConfirmationPath}?email=${encodeURIComponent(login)}`;
  };

  async function onSubmitForm(values: AuthPasswordSignInFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      const parsed = parseAuthError(error, {
        username: 'login'
      });

      const allowedFields: Array<keyof AuthPasswordSignInFormValues> = ['login', 'password', 'remember'];
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        if (allowedFields.includes(field as keyof AuthPasswordSignInFormValues)) {
          setError(field as keyof AuthPasswordSignInFormValues, {
            type: 'manual',
            message
          });
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
        message: 'No se pudo iniciar sesión. Inténtalo de nuevo.'
      });
    }
  }

  return (
    <form
      name="loginForm"
      noValidate
      style={{ display: 'flex', width: '100%', flexDirection: 'column', justifyContent: 'center', paddingTop: 4 }}
      onSubmit={handleSubmit(onSubmitForm)}>
      <JBTextField
        control={control}
        name="login"
        sx={{ mb: 3 }}
        label={loginLabel}
        autoFocus
        type="text"
        variant="outlined"
        required
        fullWidth
      />
      <JBTextField
        control={control}
        name="password"
        sx={{ mb: 3 }}
        label={passwordLabel}
        type="password"
        variant="outlined"
        required
        fullWidth
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: { xs: 'center', sm: 'space-between' },
          gap: { xs: 1.5, sm: 0 }
        }}>
        <JBCheckboxField
          control={control}
          name="remember"
          label={rememberLabel}
          formControlProps={{
            sx: {
              m: 0
            }
          }}
          formControlLabelProps={{
            sx: {
              '& .MuiFormControlLabel-label': {
                fontWeight: 500
              }
            }
          }}
          checkboxSx={{
            '&.Mui-checked .MuiSvgIcon-root': {
              color: 'secondary.main'
            }
          }}
        />

        {LinkComponent ? <LinkComponent to={forgotPasswordPath}>¿Olvidaste tu contraseña?</LinkComponent> : null}
      </Box>

      <AuthPrimaryButton
        sx={{ mt: 2 }}
        aria-label={submitLabel}
        disabled={isLoading || !loginValue?.trim() || !passwordValue}
        loading={isLoading}
        loadingLabel="Iniciando sesión..."
        type="submit"
        size="large">
        {submitLabel}
      </AuthPrimaryButton>

      {LinkComponent && shouldShowVerifyAccountCta(errors.root?.message) ? (
        <AuthSecondaryButton
          sx={{ mt: 1.5 }}
          component={LinkComponent}
          to={getAccountConfirmationTo()}>
          {verifyAccountLabel}
        </AuthSecondaryButton>
      ) : null}

      {errors.root?.message && (
        <Alert
          sx={{ mt: 2 }}
          severity="error">
          {errors.root.message}
        </Alert>
      )}
    </form>
  );
}
