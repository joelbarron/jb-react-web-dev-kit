import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBTextField } from '../../../forms';
import { parseAuthError } from '../errorParser';

export type AuthForgotPasswordFormValues = {
  email: string;
};

export type AuthForgotPasswordFormProps = {
  defaultValues?: Partial<AuthForgotPasswordFormValues>;
  loading?: boolean;
  submitLabel?: string;
  successMessage?: string;
  onSubmit: (values: AuthForgotPasswordFormValues) => unknown | Promise<unknown>;
};

const forgotSchema = z.object({
  email: z.string().email('Debes ingresar un correo válido').nonempty('Debes ingresar un correo')
});

export function AuthForgotPasswordForm(props: AuthForgotPasswordFormProps) {
  const {
    defaultValues,
    loading = false,
    submitLabel = 'Enviar enlace de recuperación',
    successMessage = 'Si la cuenta existe, enviamos un enlace de recuperación a tu correo.',
    onSubmit
  } = props;
  const [success, setSuccess] = useState<string | null>(null);
  const { control, formState, handleSubmit, setError, clearErrors, watch } = useForm<AuthForgotPasswordFormValues>({
    mode: 'onChange',
    defaultValues: {
      email: defaultValues?.email ?? ''
    },
    resolver: zodResolver(forgotSchema)
  });
  const { errors, dirtyFields, isSubmitting, isValid } = formState;

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
      await onSubmit(values);
      setSuccess(successMessage);
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
          severity="success">
          {success}
        </Alert>
      )}

      <Button
        variant="contained"
        color="secondary"
        sx={{ width: '100%' }}
        aria-label={submitLabel}
        type="submit"
        size="large"
        disabled={loading || isSubmitting || _.isEmpty(dirtyFields) || !isValid}>
        {submitLabel}
      </Button>
    </form>
  );
}
