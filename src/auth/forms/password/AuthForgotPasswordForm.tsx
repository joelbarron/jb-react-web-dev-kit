import { zodResolver } from '@hookform/resolvers/zod';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import Alert from '@mui/material/Alert';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBTextField } from '../../../forms';
import { AuthPrimaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';

export type AuthForgotPasswordFormValues = {
  email: string;
};

export type AuthForgotPasswordFormProps = {
  defaultValues?: Partial<AuthForgotPasswordFormValues>;
  loading?: boolean;
  submitLabel?: string;
  resendLabel?: string;
  successMessage?: string;
  notSentMessage?: string;
  resendCooldownSeconds?: number;
  onEmailSentSuccess?: () => void;
  onSubmit: (values: AuthForgotPasswordFormValues) => unknown | Promise<unknown>;
};

function getEmailSentFlag(response: unknown): boolean | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const data = response as Record<string, unknown>;
  const emailSent = data.emailSent ?? data.email_sent;
  return typeof emailSent === 'boolean' ? emailSent : undefined;
}

const forgotSchema = z.object({
  email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo')
});

export function AuthForgotPasswordForm(props: AuthForgotPasswordFormProps) {
  const {
    defaultValues,
    loading = false,
    submitLabel = 'Enviar enlace de recuperación',
    resendLabel = 'Reenviar enlace de recuperación',
    successMessage = 'Si la cuenta existe, enviamos un enlace de recuperación a tu correo.',
    notSentMessage = 'Solicitud recibida, pero no se pudo enviar el correo de recuperación.',
    resendCooldownSeconds = 30,
    onEmailSentSuccess,
    onSubmit
  } = props;
  const [success, setSuccess] = useState<string | null>(null);
  const [successSeverity, setSuccessSeverity] = useState<'success' | 'warning'>('success');
  const [isEmailSentSuccessfully, setIsEmailSentSuccessfully] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState<number>(0);
  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<AuthForgotPasswordFormValues>({
    mode: 'onChange',
    defaultValues: {
      email: defaultValues?.email ?? ''
    },
    resolver: zodResolver(forgotSchema)
  });
  const { errors, dirtyFields, isSubmitting, isValid } = formState;
  const emailValue = watch('email');
  const isResendCooldownActive = isEmailSentSuccessfully && resendSecondsLeft > 0;

  useEffect(() => {
    if (!isResendCooldownActive) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isResendCooldownActive]);

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name) {
        clearErrors(name as keyof AuthForgotPasswordFormValues);
      }
      clearErrors('root');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, clearErrors]);

  async function onSubmitForm(values: AuthForgotPasswordFormValues) {
    try {
      setSuccess(null);
      const response = await onSubmit(values);
      const emailSent = getEmailSentFlag(response);
      setSuccessSeverity(emailSent === false ? 'warning' : 'success');
      setSuccess(emailSent === false ? notSentMessage : successMessage);
      setIsEmailSentSuccessfully(emailSent === true);
      if (emailSent === true) {
        setResendSecondsLeft(resendCooldownSeconds);
        onEmailSentSuccess?.();
      }
    } catch (error) {
      const parsed = parseAuthError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        if (field === 'email') {
          setError('email', {
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
        message: 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.'
      });
    }
  }

  return (
    <form
      name="forgotPasswordForm"
      noValidate
      style={{ display: 'flex', width: '100%', flexDirection: 'column', justifyContent: 'center', paddingTop: 4 }}
      onSubmit={handleSubmit(onSubmitForm)}>
      {!isEmailSentSuccessfully ? (
        <JBTextField
          control={control}
          name="email"
          sx={{ mb: 3 }}
          label="Correo electrónico"
          autoFocus
          type="email"
          variant="outlined"
          required
          fullWidth
        />
      ) : null}

      {errors.root?.message && (
        <Alert
          sx={{ mb: 2 }}
          severity="error">
          {errors.root.message}
        </Alert>
      )}

      {success && (
        <Alert
          sx={{ mb: 2 }}
          severity={successSeverity}>
          {success}
        </Alert>
      )}

      {!isEmailSentSuccessfully ? (
        <AuthPrimaryButton
          aria-label={submitLabel}
          type="submit"
          startIcon={<LinkOutlinedIcon fontSize="small" />}
          disabled={loading || isSubmitting || _.isEmpty(dirtyFields) || !isValid}>
          {submitLabel}
        </AuthPrimaryButton>
      ) : (
        <AuthPrimaryButton
          aria-label={resendLabel}
          type="submit"
          startIcon={<LinkOutlinedIcon fontSize="small" />}
          disabled={loading || isSubmitting || isResendCooldownActive || !isValid || !emailValue?.trim()}>
          {isResendCooldownActive ? `${resendLabel} (${resendSecondsLeft}s)` : resendLabel}
        </AuthPrimaryButton>
      )}
    </form>
  );
}
