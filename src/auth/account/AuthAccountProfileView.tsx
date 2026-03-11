import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { GENDER_SELECT_OPTIONS } from '../constants';
import { AccountFeedbackSnackbars } from './AccountFeedbackSnackbars';
import { AuthAccountProfileViewProps } from './types';
import {
  asRecord,
  findDefaultProfile,
  normalizeProfilesList,
  pickString,
  toBase64DataUrl
} from './utils';

type ProfileFormState = {
  firstName: string;
  lastName1: string;
  lastName2: string;
  birthday: string;
  gender: string;
  label: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

const EMPTY_PROFILE_FORM: ProfileFormState = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  birthday: '',
  gender: '',
  label: ''
};

const normalizeProfileForm = (profile: Record<string, unknown>): ProfileFormState => ({
  firstName: pickString(profile, ['first_name', 'firstName']),
  lastName1: pickString(profile, ['last_name_1', 'lastName1']),
  lastName2: pickString(profile, ['last_name_2', 'lastName2']),
  birthday: pickString(profile, ['birthday']).slice(0, 10),
  gender: pickString(profile, ['gender']).toUpperCase(),
  label: pickString(profile, ['label'])
});

export function AuthAccountProfileView(props: AuthAccountProfileViewProps) {
  const {
    authClient,
    onHeaderActionsChange,
    onUnsavedChangesChange,
    allowDefaultProfileEdit = true,
    allowProfilePictureChange = true,
    requireBirthday = true
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string>('');
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [originalFormState, setOriginalFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [fieldErrors, setFieldErrors] = useState<ProfileFormErrors>({});
  const selectedPicturePreviewUrl = useMemo(() => {
    if (!selectedPicture) {
      return '';
    }
    return URL.createObjectURL(selectedPicture);
  }, [selectedPicture]);

  const hasProfileChanges = useMemo(
    () =>
      formState.firstName !== originalFormState.firstName ||
      formState.lastName1 !== originalFormState.lastName1 ||
      formState.lastName2 !== originalFormState.lastName2 ||
      formState.birthday !== originalFormState.birthday ||
      formState.gender !== originalFormState.gender ||
      formState.label !== originalFormState.label,
    [formState, originalFormState]
  );
  const hasPictureChanges = Boolean(selectedPicture);
  const hasChanges =
    (allowDefaultProfileEdit && hasProfileChanges) ||
    (allowProfilePictureChange && hasPictureChanges);
  const hasUnsavedChanges =
    (allowDefaultProfileEdit && isEditMode && hasProfileChanges) ||
    (allowProfilePictureChange && hasPictureChanges);
  const canModifyProfile = allowDefaultProfileEdit || allowProfilePictureChange;

  const reloadFromServer = useCallback(async () => {
    setIsLoading(true);
    try {
      const mePayload = asRecord(await authClient.getMe());
      const profilesPayload = await authClient.getProfiles();
      const profiles = normalizeProfilesList(profilesPayload);

      let resolvedProfile = findDefaultProfile(profiles);
      if (!resolvedProfile) {
        resolvedProfile = asRecord(mePayload.active_profile ?? mePayload.activeProfile);
      }

      const resolvedProfileId = Number(resolvedProfile?.id || 0) || null;
      let profileDetail = resolvedProfile ?? {};

      if (resolvedProfileId) {
        try {
          profileDetail = asRecord(await authClient.getProfileById(resolvedProfileId));
        } catch {
          // Fallback to profile list payload when detail endpoint fails.
        }
      }

      const normalizedState = normalizeProfileForm(profileDetail);

      setProfileId(resolvedProfileId);
      setFormState(normalizedState);
      setOriginalFormState(normalizedState);
      setPictureUrl(pickString(profileDetail, ['picture', 'photoURL']));
      setSelectedPicture(null);
      setFieldErrors({});
      setIsEditMode(false);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la información del perfil.');
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  useEffect(() => {
    void reloadFromServer();
  }, [reloadFromServer]);

  useEffect(() => {
    return () => {
      if (selectedPicturePreviewUrl) {
        URL.revokeObjectURL(selectedPicturePreviewUrl);
      }
    };
  }, [selectedPicturePreviewUrl]);

  useEffect(() => {
    if (!onUnsavedChangesChange) {
      return undefined;
    }
    onUnsavedChangesChange(Boolean(hasUnsavedChanges));
    return () => onUnsavedChangesChange(false);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const handleFieldChange = (field: keyof ProfileFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    if (!allowDefaultProfileEdit || !isEditMode) {
      return;
    }
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const validateProfileForm = useCallback((): boolean => {
    const nextErrors: ProfileFormErrors = {};

    if (!formState.firstName.trim()) {
      nextErrors.firstName = 'El nombre es requerido.';
    }
    if (!formState.lastName1.trim()) {
      nextErrors.lastName1 = 'El apellido paterno es requerido.';
    }
    if (requireBirthday && !formState.birthday.trim()) {
      nextErrors.birthday = 'La fecha de nacimiento es requerida.';
    }
    if (!formState.gender.trim()) {
      nextErrors.gender = 'El género es requerido.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formState.birthday, formState.firstName, formState.gender, formState.lastName1, requireBirthday]);

  const handleSave = useCallback(async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEditMode && !(allowProfilePictureChange && hasPictureChanges)) {
      return;
    }

    if (!hasChanges) {
      setSuccessMessage('No hay cambios por guardar.');
      return;
    }

    if (!profileId) {
      setErrorMessage('No se encontró un perfil predeterminado para actualizar.');
      return;
    }

    if (allowDefaultProfileEdit && hasProfileChanges) {
      const isValidForm = validateProfileForm();
      if (!isValidForm) {
        setErrorMessage(null);
        return;
      }
    }

    try {
      setIsSaving(true);

      if (allowDefaultProfileEdit && hasProfileChanges) {
        await authClient.updateProfile(profileId, {
          first_name: formState.firstName || null,
          last_name_1: formState.lastName1 || null,
          last_name_2: formState.lastName2 || null,
          birthday: formState.birthday || null,
          gender: formState.gender || null,
          label: formState.label || ''
        });
      }

      if (allowProfilePictureChange && selectedPicture) {
        const encodedPicture = await toBase64DataUrl(selectedPicture);
        await authClient.updateProfilePicture({
          profile: profileId,
          picture: encodedPicture
        });
      }

      await reloadFromServer();
      setSuccessMessage('Perfil actualizado correctamente.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  }, [
    allowDefaultProfileEdit,
    allowProfilePictureChange,
    authClient,
    formState,
    hasChanges,
    hasPictureChanges,
    hasProfileChanges,
    isEditMode,
    profileId,
    reloadFromServer,
    selectedPicture,
    validateProfileForm
  ]);

  const handleStartEdit = useCallback(() => {
    if (!canModifyProfile) {
      return;
    }
    setIsEditMode(true);
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [canModifyProfile]);

  const handleCancelEdit = useCallback(() => {
    setFormState(originalFormState);
    setSelectedPicture(null);
    setFieldErrors({});
    setIsEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [originalFormState]);

  const shouldRenderInternalActions = !onHeaderActionsChange;

  useEffect(() => {
    if (!onHeaderActionsChange) {
      return undefined;
    }

    if (!canModifyProfile) {
      onHeaderActionsChange(null);
      return undefined;
    }

    if (!isEditMode) {
      onHeaderActionsChange({
        secondary: allowDefaultProfileEdit
          ? {
              label: 'Realizar modificaciones',
              action: 'secondary',
              disabled: isLoading || isSaving,
              onClick: handleStartEdit
            }
          : undefined,
        primary: allowProfilePictureChange && hasPictureChanges
          ? {
              label: isSaving ? 'Guardando foto...' : 'Guardar foto',
              action: 'primary',
              disabled: isLoading || isSaving,
              onClick: () => {
                void handleSave();
              }
            }
          : undefined
      });
      return () => onHeaderActionsChange(null);
    }

    onHeaderActionsChange({
      secondary: {
        label: 'Cancelar',
        action: 'cancel',
        disabled: isSaving,
        onClick: handleCancelEdit
      },
      primary: {
        label: isSaving ? 'Guardando...' : 'Guardar cambios',
        action: 'primary',
        disabled: isLoading || isSaving || !hasChanges || !isEditMode,
        onClick: () => {
          void handleSave();
        }
      }
    });

    return () => onHeaderActionsChange(null);
  }, [
    canModifyProfile,
    handleCancelEdit,
    handleStartEdit,
    handleSave,
    hasChanges,
    hasPictureChanges,
    isEditMode,
    isLoading,
    isSaving,
    onHeaderActionsChange
  ]);

  if (isLoading) {
    return (
      <Box
        sx={{
          py: 6,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Avatar
          src={selectedPicturePreviewUrl || pictureUrl || undefined}
          sx={{ width: 80, height: 80 }}
        />
        <Stack spacing={1}>
          {allowProfilePictureChange ? (
            <Button variant="outlined" component="label">
              Seleccionar foto
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedPicture(file);
                  setSuccessMessage(null);
                }}
              />
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              La edición de la foto de perfil está deshabilitada.
            </Typography>
          )}
          {selectedPicture ? (
            <Typography variant="caption" color="text.secondary">
              Archivo seleccionado: {selectedPicture.name}
            </Typography>
          ) : null}
        </Stack>
      </Stack>

      <Typography variant="h6">Perfil</Typography>
      {!allowDefaultProfileEdit ? (
        <Typography variant="body2" color="text.secondary">
          La edición de la información del perfil está deshabilitada para esta implementación.
        </Typography>
      ) : !isEditMode ? (
        <Typography variant="body2" color="text.secondary">
          Este perfil se muestra en modo solo lectura.
        </Typography>
      ) : null}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 2
        }}>
        <TextField
          label="Nombre"
          fullWidth
          value={formState.firstName}
          onChange={handleFieldChange('firstName')}
          error={Boolean(fieldErrors.firstName)}
          helperText={fieldErrors.firstName}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Apellido paterno"
          fullWidth
          value={formState.lastName1}
          onChange={handleFieldChange('lastName1')}
          error={Boolean(fieldErrors.lastName1)}
          helperText={fieldErrors.lastName1}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Apellido materno"
          fullWidth
          value={formState.lastName2}
          onChange={handleFieldChange('lastName2')}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Fecha de nacimiento"
          type="date"
          fullWidth
          value={formState.birthday}
          onChange={handleFieldChange('birthday')}
          InputLabelProps={{ shrink: true }}
          error={Boolean(fieldErrors.birthday)}
          helperText={fieldErrors.birthday}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Género"
          fullWidth
          select
          value={formState.gender}
          onChange={handleFieldChange('gender')}
          error={Boolean(fieldErrors.gender)}
          helperText={fieldErrors.gender || undefined}
          disabled={!allowDefaultProfileEdit || !isEditMode}>
          <MenuItem value="">
            <em>Sin especificar</em>
          </MenuItem>
          {GENDER_SELECT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Nombre visible del perfil (opcional)"
          fullWidth
          value={formState.label}
          onChange={handleFieldChange('label')}
          helperText="Se usa como nombre corto para identificar el perfil."
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
      </Box>

      {shouldRenderInternalActions ? (
        <Stack direction="row" justifyContent="flex-end">
          {!canModifyProfile ? null : !isEditMode ? (
            <Stack direction="row" spacing={1}>
              {allowDefaultProfileEdit ? (
                <Button variant="outlined" onClick={handleStartEdit} disabled={isLoading || isSaving}>
                  Realizar modificaciones
                </Button>
              ) : null}
              {allowProfilePictureChange && hasPictureChanges ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={isLoading || isSaving}>
                  {isSaving ? 'Guardando foto...' : 'Guardar foto'}
                </Button>
              ) : null}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCancelEdit} disabled={isSaving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  void handleSave();
                }}
                disabled={isSaving || !hasChanges}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Stack>
          )}
        </Stack>
      ) : null}
      <AccountFeedbackSnackbars
        successMessage={successMessage}
        errorMessage={errorMessage}
        onCloseSuccess={() => setSuccessMessage(null)}
        onCloseError={() => setErrorMessage(null)}
      />
    </Stack>
  );
}
