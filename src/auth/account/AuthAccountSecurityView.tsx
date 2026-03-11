import { zodResolver } from '@hookform/resolvers/zod';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { JBTextField } from '../../forms';
import { parseAuthError } from '../forms/errorParser';
import { getDjangoLikePasswordError } from '../forms/password/passwordValidation';
import { AccountFeedbackSnackbars } from './AccountFeedbackSnackbars';
import { AuthAccountSecurityViewProps } from './types';

type SecurityFormValues = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

const securitySchema = z
  .object({
    currentPassword: z.string().nonempty('La contraseña actual es requerida.'),
    newPassword: z.string().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La nueva contraseña es requerida.'
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
    newPasswordConfirm: z.string().nonempty('La confirmación es requerida.')
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'La nueva contraseña y su confirmación no coinciden.',
    path: ['newPasswordConfirm']
  });

const EMPTY_VALUES: SecurityFormValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: ''
};

export function AuthAccountSecurityView(props: AuthAccountSecurityViewProps) {
  const { authClient, allowDeleteAccount = false, onHeaderActionsChange, onUnsavedChangesChange } = props;
  const [deleteConfirmValue, setDeleteConfirmValue] = useState('');
  const [isDeleteSectionExpanded, setIsDeleteSectionExpanded] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, formState, handleSubmit, setError, clearErrors, watch, reset } = useForm<SecurityFormValues>({
    mode: 'onChange',
    defaultValues: EMPTY_VALUES,
    resolver: zodResolver(securitySchema)
  });

  const { isSubmitting, isValid } = formState;
  const currentPasswordValue = watch('currentPassword') ?? '';
  const newPasswordValue = watch('newPassword') ?? '';
  const newPasswordConfirmValue = watch('newPasswordConfirm') ?? '';
  const hasUnsavedChanges = Boolean(
    currentPasswordValue.trim() ||
      newPasswordValue.trim() ||
      newPasswordConfirmValue.trim() ||
      deleteConfirmValue.trim()
  );
  const canSubmitPasswordChange = Boolean(
    !isSubmitting &&
      currentPasswordValue.trim() &&
      newPasswordValue.trim() &&
      newPasswordConfirmValue.trim() &&
      isValid
  );

  useEffect(() => {
    const subscription = watch((_value, { name }) => {
      if (name) {
        clearErrors(name as keyof SecurityFormValues);
      }
      clearErrors('root');
      setSuccessMessage(null);
      setErrorMessage(null);
    });

    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  useEffect(() => {
    if (!onUnsavedChangesChange) {
      return undefined;
    }

    onUnsavedChangesChange(hasUnsavedChanges);
    return () => onUnsavedChangesChange(false);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const onSubmitPasswordChange = useCallback(
    async (values: SecurityFormValues) => {
      setErrorMessage(null);
      setSuccessMessage(null);
      setDeleteErrorMessage(null);

      try {
        await authClient.changePassword({
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
          newPasswordConfirm: values.newPasswordConfirm
        });

        reset(EMPTY_VALUES);
        setSuccessMessage('La contraseña se actualizó correctamente.');
      } catch (error) {
        const parsed = parseAuthError(error, {
          oldPassword: 'currentPassword',
          currentPassword: 'currentPassword',
          newPassword1: 'newPassword',
          newPassword2: 'newPasswordConfirm'
        });

        const allowedFields: Array<keyof SecurityFormValues> = [
          'currentPassword',
          'newPassword',
          'newPasswordConfirm'
        ];
        let hasMappedFieldError = false;
        let hasRootErrorFromPayload = false;

        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          if (allowedFields.includes(field as keyof SecurityFormValues)) {
            setError(field as keyof SecurityFormValues, { type: 'manual', message });
            hasMappedFieldError = true;
            return;
          }

          setError('root', {
            type: 'manual',
            message
          });
          hasRootErrorFromPayload = true;
        });

        if (parsed.rootMessage) {
          setErrorMessage(parsed.rootMessage);
          setError('root', {
            type: 'manual',
            message: parsed.rootMessage
          });
          return;
        }

        if (hasMappedFieldError || hasRootErrorFromPayload) {
          if (hasRootErrorFromPayload) {
            const rootMessage = Object.entries(parsed.fieldErrors)
              .find(([field]) => !allowedFields.includes(field as keyof SecurityFormValues))?.[1];
            if (rootMessage) {
              setErrorMessage(rootMessage);
            }
          }
          return;
        }

        const fallbackError = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.';
        setErrorMessage(fallbackError);
        setError('root', {
          type: 'manual',
          message: fallbackError
        });
      }
    },
    [authClient, reset, setError]
  );

  const submitPasswordChange = useCallback(() => {
    void handleSubmit(onSubmitPasswordChange)();
  }, [handleSubmit, onSubmitPasswordChange]);

  const handleDeleteAccount = async () => {
    setDeleteErrorMessage(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (deleteConfirmValue.trim().toUpperCase() !== 'ELIMINAR') {
      setDeleteErrorMessage('Para eliminar tu cuenta escribe ELIMINAR en mayúsculas.');
      return;
    }

    if (!window.confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      await authClient.deleteAccount({ confirmation: true });
      authClient.logout();
      setSuccessMessage('Tu cuenta fue eliminada correctamente.');
    } catch (error) {
      const deleteError = error instanceof Error ? error.message : 'No se pudo eliminar la cuenta.';
      setDeleteErrorMessage(deleteError);
      setErrorMessage(deleteError);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const shouldRenderInternalActions = !onHeaderActionsChange;

  useEffect(() => {
    if (!onHeaderActionsChange) {
      return undefined;
    }

    onHeaderActionsChange({
      primary: {
        label: isSubmitting ? 'Actualizando...' : 'Actualizar contraseña',
        action: 'primary',
        disabled: !canSubmitPasswordChange,
        onClick: submitPasswordChange
      }
    });

    return () => onHeaderActionsChange(null);
  }, [canSubmitPasswordChange, isSubmitting, onHeaderActionsChange, submitPasswordChange]);

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Cambiar contraseña</Typography>
      <Stack spacing={2}>
        <JBTextField<SecurityFormValues, 'currentPassword'>
          control={control}
          name="currentPassword"
          label="Contraseña actual"
          type={showCurrentPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showCurrentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}>
                  {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <JBTextField<SecurityFormValues, 'newPassword'>
          control={control}
          name="newPassword"
          label="Nueva contraseña"
          type={showNewPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                  onClick={() => setShowNewPassword((prev) => !prev)}>
                  {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <JBTextField<SecurityFormValues, 'newPasswordConfirm'>
          control={control}
          name="newPasswordConfirm"
          label="Confirmar nueva contraseña"
          type={showNewPasswordConfirm ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showNewPasswordConfirm ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  onClick={() => setShowNewPasswordConfirm((prev) => !prev)}>
                  {showNewPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {shouldRenderInternalActions ? (
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={submitPasswordChange} disabled={!canSubmitPasswordChange}>
              {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </Stack>
        ) : null}
      </Stack>

      {allowDeleteAccount ? (
        <Stack spacing={3} sx={{ pt: 3 }}>
          <Divider />
          <Accordion
            disableGutters
            expanded={isDeleteSectionExpanded}
            onChange={(_event, expanded) => setIsDeleteSectionExpanded(expanded)}
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              '&:before': {
                display: 'none'
              }
            }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="delete-account-content"
              id="delete-account-header">
              <Typography variant="h6" color="error">
                Eliminar cuenta
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Escribe <strong>ELIMINAR</strong> para confirmar.
                </Typography>
                <Box>
                  <TextField
                    fullWidth
                    label="Confirmación"
                    value={deleteConfirmValue}
                    onChange={(event) => setDeleteConfirmValue(event.target.value)}
                    error={Boolean(deleteErrorMessage)}
                    helperText={deleteErrorMessage || 'Escribe ELIMINAR para confirmar la acción.'}
                  />
                </Box>
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => void handleDeleteAccount()}
                    disabled={isDeletingAccount}>
                    {isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
                  </Button>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      ) : null}
      <AccountFeedbackSnackbars
        successMessage={successMessage}
        errorMessage={errorMessage}
        onCloseSuccess={() => setSuccessMessage(null)}
        onCloseError={() => {
          setErrorMessage(null);
          clearErrors('root');
        }}
      />
    </Stack>
  );
}
