import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { AuthPrimaryButton, AuthSecondaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';

export type AuthAccountConfirmationFormValues = {
  uid: string;
  token: string;
};

export type AuthAccountConfirmationFormProps = {
  defaultValues?: Partial<AuthAccountConfirmationFormValues>;
  defaultEmail?: string;
  onGoToSignIn?: () => void;
  resendCooldownSeconds?: number;
  signInRedirectSeconds?: number;
  autoSubmit?: boolean;
  onSubmit: (values: AuthAccountConfirmationFormValues) => unknown | Promise<unknown>;
  onResend?: (values: { email: string }) => unknown | Promise<unknown>;
};

export function AuthAccountConfirmationForm(props: AuthAccountConfirmationFormProps) {
  const {
    defaultValues,
    defaultEmail,
    onGoToSignIn,
    resendCooldownSeconds = 30,
    signInRedirectSeconds = 5,
    autoSubmit = true,
    onSubmit,
    onResend
  } = props;
  const uid = defaultValues?.uid ?? '';
  const token = defaultValues?.token ?? '';
  const email = defaultEmail?.trim() ?? '';
  const hasValues = Boolean(uid && token);
  const canResendFromSignup = !hasValues && Boolean(email) && Boolean(onResend);
  const hasAutoSubmittedRef = useRef(false);
  const hasInitializedCooldownRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpiredVerificationError, setIsExpiredVerificationError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [signInRedirectCountdown, setSignInRedirectCountdown] = useState<number | null>(null);
  const shouldAutoRedirectToSignIn = Boolean(isSuccess && hasValues);
  const canResendFromExpiredLink = hasValues && isExpiredVerificationError && Boolean(email) && Boolean(onResend);

  const isExpiredMessage = (message: string) => {
    const normalized = message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return normalized.includes('expir') || normalized.includes('invalid') || normalized.includes('invalido');
  };

  const submit = async () => {
    if (!hasValues) {
      setErrorMessage('El enlace no es válido o está incompleto.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setIsExpiredVerificationError(false);
      await onSubmit({ uid, token });
      setIsSuccess(true);
      setSignInRedirectCountdown(signInRedirectSeconds);
    } catch (error) {
      setIsSuccess(false);
      const parsed = parseAuthError(error);
      const resolvedMessage = parsed.rootMessage || 'No se pudo verificar la cuenta. El enlace puede haber expirado.';
      setErrorMessage(resolvedMessage);
      setIsExpiredVerificationError(isExpiredMessage(resolvedMessage));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!onResend || !email || resendCooldown > 0) {
      return;
    }

    try {
      setResendMessage(null);
      setErrorMessage(null);
      setResending(true);
      await onResend({ email });
      setResendMessage('Correo de verificación reenviado.');
      setResendCooldown(resendCooldownSeconds);
    } catch {
      setErrorMessage('No se pudo reenviar el correo de verificación.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!canResendFromSignup || hasInitializedCooldownRef.current) {
      return;
    }

    hasInitializedCooldownRef.current = true;
    setResendCooldown(resendCooldownSeconds);
  }, [canResendFromSignup, resendCooldownSeconds]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResendCooldown((currentValue) => Math.max(0, currentValue - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendCooldown]);

  useEffect(() => {
    if (!shouldAutoRedirectToSignIn || !onGoToSignIn || !signInRedirectCountdown || signInRedirectCountdown <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSignInRedirectCountdown((currentValue) => {
        if (!currentValue) {
          return 0;
        }
        return currentValue - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [shouldAutoRedirectToSignIn, onGoToSignIn, signInRedirectCountdown]);

  useEffect(() => {
    if (!shouldAutoRedirectToSignIn || !onGoToSignIn || signInRedirectCountdown !== 0) {
      return;
    }

    onGoToSignIn();
  }, [shouldAutoRedirectToSignIn, onGoToSignIn, signInRedirectCountdown]);

  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  useEffect(() => {
    if (!autoSubmit || !hasValues || hasAutoSubmittedRef.current) {
      return;
    }

    hasAutoSubmittedRef.current = true;
    void submit();
  }, [autoSubmit, hasValues, uid, token]);

  useEffect(() => {
    hasAutoSubmittedRef.current = false;
    setLoading(false);
    setResending(false);
    setErrorMessage(null);
    setResendMessage(null);
    setIsExpiredVerificationError(false);

    if (canResendFromSignup) {
      hasInitializedCooldownRef.current = true;
      setResendCooldown(resendCooldownSeconds);
    } else {
      hasInitializedCooldownRef.current = false;
      setResendCooldown(0);
    }

    if (!hasValues) {
      setIsSuccess(false);
      setSignInRedirectCountdown(null);
    }
  }, [uid, token, email, hasValues, canResendFromSignup, resendCooldownSeconds]);

  return (
    <Stack spacing={2}>
      {!hasValues && email ? (
        <Alert severity="info">
          Tu cuenta fue creada. Revisa tu correo para verificar tu cuenta.
        </Alert>
      ) : null}

      {!hasValues && !email ? (
        <Alert severity="warning">
          Falta información del enlace de verificación.
        </Alert>
      ) : null}

      {loading ? (
        <Alert severity="info">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center">
            <CircularProgress
              size={16}
              color="inherit"
            />
            <Typography variant="body2">Verificando tu cuenta...</Typography>
          </Stack>
        </Alert>
      ) : null}

      {isSuccess ? <Alert severity="success">Tu cuenta fue verificada correctamente.</Alert> : null}

      {resendMessage ? <Alert severity="success">{resendMessage}</Alert> : null}

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      {!isSuccess && hasValues && !canResendFromExpiredLink ? (
        <Button
          variant="contained"
          onClick={() => {
            void submit();
          }}
          disabled={loading}>
          Reintentar verificación
        </Button>
      ) : null}

      {canResendFromSignup ? (
        <Stack sx={{ mt: 1.5 }}>
          <AuthPrimaryButton
            type="button"
            onClick={onGoToSignIn}>
            Ir a iniciar sesión
          </AuthPrimaryButton>

          <AuthSecondaryButton
            sx={{ mt: 1.5 }}
            type="button"
            onClick={() => {
              void resend();
            }}
            disabled={resending || resendCooldown > 0}>
            {resending
              ? 'Reenviando...'
              : resendCooldown > 0
                ? `Reenviar verificación (${formatCooldown(resendCooldown)})`
                : 'Reenviar verificación'}
          </AuthSecondaryButton>
        </Stack>
      ) : null}

      {canResendFromExpiredLink ? (
        <Stack sx={{ mt: 1.5 }}>
          <AuthSecondaryButton
            type="button"
            onClick={() => {
              void resend();
            }}
            disabled={resending || resendCooldown > 0}>
            {resending
              ? 'Reenviando...'
              : resendCooldown > 0
                ? `Reenviar verificación (${formatCooldown(resendCooldown)})`
                : 'Reenviar verificación'}
          </AuthSecondaryButton>
        </Stack>
      ) : null}

      {isSuccess && !canResendFromSignup && !canResendFromExpiredLink ? (
        <Stack sx={{ mt: 1.5 }}>
          <AuthPrimaryButton
            type="button"
            onClick={onGoToSignIn}>
            {`Ir a iniciar sesión${
              typeof signInRedirectCountdown === 'number' && signInRedirectCountdown > 0
                ? ` (${signInRedirectCountdown}s)`
                : ''
            }`}
          </AuthPrimaryButton>
        </Stack>
      ) : null}
    </Stack>
  );
}
