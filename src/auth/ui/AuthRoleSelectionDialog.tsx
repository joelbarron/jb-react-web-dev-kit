import { zodResolver } from '@hookform/resolvers/zod';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthPrimaryButton } from './AuthPrimaryButton';
import { AuthSecondaryButton } from './AuthSecondaryButton';
import { RoleCardOption, RoleOptionCards } from './RoleOptionCards';

type AuthRoleSelectionDialogFormValues = {
  role: string;
};

export type AuthRoleSelectionDialogProps = {
  open: boolean;
  options: RoleCardOption[];
  initialRole?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: (role: string) => void;
};

const roleSelectionSchema = z.object({
  role: z.string().nonempty('Selecciona un rol para continuar.')
});

export function AuthRoleSelectionDialog(props: AuthRoleSelectionDialogProps) {
  const {
    open,
    options,
    initialRole,
    title = 'Selecciona tu rol',
    description = 'Elige el tipo de perfil con el que deseas continuar.',
    confirmLabel = 'Continuar',
    cancelLabel = 'Cancelar',
    onCancel,
    onConfirm
  } = props;

  const fallbackRole = initialRole ?? options[0]?.value ?? '';

  const { control, handleSubmit, reset, formState } = useForm<AuthRoleSelectionDialogFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(roleSelectionSchema),
    defaultValues: {
      role: fallbackRole
    }
  });

  const { isSubmitting, errors } = formState;

  useEffect(() => {
    if (!open) {
      return;
    }
    reset({
      role: initialRole ?? options[0]?.value ?? ''
    });
  }, [open, initialRole, options, reset]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth='sm'>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {description ? (
          <DialogContentText sx={{ mb: 2.5 }}>{description}</DialogContentText>
        ) : null}
        <Controller
          control={control}
          name='role'
          render={({ field }) => (
            <RoleOptionCards
              options={options}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.role ? (
          <FormHelperText error sx={{ mt: 1, mx: 0 }}>
            {errors.role.message}
          </FormHelperText>
        ) : null}
      </DialogContent>
      <DialogActions>
        <AuthSecondaryButton
          sx={{ mt: 0 }}
          type='button'
          onClick={onCancel}
          disabled={isSubmitting}>
          {cancelLabel}
        </AuthSecondaryButton>
        <AuthPrimaryButton
          sx={{ mt: 0 }}
          type='button'
          onClick={() => {
            void handleSubmit((values) => onConfirm(values.role))();
          }}
          loading={isSubmitting}
          loadingLabel='Guardando...'>
          {confirmLabel}
        </AuthPrimaryButton>
      </DialogActions>
    </Dialog>
  );
}
