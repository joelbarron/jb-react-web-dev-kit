import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBSelectField, JBTextField, SelectOption } from '../../../forms';
import { COUNTRY_CALLING_CODE_OPTIONS, DEFAULT_OTP_COUNTRY_CODE } from '../../constants';
import { AuthPrimaryButton, AuthSecondaryButton } from '../../ui';
import { parseAuthError } from '../errorParser';

export type AuthOtpSignInFormValues = {
  countryCode: string;
  phone: string;
  code?: string;
};

export type AuthOtpSignInFormProps = {
  defaultValues?: Partial<AuthOtpSignInFormValues>;
  countryCodeOptions?: SelectOption<string>[];
  requestRoleSelection?: () => Promise<string | undefined>;
  countryCodes?: string[];
  loading?: boolean;
  onRequestOtp: (values: { phone: string }) => unknown | Promise<unknown>;
  onVerifyOtp: (values: { phone: string; code: string; role?: string }) => unknown | Promise<unknown>;
  onBackToPassword?: () => void;
};

const otpSchema = z.object({
  countryCode: z.string().nonempty('Selecciona la lada'),
  phone: z.string().nonempty('Debes ingresar tu teléfono'),
  code: z.string().optional()
});

export function AuthOtpSignInForm(props: AuthOtpSignInFormProps) {
  const {
    defaultValues,
    countryCodeOptions,
    requestRoleSelection,
    countryCodes,
    loading = false,
    onRequestOtp,
    onVerifyOtp,
    onBackToPassword
  } = props;
  const resolvedCountryCodeOptions =
    countryCodeOptions ??
    (countryCodes?.length
      ? countryCodes.map((code) => ({ value: code, label: code }))
      : COUNTRY_CALLING_CODE_OPTIONS);
  const defaultCountryCode = resolvedCountryCodeOptions.some((item) => item.value === DEFAULT_OTP_COUNTRY_CODE)
    ? DEFAULT_OTP_COUNTRY_CODE
    : `${resolvedCountryCodeOptions[0]?.value ?? DEFAULT_OTP_COUNTRY_CODE}`;
  const [otpRequested, setOtpRequested] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingOtpRequestValues, setPendingOtpRequestValues] = useState<AuthOtpSignInFormValues | null>(null);
  const [shouldSelectRoleOnVerify, setShouldSelectRoleOnVerify] = useState(false);

  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<AuthOtpSignInFormValues>({
    mode: 'onChange',
    defaultValues: {
      countryCode: defaultValues?.countryCode ?? defaultCountryCode,
      phone: defaultValues?.phone ?? '',
      code: defaultValues?.code ?? ''
    },
    resolver: zodResolver(otpSchema)
  });

  const { errors, isSubmitting } = formState;
  const countryCodeValue = watch('countryCode');
  const phoneValue = watch('phone');
  const codeValue = watch('code');
  const isLoading = loading || isSubmitting;
  const isRequestOtpButtonDisabled = isLoading || !countryCodeValue?.trim() || !phoneValue?.trim();
  const isVerifyButtonDisabled = isLoading || !countryCodeValue?.trim() || !phoneValue?.trim() || !codeValue?.trim();

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name) {
        clearErrors(name as keyof AuthOtpSignInFormValues);
      }
      clearErrors('root');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [watch, clearErrors]);

  function parseBooleanLike(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }
    if (typeof value === 'number') {
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
    }
    return undefined;
  }

  function getUserExistsFromRecord(record: Record<string, unknown>): boolean | undefined {
    const direct =
      parseBooleanLike(record.userExist) ??
      parseBooleanLike(record.userExists) ??
      parseBooleanLike(record.user_exist) ??
      parseBooleanLike(record.user_exists);
    if (typeof direct === 'boolean') {
      return direct;
    }

    const nestedCandidates = [record.data, record.result, record.payload];
    for (const candidate of nestedCandidates) {
      if (candidate && typeof candidate === 'object') {
        const nested = getUserExistsFromRecord(candidate as Record<string, unknown>);
        if (typeof nested === 'boolean') {
          return nested;
        }
      }
    }

    return undefined;
  }

  function getUserExistsFromResponse(response: unknown): boolean | undefined {
    if (!response || typeof response !== 'object') {
      return undefined;
    }
    return getUserExistsFromRecord(response as Record<string, unknown>);
  }

  function applySubmitError(error: unknown) {
    const parsed = parseAuthError(error);
    const allowedFields: Array<keyof AuthOtpSignInFormValues> = ['countryCode', 'phone', 'code'];

    Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
      if (allowedFields.includes(field as keyof AuthOtpSignInFormValues)) {
        setError(field as keyof AuthOtpSignInFormValues, {
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
      message: otpRequested ? 'Código OTP inválido.' : 'No se pudo solicitar el código OTP.'
    });
  }

  async function verifyOtp(values: AuthOtpSignInFormValues, selectedRole?: string) {
    const normalizedPhone = `${values.countryCode}${values.phone}`.replace(/\s+/g, '');

    if (!values.code) {
      setError('code', { type: 'manual', message: 'Debes ingresar el código OTP' });
      return;
    }

    await onVerifyOtp({
      phone: normalizedPhone,
      code: values.code,
      role: selectedRole
    });
  }

  async function requestOtp(values: AuthOtpSignInFormValues) {
    const normalizedPhone = `${values.countryCode}${values.phone}`.replace(/\s+/g, '');
    const response = await onRequestOtp({ phone: normalizedPhone });
    const userExists = getUserExistsFromResponse(response);
    setShouldSelectRoleOnVerify(Boolean(requestRoleSelection) && userExists === false);
    setOtpRequested(true);
    setInfoMessage('Código SMS enviado.');
  }

  async function onSubmit(values: AuthOtpSignInFormValues) {
    try {
      if (!otpRequested) {
        setPendingOtpRequestValues(values);
        setIsConfirmDialogOpen(true);
        return;
      }

      let selectedRole: string | undefined;
      if (shouldSelectRoleOnVerify && requestRoleSelection) {
        selectedRole = await requestRoleSelection();
        if (!selectedRole) {
          return;
        }
      }

      await verifyOtp(values, selectedRole);
    } catch (error) {
      applySubmitError(error);
    }
  }

  async function onConfirmOtpRequest() {
    if (!pendingOtpRequestValues) {
      setIsConfirmDialogOpen(false);
      return;
    }
    try {
      setError('root', {
        type: 'manual',
        message: ''
      });
      await requestOtp(pendingOtpRequestValues);
      setIsConfirmDialogOpen(false);
      setPendingOtpRequestValues(null);
    } catch (error) {
      setIsConfirmDialogOpen(false);
      const parsed = parseAuthError(error);
      if (parsed.rootMessage) {
        setError('root', {
          type: 'manual',
          message: parsed.rootMessage
        });
        return;
      }

      setError('root', {
        type: 'manual',
        message: 'No se pudo solicitar el código OTP.'
      });
    }
  }

  function onChangePhoneNumber() {
    setOtpRequested(false);
    setInfoMessage(null);
    setPendingOtpRequestValues(null);
    setIsConfirmDialogOpen(false);
    setShouldSelectRoleOnVerify(false);
  }

  return (
    <>
      <form
        name="loginFormOtp"
        noValidate
        style={{ display: 'flex', width: '100%', flexDirection: 'column', justifyContent: 'center', paddingTop: 4 }}
        onSubmit={handleSubmit(onSubmit)}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 3 }}>
          <JBSelectField
            control={control}
            name="countryCode"
            label="Lada"
            variant="outlined"
            sx={{ width: 184 }}
            options={resolvedCountryCodeOptions}
            required
            disabled={otpRequested}
          />

          <JBTextField
            control={control}
            name="phone"
            label="Teléfono"
            autoFocus
            type="tel"
            variant="outlined"
            required
            fullWidth
            disabled={otpRequested}
          />
        </Stack>

        {otpRequested ? (
          <JBTextField
            control={control}
            name="code"
            sx={{ mb: 3 }}
            label="Código OTP"
            type="text"
            variant="outlined"
            required
            fullWidth
          />
        ) : null}

        {infoMessage ? (
          <Alert
            sx={{ mb: 2 }}
            severity="info">
            {infoMessage}
          </Alert>
        ) : null}

        {errors.root?.message ? (
          <Alert
            sx={{ mb: 2 }}
            severity="error">
            {errors.root.message}
          </Alert>
        ) : null}

        {!otpRequested ? (
          <AuthPrimaryButton
            sx={{ mt: 2 }}
            aria-label="Solicitar código OTP"
            disabled={isRequestOtpButtonDisabled}
            loading={isLoading}
            loadingLabel="Solicitando OTP..."
            type="submit"
            size="large">
            Solicitar OTP
          </AuthPrimaryButton>
        ) : null}

        {otpRequested ? (
          <>
            <AuthPrimaryButton
              sx={{ mt: 2 }}
              aria-label="Verificar código OTP"
              disabled={isVerifyButtonDisabled}
              loading={isLoading}
              loadingLabel="Verificando OTP..."
              type="submit"
              size="large">
              Verificar OTP
            </AuthPrimaryButton>

            <AuthSecondaryButton
              sx={{ mt: 2 }}
              type="button"
              onClick={onChangePhoneNumber}>
              Cambiar número
            </AuthSecondaryButton>
          </>
        ) : null}

        <AuthSecondaryButton
          sx={{ mt: 2 }}
          type="button"
          startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
          onClick={onBackToPassword}>
          Regresar a iniciar sesión
        </AuthSecondaryButton>
      </form>

      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
        }}
        fullWidth
        maxWidth="xs">
        <DialogTitle>Confirmar número</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`¿Es correcto este número? ${
              pendingOtpRequestValues
                ? `${pendingOtpRequestValues.countryCode}${pendingOtpRequestValues.phone}`.replace(/\s+/g, '')
                : ''
            }`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <AuthSecondaryButton
            sx={{ mt: 0 }}
            type="button"
            onClick={() => {
              setIsConfirmDialogOpen(false);
              setPendingOtpRequestValues(null);
            }}>
            Cancelar
          </AuthSecondaryButton>
          <AuthPrimaryButton
            sx={{ mt: 0 }}
            type="button"
            onClick={() => {
              void onConfirmOtpRequest();
            }}>
            Confirmar
          </AuthPrimaryButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
