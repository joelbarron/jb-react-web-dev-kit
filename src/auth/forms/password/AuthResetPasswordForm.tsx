import { Button, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';

import { JBTextField } from '../../../forms';

export type AuthResetPasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export type AuthResetPasswordFormProps = {
  defaultValues?: Partial<AuthResetPasswordFormValues>;
  loading?: boolean;
  submitLabel?: string;
  onSubmit: (values: AuthResetPasswordFormValues) => void | Promise<void>;
};

export function AuthResetPasswordForm(props: AuthResetPasswordFormProps) {
  const { defaultValues, loading = false, submitLabel = 'Restablecer contraseña', onSubmit } = props;
  const { control, handleSubmit, watch } = useForm<AuthResetPasswordFormValues>({
    defaultValues: {
      newPassword: defaultValues?.newPassword ?? '',
      confirmPassword: defaultValues?.confirmPassword ?? ''
    }
  });

  const newPasswordValue = watch('newPassword');

  return (
    <form
      style={{ paddingTop: 4 }}
      onSubmit={handleSubmit((values) => onSubmit(values))}>
      <Stack spacing={2}>
        <JBTextField
          control={control}
          name="newPassword"
          label="Nueva contraseña"
          type="password"
          fullWidth
          rules={{ required: 'El password es requerido' }}
        />
        <JBTextField
          control={control}
          name="confirmPassword"
          label="Confirmar contraseña"
          type="password"
          fullWidth
          rules={{
            required: 'La confirmacion es requerida',
            validate: (value) => value === newPasswordValue || 'Las contraseñas no coinciden'
          }}
        />
        <Button
          variant="contained"
          type="submit"
          disabled={loading}>
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
