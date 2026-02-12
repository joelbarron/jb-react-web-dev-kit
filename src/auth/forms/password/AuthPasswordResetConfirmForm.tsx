import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import _ from 'lodash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBTextField } from '../../../forms';
import { parseAuthError } from '../errorParser';

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
  onSubmit: (values: AuthPasswordResetConfirmFormValues) => unknown | Promise<unknown>;
};

const resetSchema = z
  .object({
    uid: z.string().nonempty('El uid es obligatorio'),
    token: z.string().nonempty('El token es obligatorio'),
    newPassword: z
      .string()
      .nonempty('Debes ingresar tu nueva contraseña')
      .min(8, 'La contraseña es muy corta - mínimo 8 caracteres.'),
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
    onSubmit
  } = props;
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
      <JBTextField
        control={control}
        name="uid"
        sx={{ mb: 3 }}
        label="UID"
        type="text"
        variant="outlined"
        required
        fullWidth
      />
      <JBTextField
        control={control}
        name="token"
        sx={{ mb: 3 }}
        label="Token"
        type="text"
        variant="outlined"
        required
        fullWidth
      />
      <JBTextField
        control={control}
        name="newPassword"
        sx={{ mb: 3 }}
        label="Nueva contraseña"
        type="password"
        variant="outlined"
        required
        fullWidth
      />
      <JBTextField
        control={control}
        name="newPasswordConfirm"
        sx={{ mb: 3 }}
        label="Confirmar nueva contraseña"
        type="password"
        variant="outlined"
        required
        fullWidth
      />

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

      <Button
        variant="contained"
        color="secondary"
        sx={{ width: '100%' }}
        aria-label={submitLabel}
        disabled={loading || isSubmitting || _.isEmpty(dirtyFields) || !isValid}
        type="submit"
        size="large">
        {submitLabel}
      </Button>
    </form>
  );
}
