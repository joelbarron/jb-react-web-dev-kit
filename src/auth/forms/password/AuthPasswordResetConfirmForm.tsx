import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBTextField } from '../../../forms';
import { AuthPrimaryButton, AuthSecondaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';
import { getDjangoLikePasswordError } from './passwordValidation';

export type AuthPasswordResetConfirmFormValues = {
  uid: string;
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type AuthPasswordResetConfirmFormProps = {
  defaultValues?: Partial<AuthPasswordResetConfirmFormValues>;
  loading?: boolean;
  submitLabel?: string;
  successMessage?: string;
  successRedirectSeconds?: number;
  onGoToSignIn?: () => void;
  onSubmit: (values: AuthPasswordResetConfirmFormValues) => unknown | Promise<unknown>;
};

const resetSchema = z
  .object({
    uid: z.string().nonempty('El uid es obligatorio'),
    token: z.string().nonempty('El token es obligatorio'),
    newPassword: z.string().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debes ingresar tu nueva contraseña'
        });
        return;
      }

      const passwordError = getDjangoLikePasswordError(value);
      if (passwordError) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: passwordError
        });
      }
    }),
    newPasswordConfirm: z.string().nonempty('La confirmación de contraseña es obligatoria')
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Las contraseñas deben coincidir',
    path: ['newPasswordConfirm']
  });

export function AuthPasswordResetConfirmForm(props: AuthPasswordResetConfirmFormProps) {
  const {
    defaultValues,
    loading = false,
    submitLabel = 'Restablecer contraseña',
    successMessage = 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
    successRedirectSeconds = 5,
    onGoToSignIn,
    onSubmit
  } = props;
  const [redirectSecondsLeft, setRedirectSecondsLeft] = useState<number | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<AuthPasswordResetConfirmFormValues>({
    mode: 'onChange',
    defaultValues: {
      uid: defaultValues?.uid ?? '',
      token: defaultValues?.token ?? '',
      newPassword: defaultValues?.newPassword ?? '',
      newPasswordConfirm: defaultValues?.newPasswordConfirm ?? ''
    },
    resolver: zodResolver(resetSchema)
  });

  const { errors, dirtyFields, isSubmitting, isValid, isSubmitSuccessful } = formState;
  const uidValue = watch('uid');
  const tokenValue = watch('token');
  const hasValidRecoveryLink = Boolean(uidValue?.trim() && tokenValue?.trim());

  const goToSignInLabel = useMemo(() => {
    if (!isSubmitSuccessful) {
      return 'Ir a iniciar sesión';
    }
    if (!redirectSecondsLeft || redirectSecondsLeft <= 0) {
      return 'Ir a iniciar sesión';
    }
    return `Ir a iniciar sesión (${redirectSecondsLeft}s)`;
  }, [isSubmitSuccessful, redirectSecondsLeft]);

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name) {
        clearErrors(name as keyof AuthPasswordResetConfirmFormValues);
      }
      clearErrors('root');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, clearErrors]);

  useEffect(() => {
    if (!isSubmitSuccessful || !onGoToSignIn) {
      setRedirectSecondsLeft(null);
      return;
    }

    setRedirectSecondsLeft(successRedirectSeconds);
    const timer = window.setInterval(() => {
      setRedirectSecondsLeft((current) => {
        if (!current || current <= 1) {
          window.clearInterval(timer);
          onGoToSignIn();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSubmitSuccessful, onGoToSignIn, successRedirectSeconds]);

  async function onSubmitForm(values: AuthPasswordResetConfirmFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      const parsed = parseAuthError(error);
      const allowedFields: Array<keyof AuthPasswordResetConfirmFormValues> = [
        'uid',
        'token',
        'newPassword',
        'newPasswordConfirm'
      ];

      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        if (field === 'uid' || field === 'token') {
          setError('root', {
            type: 'manual',
            message
          });
          return;
        }

        if (allowedFields.includes(field as keyof AuthPasswordResetConfirmFormValues)) {
          setError(field as keyof AuthPasswordResetConfirmFormValues, {
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

      if (Object.keys(parsed.fieldErrors).length > 0) {
        const firstFieldError = Object.values(parsed.fieldErrors)[0];
        if (firstFieldError) {
          setError('root', {
            type: 'manual',
            message: firstFieldError
          });
          return;
        }
      }

      setError('root', {
        type: 'manual',
        message: 'No se pudo restablecer la contraseña. Inténtalo de nuevo.'
      });
    }
  }

  return (
    <form
      name="resetPasswordForm"
      noValidate
      style={{ display: 'flex', width: '100%', flexDirection: 'column', justifyContent: 'center', paddingTop: 4 }}
      onSubmit={handleSubmit(onSubmitForm)}>
      {!isSubmitSuccessful && !hasValidRecoveryLink ? (
        <Alert
          sx={{ mb: 3 }}
          severity="warning">
          El enlace de recuperación es inválido o incompleto.
        </Alert>
      ) : null}

      {!isSubmitSuccessful ? (
        <>
          <JBTextField
            control={control}
            name="newPassword"
            sx={{ mb: 3 }}
            label="Nueva contraseña"
            type={showNewPassword ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowNewPassword((prev) => !prev)}>
                    {showNewPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            variant="outlined"
            required
            fullWidth
          />
          <JBTextField
            control={control}
            name="newPasswordConfirm"
            sx={{ mb: 3 }}
            label="Confirmar nueva contraseña"
            type={showNewPasswordConfirm ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    aria-label={showNewPasswordConfirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                    onClick={() => setShowNewPasswordConfirm((prev) => !prev)}>
                    {showNewPasswordConfirm ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            variant="outlined"
            required
            fullWidth
          />
        </>
      ) : null}

      {errors.root?.message && (
        <Alert
          sx={{ mb: 2 }}
          severity="error">
          {errors.root.message}
        </Alert>
      )}

      {isSubmitSuccessful && (
        <Alert
          sx={{ mb: 2 }}
          severity="success">
          {successMessage}
        </Alert>
      )}

      {!isSubmitSuccessful ? (
        <AuthPrimaryButton
          aria-label={submitLabel}
          startIcon={<LockResetOutlinedIcon fontSize="small" />}
          disabled={loading || isSubmitting || _.isEmpty(dirtyFields) || !isValid || !hasValidRecoveryLink}
          type="submit"
          size="large">
          {submitLabel}
        </AuthPrimaryButton>
      ) : null}

      {isSubmitSuccessful && onGoToSignIn ? (
        <AuthSecondaryButton
          sx={{ mt: 2 }}
          startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
          onClick={onGoToSignIn}>
          {goToSignInLabel}
        </AuthSecondaryButton>
      ) : null}
    </form>
  );
}
