import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

import { JBConfirmDialog } from '../../core';
import { JBAuthRequiredProfileFields } from '../../config';
import { GENDERS, GENDER_SELECT_OPTIONS } from '../constants';
import { parseAuthError } from '../forms/errorParser';
import { AccountFeedbackSnackbars } from './AccountFeedbackSnackbars';
import { AuthAccountProfilesViewProps } from './types';
import { asRecord, pickString, toBase64DataUrl } from './utils';

type ProfileFormState = {
  first_name: string;
  last_name_1: string;
  last_name_2: string;
  birthday: string;
  gender: string;
  label: string;
  role: string;
  is_default: boolean;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

const EMPTY_PROFILE_FORM: ProfileFormState = {
  first_name: '',
  last_name_1: '',
  last_name_2: '',
  birthday: '',
  gender: '',
  label: '',
  role: '',
  is_default: false
};

const DEFAULT_REQUIRED_PROFILE_FIELDS: JBAuthRequiredProfileFields = {
  firstName: true,
  lastName1: true,
  lastName2: false,
  birthday: true,
  gender: true,
  label: false
};

const createProfileFormSchema = (requiredProfileFields: JBAuthRequiredProfileFields) => z.object({
  first_name: z.string(),
  last_name_1: z.string(),
  last_name_2: z.string().optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
  label: z.string().optional(),
  role: z.string().trim().min(1, 'Selecciona un rol para el perfil.'),
  is_default: z.boolean()
}).superRefine((data, ctx) => {
  if (requiredProfileFields.firstName && !String(data.first_name || '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes ingresar el nombre.',
      path: ['first_name']
    });
  }

  if (requiredProfileFields.lastName1 && !String(data.last_name_1 || '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes ingresar el primer apellido.',
      path: ['last_name_1']
    });
  }

  if (requiredProfileFields.lastName2 && !String(data.last_name_2 || '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes ingresar el segundo apellido.',
      path: ['last_name_2']
    });
  }

  const birthday = String(data.birthday || '').trim();
  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de nacimiento no es válida.',
      path: ['birthday']
    });
  }
  if (requiredProfileFields.birthday && !birthday) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes ingresar la fecha de nacimiento.',
      path: ['birthday']
    });
  }

  const gender = String(data.gender || '').trim().toUpperCase();
  if (gender && !GENDERS.includes(gender as (typeof GENDERS)[number])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona un género válido.',
      path: ['gender']
    });
  }
  if (requiredProfileFields.gender && !gender) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes seleccionar el género.',
      path: ['gender']
    });
  }

  if (requiredProfileFields.label && !String(data.label || '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes ingresar la etiqueta del perfil.',
      path: ['label']
    });
  }
});

const FALLBACK_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  STAFF: 'Staff',
  DOCTOR: 'Doctor',
  PATIENT: 'Paciente'
};

const normalizeProfiles = (payload: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload.map((item) => asRecord(item));
  }
  const record = asRecord(payload);
  if (Array.isArray(record.results)) {
    return record.results.map((item) => asRecord(item));
  }
  return [];
};

const normalizeProfileForm = (profile: Record<string, unknown>): ProfileFormState => ({
  first_name: pickString(profile, ['first_name', 'firstName']),
  last_name_1: pickString(profile, ['last_name_1', 'lastName1']),
  last_name_2: pickString(profile, ['last_name_2', 'lastName2']),
  birthday: pickString(profile, ['birthday']).slice(0, 10),
  gender: pickString(profile, ['gender']).toUpperCase(),
  label: pickString(profile, ['label']),
  role: pickString(profile, ['role']).toUpperCase(),
  is_default: Boolean(profile.is_default ?? profile.isDefault)
});

const getInitials = (value: string): string => {
  const tokens = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) {
    return 'P';
  }
  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('');
};

const formatBirthdayForDisplay = (rawValue: string): string => {
  const value = String(rawValue || '').trim().slice(0, 10);
  if (!value) {
    return '';
  }
  const parts = value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return value;
};

export function AuthAccountProfilesView(props: AuthAccountProfilesViewProps) {
  const {
    authClient,
    allowProfileManagement = false,
    profileRoles = [],
    requiredProfileFields,
    onHeaderActionsChange,
    onUnsavedChangesChange
  } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<Array<Record<string, unknown>>>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileFormErrors>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const resolvedRequiredFields = useMemo(
    () => ({
      ...DEFAULT_REQUIRED_PROFILE_FIELDS,
      ...(requiredProfileFields ?? {})
    }),
    [requiredProfileFields]
  );
  const profileFormSchema = useMemo(
    () => createProfileFormSchema(resolvedRequiredFields),
    [resolvedRequiredFields]
  );

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await authClient.getProfiles();
      const normalized = normalizeProfiles(payload);
      setProfiles(normalized);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar los perfiles.');
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const visibleProfiles = useMemo(
    () =>
      profiles.filter((profile) => {
        const isDefault = Boolean(profile.is_default ?? profile.isDefault);
        return !isDefault;
      }),
    [profiles]
  );

  const selectedProfile = useMemo(
    () => visibleProfiles.find((profile) => Number(profile.id || 0) === selectedProfileId) || null,
    [visibleProfiles, selectedProfileId]
  );
  const selectedProfileFormState = useMemo(
    () => (selectedProfile ? normalizeProfileForm(selectedProfile) : EMPTY_PROFILE_FORM),
    [selectedProfile]
  );
  const hasFormValues = useMemo(
    () =>
      Boolean(
        formState.first_name ||
        formState.last_name_1 ||
        formState.last_name_2 ||
        formState.birthday ||
        formState.gender ||
        formState.label ||
        formState.role
      ),
    [formState]
  );
  const hasUnsavedChanges = useMemo(() => {
    if (selectedPictureFile) {
      return true;
    }
    if (!selectedProfileId) {
      return hasFormValues;
    }
    return (
      formState.first_name !== selectedProfileFormState.first_name ||
      formState.last_name_1 !== selectedProfileFormState.last_name_1 ||
      formState.last_name_2 !== selectedProfileFormState.last_name_2 ||
      formState.birthday !== selectedProfileFormState.birthday ||
      formState.gender !== selectedProfileFormState.gender ||
      formState.label !== selectedProfileFormState.label ||
      formState.role !== selectedProfileFormState.role
    );
  }, [formState, hasFormValues, selectedPictureFile, selectedProfileFormState, selectedProfileId]);
  const roleOptions = useMemo(() => {
    if (profileRoles.length) {
      const signupRoles = profileRoles.filter((role) => Boolean(role.allowSignup));
      return signupRoles.map((role) => ({
        value: role.value,
        label: role.label || role.value
      }));
    }
    const collected = new Map<string, { value: string; label: string; allowSignup: boolean }>();
    profiles.forEach((profile) => {
      const role = pickString(profile, ['role']).toUpperCase();
      if (!role) {
        return;
      }
      if (!collected.has(role)) {
        collected.set(role, {
          value: role,
          label: role,
          allowSignup: false
        });
      }
    });
    return Array.from(collected.values())
      .filter((role) => role.allowSignup)
      .map((role) => ({
        value: role.value,
        label: role.label
      }));
  }, [profileRoles, profiles]);
  const roleLabelByValue = useMemo(() => {
    const mapped: Record<string, string> = { ...FALLBACK_ROLE_LABELS };
    profileRoles.forEach((role) => {
      const key = String(role.value || '').trim().toUpperCase();
      if (!key) {
        return;
      }
      mapped[key] = role.label || mapped[key] || key;
    });
    return mapped;
  }, [profileRoles]);

  useEffect(() => {
    if (!selectedProfile) {
      return;
    }
    setFormState(normalizeProfileForm(selectedProfile));
    setFieldErrors({});
    setProfilePictureUrl(pickString(selectedProfile, ['picture', 'photoURL']));
    setSelectedPictureFile(null);
  }, [selectedProfile]);

  const selectedPicturePreviewUrl = useMemo(() => {
    if (!selectedPictureFile) {
      return '';
    }
    return URL.createObjectURL(selectedPictureFile);
  }, [selectedPictureFile]);

  useEffect(() => {
    return () => {
      if (selectedPicturePreviewUrl) {
        URL.revokeObjectURL(selectedPicturePreviewUrl);
      }
    };
  }, [selectedPicturePreviewUrl]);

  useEffect(() => {
    if (!allowProfileManagement && onHeaderActionsChange) {
      onHeaderActionsChange(null);
    }
  }, [allowProfileManagement, onHeaderActionsChange]);

  useEffect(() => {
    if (!onUnsavedChangesChange) {
      return undefined;
    }
    onUnsavedChangesChange(Boolean(allowProfileManagement && hasUnsavedChanges));
    return () => onUnsavedChangesChange(false);
  }, [allowProfileManagement, hasUnsavedChanges, onUnsavedChangesChange]);

  if (!allowProfileManagement) {
    return (
      <Alert severity="info">
        La gestión de perfiles múltiples está deshabilitada para esta implementación.
      </Alert>
    );
  }

  const onCreateNew = useCallback(() => {
    setIsFormVisible(true);
    setSelectedProfileId(null);
    setFormState(EMPTY_PROFILE_FORM);
    setFieldErrors({});
    setProfilePictureUrl('');
    setSelectedPictureFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const onOpenEditor = useCallback((profileId: number) => {
    setIsFormVisible(true);
    setSelectedProfileId(profileId);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const onFieldChange = useCallback(
    <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setErrorMessage(null);
      setSuccessMessage(null);
    },
    []
  );

  const onSave = useCallback(async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const parsedForm = profileFormSchema.safeParse(formState);
    if (!parsedForm.success) {
      const nextFieldErrors: ProfileFormErrors = {};
      parsedForm.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0] || '') as keyof ProfileFormState;
        if (!fieldName || nextFieldErrors[fieldName]) {
          return;
        }
        nextFieldErrors[fieldName] = issue.message;
      });
      setFieldErrors(nextFieldErrors);
      setErrorMessage(null);
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, unknown> = {
        ...formState
      };
      if (selectedPictureFile) {
        payload.picture = await toBase64DataUrl(selectedPictureFile);
      }

      if (selectedProfileId) {
        await authClient.updateProfile(selectedProfileId, payload);
        setSuccessMessage('Perfil actualizado correctamente.');
      } else {
        await authClient.createProfile(payload);
        setSuccessMessage('Perfil creado correctamente.');
      }
      setFieldErrors({});
      await loadProfiles();
    } catch (error) {
      const parsed = parseAuthError(error);
      const allowedFields: Array<keyof ProfileFormState> = [
        'first_name',
        'last_name_1',
        'last_name_2',
        'birthday',
        'gender',
        'label',
        'role'
      ];

      const nextFieldErrors: ProfileFormErrors = {};
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
        const normalizedField = field as keyof ProfileFormState;
        if (!allowedFields.includes(normalizedField)) {
          return;
        }
        if (!nextFieldErrors[normalizedField]) {
          nextFieldErrors[normalizedField] = message;
        }
      });
      setFieldErrors(nextFieldErrors);

      if (parsed.rootMessage) {
        setErrorMessage(parsed.rootMessage);
        return;
      }

      const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean);
      if (hasFieldErrors) {
        setErrorMessage(null);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  }, [authClient, formState, loadProfiles, profileFormSchema, selectedPictureFile, selectedProfileId]);

  const onDelete = useCallback(async () => {
    if (!selectedProfileId) {
      return;
    }
    try {
      setIsSaving(true);
      await authClient.deleteProfile(selectedProfileId);
      setSuccessMessage('Perfil eliminado correctamente.');
      setIsFormVisible(false);
      setSelectedProfileId(null);
      setFormState(EMPTY_PROFILE_FORM);
      await loadProfiles();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo eliminar el perfil.');
    } finally {
      setIsSaving(false);
      setDeleteDialogOpen(false);
    }
  }, [authClient, loadProfiles, selectedProfileId]);

  const onRequestDelete = useCallback(() => {
    if (!selectedProfileId) {
      return;
    }
    setDeleteDialogOpen(true);
  }, [selectedProfileId]);

  const onSwitchProfile = async (profileId: number) => {
    try {
      setIsSwitching(profileId);
      await authClient.switchProfile({
        profile: profileId,
        client: 'web'
      });
      window.location.reload();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cambiar el perfil activo.');
    } finally {
      setIsSwitching(null);
    }
  };

  const shouldRenderInternalActions = !onHeaderActionsChange;

  useEffect(() => {
    if (!onHeaderActionsChange) {
      return undefined;
    }

    if (!isFormVisible) {
      onHeaderActionsChange({
        secondary: {
          label: 'Nuevo perfil',
          action: 'secondary',
          disabled: isLoading || isSaving,
          onClick: onCreateNew
        }
      });
      return () => onHeaderActionsChange(null);
    }

    onHeaderActionsChange({
      ...(selectedProfileId
        ? {
            danger: {
              label: 'Eliminar perfil',
              action: 'delete' as const,
              disabled: isSaving,
              onClick: () => {
                onRequestDelete();
              }
            }
          }
        : {}),
      primary: {
        label: isSaving ? 'Guardando...' : 'Guardar perfil',
        action: 'primary',
        disabled: isSaving,
        onClick: () => {
          void onSave();
        }
      }
    });

    return () => onHeaderActionsChange(null);
  }, [isFormVisible, isLoading, isSaving, onCreateNew, onHeaderActionsChange, onRequestDelete, selectedProfileId, onSave]);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}>
        <Stack
          spacing={1.5}
          sx={{ width: { xs: '100%', md: 360 } }}>
          {shouldRenderInternalActions && !isFormVisible ? (
            <Button
              variant="outlined"
              onClick={onCreateNew}>
              Nuevo perfil
            </Button>
          ) : null}
          {isLoading ? (
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : visibleProfiles.length ? (
            visibleProfiles.map((profile) => {
              const profileId = Number(profile.id || 0);
              const isDefault = Boolean(profile.is_default ?? profile.isDefault);
              const label =
                pickString(profile, ['display_name', 'displayName']) ||
                [pickString(profile, ['first_name', 'firstName']), pickString(profile, ['last_name_1', 'lastName1'])]
                  .filter(Boolean)
                  .join(' ');
              const roleValue = pickString(profile, ['role']).toUpperCase();
              const roleLabel = roleLabelByValue[roleValue] || roleValue || 'N/D';
              const profilePicture = pickString(profile, ['picture', 'photoURL', 'photo_url']);
              const birthdayDisplay = formatBirthdayForDisplay(pickString(profile, ['birthday']));
              const genderValue = pickString(profile, ['gender']).toUpperCase();
              const genderLabel =
                GENDER_SELECT_OPTIONS.find((option) => option.value === genderValue)?.label || '';
              const profileLabel = pickString(profile, ['label']);
              return (
                <Card
                  key={profileId}
                  variant={selectedProfileId === profileId ? 'elevation' : 'outlined'}
                  sx={{
                    borderRadius: 2,
                    borderColor: selectedProfileId === profileId ? 'primary.main' : 'divider',
                    boxShadow: selectedProfileId === profileId ? 2 : 0,
                    transition: 'all 0.2s ease'
                  }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        justifyContent="space-between">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            src={profilePicture || undefined}
                            sx={{ width: 40, height: 40 }}
                          >
                            {getInitials(label || `Perfil ${profileId}`)}
                          </Avatar>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{label || `Perfil ${profileId}`}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              Rol: {roleLabel}
                            </Typography>
                            {birthdayDisplay ? (
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                Nacimiento: {birthdayDisplay}
                              </Typography>
                            ) : null}
                            {genderLabel ? (
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                Género: {genderLabel}
                              </Typography>
                            ) : null}
                            {profileLabel ? (
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                Etiqueta: {profileLabel}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                        {isDefault ? (
                          <Chip
                            size="small"
                            color="primary"
                            label="Predeterminado"
                          />
                        ) : null}
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={() => onOpenEditor(profileId)}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            void onSwitchProfile(profileId);
                          }}
                          disabled={isSwitching === profileId}>
                          {isSwitching === profileId ? 'Cambiando...' : 'Activar'}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Alert severity="info">No hay perfiles adicionales para administrar.</Alert>
          )}
        </Stack>

        <Stack
          spacing={2}
          sx={{ flex: 1 }}>
          {isFormVisible ? (
            <>
              <Typography variant="h6">
                {selectedProfileId ? `Editar perfil #${selectedProfileId}` : 'Crear perfil'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Avatar
                  src={selectedPicturePreviewUrl || profilePictureUrl || undefined}
                  sx={{ width: 72, height: 72 }}
                />
                <Stack spacing={0.75}>
                  <Button variant="outlined" component="label">
                    Seleccionar foto
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSelectedPictureFile(file);
                      }}
                    />
                  </Button>
                  {selectedPictureFile ? (
                    <Typography variant="caption" color="text.secondary">
                      Archivo seleccionado: {selectedPictureFile.name}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Si no seleccionas un archivo nuevo, se conservará la foto actual.
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <Stack
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2
                }}>
                <TextField
                  label="Nombre(s)"
                  required={resolvedRequiredFields.firstName}
                  value={formState.first_name}
                  onChange={(event) => onFieldChange('first_name', event.target.value)}
                  error={Boolean(fieldErrors.first_name)}
                  helperText={fieldErrors.first_name}
                />
                <TextField
                  label="Primer apellido"
                  required={resolvedRequiredFields.lastName1}
                  value={formState.last_name_1}
                  onChange={(event) => onFieldChange('last_name_1', event.target.value)}
                  error={Boolean(fieldErrors.last_name_1)}
                  helperText={fieldErrors.last_name_1}
                />
                <TextField
                  label="Segundo apellido"
                  required={resolvedRequiredFields.lastName2}
                  value={formState.last_name_2}
                  onChange={(event) => onFieldChange('last_name_2', event.target.value)}
                  error={Boolean(fieldErrors.last_name_2)}
                  helperText={fieldErrors.last_name_2}
                />
                <TextField
                  label="Fecha de nacimiento"
                  type="date"
                  required={resolvedRequiredFields.birthday}
                  value={formState.birthday}
                  onChange={(event) => onFieldChange('birthday', event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(fieldErrors.birthday)}
                  helperText={fieldErrors.birthday}
                />
                <TextField
                  label="Género"
                  select
                  required={resolvedRequiredFields.gender}
                  value={formState.gender}
                  onChange={(event) => onFieldChange('gender', event.target.value)}
                  error={Boolean(fieldErrors.gender)}
                  helperText={fieldErrors.gender || 'Selecciona el género del perfil.'}>
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
                  label="Rol"
                  select
                  value={formState.role}
                  onChange={(event) => onFieldChange('role', event.target.value.toUpperCase())}
                  error={Boolean(fieldErrors.role)}
                  helperText={fieldErrors.role || 'Solo se muestran los roles permitidos para registro.'}>
                  <MenuItem value="">
                    <em>Selecciona un rol</em>
                  </MenuItem>
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Etiqueta"
                  required={resolvedRequiredFields.label}
                  value={formState.label}
                  onChange={(event) => onFieldChange('label', event.target.value)}
                  error={Boolean(fieldErrors.label)}
                  helperText={fieldErrors.label}
                />
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                spacing={1}>
                {shouldRenderInternalActions ? (
                  <>
                    <Button
                      color="error"
                      onClick={() => {
                        onRequestDelete();
                      }}
                      disabled={!selectedProfileId || isSaving}>
                      Eliminar perfil
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        void onSave();
                      }}
                      disabled={isSaving}>
                      {isSaving ? 'Guardando...' : 'Guardar perfil'}
                    </Button>
                  </>
                ) : null}
              </Stack>
            </>
          ) : null}
        </Stack>
      </Stack>
      <JBConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar perfil"
        description="Esta acción eliminará el perfil seleccionado. ¿Deseas continuar?"
        confirmLabel={isSaving ? 'Eliminando...' : 'Eliminar perfil'}
        cancelLabel="Cancelar"
        confirmColor="error"
        onClose={() => {
          if (isSaving) {
            return;
          }
          setDeleteDialogOpen(false);
        }}
        onConfirm={() => {
          if (isSaving) {
            return;
          }
          void onDelete();
        }}
      />
      <AccountFeedbackSnackbars
        successMessage={successMessage}
        errorMessage={errorMessage}
        onCloseSuccess={() => setSuccessMessage(null)}
        onCloseError={() => setErrorMessage(null)}
      />
    </Stack>
  );
}
