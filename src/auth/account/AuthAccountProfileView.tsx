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
import { useJBImageCropper } from '../../media';
import { AccountFeedbackSnackbars } from './AccountFeedbackSnackbars';
import { AuthAccountProfileViewProps } from './types';
import {
  asRecord,
  findDefaultProfile,
  normalizeProfilesList,
  pickString
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

const DEFAULT_REQUIRED_PROFILE_FIELDS = {
  firstName: true,
  lastName1: true,
  lastName2: false,
  birthday: true,
  gender: true,
  label: false
};

const DEFAULT_PROFILE_PICTURE_CONFIG = {
  aspect: 1,
  targetWidth: 1024,
  targetHeight: 1024,
  quality: 0.85,
  mimeType: 'image/jpeg' as const,
  outputType: 'data_url' as const,
  maxBytes: 5 * 1024 * 1024,
  acceptedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  minZoom: 1,
  maxZoom: 3
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
    onSaveSuccess,
    allowDefaultProfileEdit = true,
    allowProfilePictureChange = true,
    requiredProfileFields,
    profilePictureConfig,
    forceEditMode = false
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string>('');
  const [selectedPicture, setSelectedPicture] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [originalFormState, setOriginalFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [fieldErrors, setFieldErrors] = useState<ProfileFormErrors>({});
  const resolvedProfilePictureConfig = useMemo(
    () => ({
      ...DEFAULT_PROFILE_PICTURE_CONFIG,
      ...(profilePictureConfig || {}),
      outputType: 'data_url' as const
    }),
    [profilePictureConfig]
  );
  const resolvedRequiredFields = useMemo(() => {
    return {
      ...DEFAULT_REQUIRED_PROFILE_FIELDS,
      ...(requiredProfileFields ?? {})
    };
  }, [requiredProfileFields]);
  const pictureCropper = useJBImageCropper({
    aspect: resolvedProfilePictureConfig.aspect,
    targetWidth: resolvedProfilePictureConfig.targetWidth,
    targetHeight: resolvedProfilePictureConfig.targetHeight,
    quality: resolvedProfilePictureConfig.quality,
    mimeType: resolvedProfilePictureConfig.mimeType,
    outputType: 'data_url',
    minZoom: resolvedProfilePictureConfig.minZoom,
    maxZoom: resolvedProfilePictureConfig.maxZoom,
    title: 'Recortar foto de perfil',
    helperText: 'Ajusta la fotografía para guardarla en formato cuadrado.'
  });

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
      setIsEditMode(Boolean(forceEditMode && allowDefaultProfileEdit));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la información del perfil.');
    } finally {
      setIsLoading(false);
    }
  }, [allowDefaultProfileEdit, authClient, forceEditMode]);

  useEffect(() => {
    void reloadFromServer();
  }, [reloadFromServer]);

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

    if (resolvedRequiredFields.firstName && !formState.firstName.trim()) {
      nextErrors.firstName = 'Los nombres son requeridos.';
    }
    if (resolvedRequiredFields.lastName1 && !formState.lastName1.trim()) {
      nextErrors.lastName1 = 'El primer apellido es requerido.';
    }
    if (resolvedRequiredFields.lastName2 && !formState.lastName2.trim()) {
      nextErrors.lastName2 = 'El segundo apellido es requerido.';
    }
    if (resolvedRequiredFields.birthday && !formState.birthday.trim()) {
      nextErrors.birthday = 'La fecha de nacimiento es requerida.';
    }
    if (resolvedRequiredFields.gender && !formState.gender.trim()) {
      nextErrors.gender = 'El género es requerido.';
    }
    if (resolvedRequiredFields.label && !formState.label.trim()) {
      nextErrors.label = 'La etiqueta del perfil es requerida.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    formState.birthday,
    formState.firstName,
    formState.gender,
    formState.label,
    formState.lastName1,
    formState.lastName2,
    resolvedRequiredFields
  ]);

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

      if (allowProfilePictureChange && selectedPicture?.dataUrl) {
        await authClient.updateProfilePicture({
          profile: profileId,
          picture: selectedPicture.dataUrl
        });
      }

      await reloadFromServer();
      onSaveSuccess?.();
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
    onSaveSuccess,
    profileId,
    reloadFromServer,
    selectedPicture,
    validateProfileForm
  ]);

  const handleStartEdit = useCallback(() => {
    if (forceEditMode) {
      return;
    }
    if (!canModifyProfile) {
      return;
    }
    setIsEditMode(true);
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [canModifyProfile, forceEditMode]);

  const handleCancelEdit = useCallback(() => {
    setFormState(originalFormState);
    setSelectedPicture(null);
    setFieldErrors({});
    setIsEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [originalFormState]);

  const handlePictureInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) {
        return;
      }

      try {
        const cropResult = await pictureCropper.selectImageFile(file, {
          validation: {
            maxBytes: resolvedProfilePictureConfig.maxBytes,
            acceptedMimeTypes: resolvedProfilePictureConfig.acceptedMimeTypes
          }
        });

        if (!cropResult) {
          return;
        }

        setSelectedPicture({
          dataUrl: cropResult.dataUrl,
          fileName: cropResult.fileName
        });
        setSuccessMessage(null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo procesar la foto seleccionada.');
      } finally {
        event.target.value = '';
      }
    },
    [
      pictureCropper,
      resolvedProfilePictureConfig.acceptedMimeTypes,
      resolvedProfilePictureConfig.maxBytes
    ]
  );

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
      if (forceEditMode && allowDefaultProfileEdit) {
        onHeaderActionsChange({
          primary: {
            label: isSaving ? 'Guardando...' : 'Guardar cambios',
            action: 'primary',
            disabled: isLoading || isSaving || !hasChanges,
            onClick: () => {
              void handleSave();
            }
          }
        });
        return () => onHeaderActionsChange(null);
      }

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
      secondary: forceEditMode
        ? undefined
        : {
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
    forceEditMode,
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
          src={selectedPicture?.dataUrl || pictureUrl || undefined}
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
                  void handlePictureInputChange(event);
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
              Archivo seleccionado: {selectedPicture.fileName}
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
          label="Nombre(s)"
          fullWidth
          required={resolvedRequiredFields.firstName}
          value={formState.firstName}
          onChange={handleFieldChange('firstName')}
          error={Boolean(fieldErrors.firstName)}
          helperText={fieldErrors.firstName}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Primer apellido"
          fullWidth
          required={resolvedRequiredFields.lastName1}
          value={formState.lastName1}
          onChange={handleFieldChange('lastName1')}
          error={Boolean(fieldErrors.lastName1)}
          helperText={fieldErrors.lastName1}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Segundo apellido"
          fullWidth
          required={resolvedRequiredFields.lastName2}
          value={formState.lastName2}
          onChange={handleFieldChange('lastName2')}
          error={Boolean(fieldErrors.lastName2)}
          helperText={fieldErrors.lastName2}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
        <TextField
          label="Fecha de nacimiento"
          type="date"
          fullWidth
          required={resolvedRequiredFields.birthday}
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
          required={resolvedRequiredFields.gender}
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
          label="Alias del perfil (opcional)"
          fullWidth
          required={resolvedRequiredFields.label}
          value={formState.label}
          onChange={handleFieldChange('label')}
          error={Boolean(fieldErrors.label)}
          helperText={fieldErrors.label}
          disabled={!allowDefaultProfileEdit || !isEditMode}
        />
      </Box>

      {shouldRenderInternalActions ? (
        <Stack direction="row" justifyContent="flex-end">
          {!canModifyProfile ? null : !isEditMode ? (
            <Stack direction="row" spacing={1}>
              {allowDefaultProfileEdit && !forceEditMode ? (
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
              {!forceEditMode ? (
                <Button variant="outlined" onClick={handleCancelEdit} disabled={isSaving}>
                  Cancelar
                </Button>
              ) : null}
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
      {pictureCropper.cropDialog}
    </Stack>
  );
}
