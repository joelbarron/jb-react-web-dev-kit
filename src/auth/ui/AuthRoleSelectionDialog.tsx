import { zodResolver } from '@hookform/resolvers/zod';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBRadioGroupField, SelectOption } from '../../forms';
import { AuthPrimaryButton } from './AuthPrimaryButton';
import { AuthSecondaryButton } from './AuthSecondaryButton';

type AuthRoleSelectionDialogFormValues = {
  role: string;
};

export type AuthRoleSelectionDialogProps = {
  open: boolean;
  options: SelectOption<string>[];
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

  const { isSubmitting } = formState;

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
      maxWidth='xs'>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{description}</DialogContentText>
        <JBRadioGroupField
          control={control}
          name='role'
          options={options}
          formControlProps={{ fullWidth: true }}
        />
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
