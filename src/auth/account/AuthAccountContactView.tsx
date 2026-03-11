import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { JBButton } from '../../core';
import { JBSelectField, JBTextField } from '../../forms';
import { COUNTRY_CALLING_CODE_OPTIONS } from '../constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { AccountFeedbackSnackbars } from './AccountFeedbackSnackbars';
import { AuthAccountContactViewProps } from './types';
import {
  asRecord,
  buildPhoneWithCode,
  findDefaultProfile,
  normalizeProfilesList,
  pickString,
  splitPhoneWithCode
} from './utils';

type ContactFormState = {
  email: string;
  username: string;
  phoneCountryCode: string;
  phoneNumber: string;
  emailOtpCode: string;
  phoneOtpCode: string;
};

type FieldAvailabilityState = {
  status: 'idle' | 'checking' | 'available' | 'unavailable';
  detail: string;
};

type AvailabilityCheckResult = {
  available: boolean;
  detail?: string;
};

type ContactAvailabilityState = {
  email: FieldAvailabilityState;
  phone: FieldAvailabilityState;
  username: FieldAvailabilityState;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const EMAIL_MAX_LENGTH = 254;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const PHONE_MIN_LENGTH = 8;
const PHONE_MAX_LENGTH = 15;

const EMPTY_CONTACT_FORM: ContactFormState = {
  email: '',
  username: '',
  phoneCountryCode: '',
  phoneNumber: '',
  emailOtpCode: '',
  phoneOtpCode: ''
};

const DEFAULT_FIELD_AVAILABILITY: FieldAvailabilityState = {
  status: 'idle',
  detail: ''
};

const DEFAULT_CONTACT_AVAILABILITY: ContactAvailabilityState = {
  email: { ...DEFAULT_FIELD_AVAILABILITY },
  phone: { ...DEFAULT_FIELD_AVAILABILITY },
  username: { ...DEFAULT_FIELD_AVAILABILITY }
};

const getEmailValidationMessage = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > EMAIL_MAX_LENGTH) {
    return `El correo admite máximo ${EMAIL_MAX_LENGTH} caracteres.`;
  }
  if (!EMAIL_PATTERN.test(normalized)) {
    return 'Ingresa un correo válido.';
  }
  return null;
};

const getUsernameValidationMessage = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return `El usuario debe tener al menos ${USERNAME_MIN_LENGTH} caracteres.`;
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return `El usuario admite máximo ${USERNAME_MAX_LENGTH} caracteres.`;
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Usa solo letras, números, punto, guion o guion bajo.';
  }
  return null;
};

const getPhoneValidationMessage = (value: string): string | null => {
  const normalized = value.replace(/\D+/g, '');
  if (!normalized) {
    return null;
  }
  if (normalized.length < PHONE_MIN_LENGTH) {
    return `El número telefónico debe tener al menos ${PHONE_MIN_LENGTH} dígitos.`;
  }
  if (normalized.length > PHONE_MAX_LENGTH) {
    return `El número telefónico admite máximo ${PHONE_MAX_LENGTH} dígitos.`;
  }
  return null;
};

const pickStringFromSources = (
  sources: Array<Record<string, unknown>>,
  keys: string[]
): string => {
  for (const source of sources) {
    const value = pickString(source, keys);
    if (value) {
      return value;
    }
  }
  return '';
};

const findFirstStringByKeysDeep = (
  source: unknown,
  keys: string[],
  maxDepth = 5
): string => {
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const queue: Array<{ value: unknown; depth: number }> = [{ value: source, depth: 0 }];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const { value, depth } = current;
    if (!value || typeof value !== 'object' || visited.has(value) || depth > maxDepth) {
      continue;
    }
    visited.add(value);

    const record = asRecord(value);
    for (const [key, candidate] of Object.entries(record)) {
      if (normalizedKeys.has(key.toLowerCase())) {
        const normalized = String(candidate ?? '').trim();
        if (normalized) {
          return normalized;
        }
      }
      if (candidate && typeof candidate === 'object') {
        queue.push({ value: candidate, depth: depth + 1 });
      }
    }
  }

  return '';
};

const normalizeFromMe = (payload: Record<string, unknown>): ContactFormState => {
  const rawPayload = asRecord(payload);
  const rawUser = asRecord(payload.user);
  const rawUserData = asRecord(rawUser.data);
  const rawUserDataNested = asRecord(rawUserData.data);
  const rawActiveProfile = asRecord(rawPayload.active_profile ?? rawPayload.activeProfile);
  const rawActiveProfileData = asRecord(rawActiveProfile.data);
  const rawDefaultProfile = asRecord(rawPayload.default_profile ?? rawPayload.defaultProfile);
  const rawDefaultProfileData = asRecord(rawDefaultProfile.data);
  const rawPayloadData = asRecord(rawPayload.data);
  const sources = [
    rawUserDataNested,
    rawUserData,
    rawUser,
    rawActiveProfileData,
    rawActiveProfile,
    rawDefaultProfileData,
    rawDefaultProfile,
    rawPayloadData,
    rawPayload
  ];

  const phoneKeys = [
    'phone',
    'mobile_phone',
    'mobilePhone',
    'contact_phone',
    'contactPhone'
  ];
  const phoneRaw =
    pickStringFromSources(sources, phoneKeys) || findFirstStringByKeysDeep(rawPayload, phoneKeys);
  let splitPhone = splitPhoneWithCode(phoneRaw);

  if (!splitPhone.phone) {
    const phoneNumberKeys = [
      'phone_number',
      'phoneNumber',
      'mobile_phone_number',
      'mobilePhoneNumber'
    ];
    const phoneCountryCodeKeys = [
      'phone_country_code',
      'phoneCountryCode',
      'mobile_country_code',
      'mobileCountryCode',
      'country_code',
      'countryCode'
    ];
    const phoneNumber =
      (pickStringFromSources(sources, phoneNumberKeys) ||
        findFirstStringByKeysDeep(rawPayload, phoneNumberKeys)).replace(/\D+/g, '');
    const phoneCountryCode =
      pickStringFromSources(sources, phoneCountryCodeKeys) ||
      findFirstStringByKeysDeep(rawPayload, phoneCountryCodeKeys);

    splitPhone = {
      countryCode: phoneCountryCode || splitPhone.countryCode,
      phone: phoneNumber
    };
  }

  const emailKeys = ['email', 'contact_email', 'contactEmail'];
  const usernameKeys = ['username', 'user_name', 'userName'];

  return {
    email: pickStringFromSources(sources, emailKeys) || findFirstStringByKeysDeep(rawPayload, emailKeys),
    username:
      pickStringFromSources(sources, usernameKeys) || findFirstStringByKeysDeep(rawPayload, usernameKeys),
    phoneCountryCode: splitPhone.countryCode,
    phoneNumber: splitPhone.phone,
    emailOtpCode: '',
    phoneOtpCode: ''
  };
};

export function AuthAccountContactView(props: AuthAccountContactViewProps) {
  const {
    authClient,
    enableContactVerification = true,
    allowAccountEdit = true,
    onHeaderActionsChange,
    onUnsavedChangesChange
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [originalFormState, setOriginalFormState] = useState<ContactFormState>(EMPTY_CONTACT_FORM);
  const [availabilityState, setAvailabilityState] = useState<ContactAvailabilityState>(
    DEFAULT_CONTACT_AVAILABILITY
  );
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [emailVerificationProofToken, setEmailVerificationProofToken] = useState<string | null>(null);
  const [phoneVerificationProofToken, setPhoneVerificationProofToken] = useState<string | null>(null);
  const [emailSectionMessage, setEmailSectionMessage] = useState<string | null>(null);
  const [phoneSectionMessage, setPhoneSectionMessage] = useState<string | null>(null);

  const { control, reset, setValue, trigger, getValues } = useForm<ContactFormState>({
    mode: 'onChange',
    defaultValues: EMPTY_CONTACT_FORM
  });
  const emailValue = useWatch({ control, name: 'email' }) ?? '';
  const usernameValue = useWatch({ control, name: 'username' }) ?? '';
  const phoneCountryCodeValue = useWatch({ control, name: 'phoneCountryCode' }) ?? '';
  const phoneNumberValue = useWatch({ control, name: 'phoneNumber' }) ?? '';
  const emailOtpCodeValue = useWatch({ control, name: 'emailOtpCode' }) ?? '';
  const phoneOtpCodeValue = useWatch({ control, name: 'phoneOtpCode' }) ?? '';
  const previousEmailRef = useRef(emailValue);
  const previousUsernameRef = useRef(usernameValue);
  const previousPhoneStateRef = useRef(`${phoneCountryCodeValue}|${phoneNumberValue}`);

  const fullPhone = useMemo(
    () => buildPhoneWithCode(phoneCountryCodeValue, phoneNumberValue),
    [phoneCountryCodeValue, phoneNumberValue]
  );
  const originalFullPhone = useMemo(
    () => buildPhoneWithCode(originalFormState.phoneCountryCode, originalFormState.phoneNumber),
    [originalFormState.phoneCountryCode, originalFormState.phoneNumber]
  );

  const emailChanged = useMemo(
    () => emailValue.trim() !== originalFormState.email.trim(),
    [emailValue, originalFormState.email]
  );
  const usernameChanged = useMemo(
    () => usernameValue.trim() !== originalFormState.username.trim(),
    [usernameValue, originalFormState.username]
  );
  const phoneChanged = useMemo(() => fullPhone !== originalFullPhone, [fullPhone, originalFullPhone]);

  const hasChanges = emailChanged || usernameChanged || phoneChanged;
  const hasAvailabilityChecking =
    availabilityState.email.status === 'checking' ||
    availabilityState.phone.status === 'checking' ||
    availabilityState.username.status === 'checking';

  const applyNormalizedFormState = useCallback(
    (normalizedState: ContactFormState) => {
      reset(normalizedState);
      setOriginalFormState(normalizedState);
      setIsEditMode(false);
      setAvailabilityState(DEFAULT_CONTACT_AVAILABILITY);
      setEmailOtpSent(false);
      setPhoneOtpSent(false);
      setEmailVerificationProofToken(null);
      setPhoneVerificationProofToken(null);
      setEmailSectionMessage(null);
      setPhoneSectionMessage(null);
    },
    [reset]
  );

  const reloadFromServer = useCallback(async () => {
    setIsLoading(true);
    try {
      const [meResponse, profilesResponse] = await Promise.all([
        authClient.getMe(),
        authClient.getProfiles().catch(() => [])
      ]);
      const mePayload = asRecord(meResponse);
      let normalizedState = normalizeFromMe(mePayload);

      const needsProfileFallback =
        !normalizedState.phoneNumber || !normalizedState.email || !normalizedState.username;
      if (needsProfileFallback) {
        const profiles = normalizeProfilesList(profilesResponse);
        const defaultProfile = findDefaultProfile(profiles);
        if (defaultProfile) {
          const fallbackState = normalizeFromMe({
            ...mePayload,
            default_profile: defaultProfile
          });
          normalizedState = {
            ...normalizedState,
            email: normalizedState.email || fallbackState.email,
            username: normalizedState.username || fallbackState.username,
            phoneCountryCode: normalizedState.phoneCountryCode || fallbackState.phoneCountryCode,
            phoneNumber: normalizedState.phoneNumber || fallbackState.phoneNumber
          };
        }
      }

      applyNormalizedFormState(normalizedState);
      setErrorMessage(null);
      setSuccessMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la información de cuenta.');
    } finally {
      setIsLoading(false);
    }
  }, [applyNormalizedFormState, authClient]);

  useEffect(() => {
    void reloadFromServer();
  }, [reloadFromServer]);

  useEffect(() => {
    if (!onUnsavedChangesChange) {
      return undefined;
    }
    onUnsavedChangesChange(Boolean(isEditMode && hasChanges));
    return () => onUnsavedChangesChange(false);
  }, [hasChanges, isEditMode, onUnsavedChangesChange]);

  const setFieldAvailability = useCallback(
    (
      field: keyof ContactAvailabilityState,
      nextStatus: FieldAvailabilityState['status'],
      detail = ''
    ) => {
      setAvailabilityState((prev) => ({
        ...prev,
        [field]: {
          status: nextStatus,
          detail
        }
      }));
    },
    []
  );

  useEffect(() => {
    const normalizedPhoneNumber = phoneNumberValue.replace(/\D+/g, '');
    if (normalizedPhoneNumber !== phoneNumberValue) {
      setValue('phoneNumber', normalizedPhoneNumber, { shouldDirty: true, shouldTouch: true });
    }
  }, [phoneNumberValue, setValue]);

  useEffect(() => {
    if (previousEmailRef.current === emailValue) {
      return;
    }
    previousEmailRef.current = emailValue;
    setSuccessMessage(null);
    setErrorMessage(null);
    setEmailVerificationProofToken(null);
    setEmailOtpSent(false);
    setEmailSectionMessage(null);
    setFieldAvailability('email', 'idle', '');
    setValue('emailOtpCode', '', { shouldDirty: false });
  }, [emailValue, setFieldAvailability, setValue]);

  useEffect(() => {
    if (previousUsernameRef.current === usernameValue) {
      return;
    }
    previousUsernameRef.current = usernameValue;
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldAvailability('username', 'idle', '');
  }, [setFieldAvailability, usernameValue]);

  useEffect(() => {
    const currentPhoneState = `${phoneCountryCodeValue}|${phoneNumberValue}`;
    if (previousPhoneStateRef.current === currentPhoneState) {
      return;
    }
    previousPhoneStateRef.current = currentPhoneState;
    setSuccessMessage(null);
    setErrorMessage(null);
    setPhoneVerificationProofToken(null);
    setPhoneOtpSent(false);
    setPhoneSectionMessage(null);
    setFieldAvailability('phone', 'idle', '');
    setValue('phoneOtpCode', '', { shouldDirty: false });
  }, [phoneCountryCodeValue, phoneNumberValue, setFieldAvailability, setValue]);

  const getAvailabilityAdornment = useCallback(
    (field: keyof ContactAvailabilityState, changed: boolean) => {
      if (!allowAccountEdit || !isEditMode || !changed) {
        return null;
      }

      const state = availabilityState[field];
      if (state.status === 'idle') {
        return null;
      }

      if (state.status === 'checking') {
        return (
          <InputAdornment position="end">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">
                Validando
              </Typography>
            </Stack>
          </InputAdornment>
        );
      }

      if (state.status === 'available') {
        return (
          <InputAdornment position="end">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 16 }} />
              <Typography variant="caption" color="success.main">
                Disponible
              </Typography>
            </Stack>
          </InputAdornment>
        );
      }

      return (
        <InputAdornment position="end">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ErrorOutlineIcon color="error" sx={{ fontSize: 16 }} />
            <Typography variant="caption" color="error.main">
              No disponible
            </Typography>
          </Stack>
        </InputAdornment>
      );
    },
    [allowAccountEdit, availabilityState, isEditMode]
  );

  const checkEmailAvailability = useCallback(async (): Promise<AvailabilityCheckResult> => {
    const normalizedEmail = emailValue.trim();
    if (!emailChanged || !normalizedEmail) {
      setFieldAvailability('email', 'idle', '');
      return { available: true };
    }

    const emailValidationMessage = getEmailValidationMessage(normalizedEmail);
    if (emailValidationMessage) {
      setFieldAvailability('email', 'unavailable', emailValidationMessage);
      return { available: false, detail: emailValidationMessage };
    }

    setFieldAvailability('email', 'checking', '');
    try {
      const response = await authClient.checkEmailAvailability({ email: normalizedEmail });
      if (!response.available) {
        const detail = response.detail || 'El correo ya se encuentra en uso.';
        setFieldAvailability('email', 'unavailable', detail);
        return { available: false, detail };
      }
      const detail = 'Correo disponible.';
      setFieldAvailability('email', 'available', detail);
      return { available: true, detail };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'No se pudo validar disponibilidad de correo.';
      setFieldAvailability(
        'email',
        'unavailable',
        detail
      );
      return { available: false, detail };
    }
  }, [authClient, emailChanged, emailValue, setFieldAvailability]);

  const checkUsernameAvailability = useCallback(async (): Promise<AvailabilityCheckResult> => {
    const normalizedUsername = usernameValue.trim();
    if (!usernameChanged || !normalizedUsername) {
      setFieldAvailability('username', 'idle', '');
      return { available: true };
    }

    const usernameValidationMessage = getUsernameValidationMessage(normalizedUsername);
    if (usernameValidationMessage) {
      setFieldAvailability('username', 'unavailable', usernameValidationMessage);
      return { available: false, detail: usernameValidationMessage };
    }

    setFieldAvailability('username', 'checking', '');
    try {
      const response = await authClient.checkUsernameAvailability({ username: normalizedUsername });
      if (!response.available) {
        const detail = response.detail || 'El usuario ya se encuentra en uso.';
        setFieldAvailability('username', 'unavailable', detail);
        return { available: false, detail };
      }
      const detail = 'Usuario disponible.';
      setFieldAvailability('username', 'available', detail);
      return { available: true, detail };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'No se pudo validar disponibilidad de usuario.';
      setFieldAvailability(
        'username',
        'unavailable',
        detail
      );
      return { available: false, detail };
    }
  }, [authClient, setFieldAvailability, usernameChanged, usernameValue]);

  const checkPhoneAvailability = useCallback(async (): Promise<AvailabilityCheckResult> => {
    if (!phoneChanged || !fullPhone) {
      setFieldAvailability('phone', 'idle', '');
      return { available: true };
    }
    if (!phoneCountryCodeValue) {
      const detail = 'Selecciona el código de país para continuar.';
      setFieldAvailability('phone', 'unavailable', detail);
      return { available: false, detail };
    }

    const phoneValidationMessage = getPhoneValidationMessage(phoneNumberValue);
    if (phoneValidationMessage) {
      setFieldAvailability('phone', 'unavailable', phoneValidationMessage);
      return { available: false, detail: phoneValidationMessage };
    }

    setFieldAvailability('phone', 'checking', '');
    try {
      const response = await authClient.checkPhoneAvailability({ phone: fullPhone });
      if (!response.available) {
        const detail = response.detail || 'El teléfono ya se encuentra en uso.';
        setFieldAvailability('phone', 'unavailable', detail);
        return { available: false, detail };
      }
      const detail = 'Teléfono disponible.';
      setFieldAvailability('phone', 'available', detail);
      return { available: true, detail };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'No se pudo validar disponibilidad de teléfono.';
      setFieldAvailability(
        'phone',
        'unavailable',
        detail
      );
      return { available: false, detail };
    }
  }, [
    authClient,
    fullPhone,
    phoneChanged,
    phoneCountryCodeValue,
    phoneNumberValue,
    setFieldAvailability
  ]);

  useEffect(() => {
    if (!allowAccountEdit || !isEditMode || !emailChanged || !emailValue.trim()) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void checkEmailAvailability();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [allowAccountEdit, checkEmailAvailability, emailChanged, emailValue, isEditMode]);

  useEffect(() => {
    if (!allowAccountEdit || !isEditMode || !usernameChanged || !usernameValue.trim()) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void checkUsernameAvailability();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [allowAccountEdit, checkUsernameAvailability, isEditMode, usernameChanged, usernameValue]);

  useEffect(() => {
    if (!allowAccountEdit || !isEditMode || !phoneChanged || !fullPhone) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void checkPhoneAvailability();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [allowAccountEdit, checkPhoneAvailability, fullPhone, isEditMode, phoneChanged]);

  const validateAvailability = useCallback(async () => {
    const fieldsToValidate: Array<keyof ContactFormState> = [];
    if (emailChanged) {
      fieldsToValidate.push('email');
    }
    if (usernameChanged) {
      fieldsToValidate.push('username');
    }
    if (phoneChanged) {
      fieldsToValidate.push('phoneCountryCode', 'phoneNumber');
    }
    if (fieldsToValidate.length > 0) {
      const isFormValid = await trigger(fieldsToValidate);
      if (!isFormValid) {
        throw new Error('Corrige los campos marcados para continuar.');
      }
    }

    if (phoneNumberValue && !phoneCountryCodeValue) {
      throw new Error('Selecciona el código de país del teléfono para continuar.');
    }

    const emailResult = await checkEmailAvailability();
    if (!emailResult.available) {
      throw new Error(emailResult.detail || 'El correo ya se encuentra en uso.');
    }

    const usernameResult = await checkUsernameAvailability();
    if (!usernameResult.available) {
      throw new Error(usernameResult.detail || 'El nombre de usuario ya se encuentra en uso.');
    }

    const phoneResult = await checkPhoneAvailability();
    if (!phoneResult.available) {
      throw new Error(phoneResult.detail || 'El teléfono ya se encuentra en uso.');
    }
  }, [
    checkEmailAvailability,
    checkPhoneAvailability,
    checkUsernameAvailability,
    emailChanged,
    phoneCountryCodeValue,
    phoneChanged,
    phoneNumberValue,
    trigger,
    usernameChanged
  ]);

  const handleSendOtp = async (channel: 'email' | 'sms') => {
    const isEmail = channel === 'email';
    const value = isEmail ? emailValue.trim() : fullPhone;

    if (!value) {
      setErrorMessage(isEmail ? 'Captura un correo válido para continuar.' : 'Captura un teléfono válido para continuar.');
      return;
    }

    try {
      if (isEmail) {
        const isFieldValid = await trigger('email');
        if (!isFieldValid) {
          setErrorMessage('Corrige el correo antes de solicitar el código.');
          return;
        }
      } else {
        const isFieldValid = await trigger(['phoneCountryCode', 'phoneNumber']);
        if (!isFieldValid) {
          setErrorMessage('Corrige el teléfono antes de solicitar el código.');
          return;
        }
      }

      if (isEmail) {
        setIsSendingEmailOtp(true);
        const availability = await checkEmailAvailability();
        if (!availability.available) {
          setErrorMessage(availability.detail || 'El correo ya se encuentra en uso.');
          return;
        }
      } else {
        if (!phoneCountryCodeValue) {
          setErrorMessage('Selecciona el código de país para validar el teléfono.');
          return;
        }
        setIsSendingPhoneOtp(true);
        const availability = await checkPhoneAvailability();
        if (!availability.available) {
          setErrorMessage(availability.detail || 'El teléfono ya se encuentra en uso.');
          return;
        }
      }

      await authClient.requestContactVerification({
        channel,
        ...(isEmail ? { email: value } : { phone: value })
      });

      if (isEmail) {
        setEmailOtpSent(true);
        setEmailSectionMessage('Enviamos un código de verificación al correo indicado.');
      } else {
        setPhoneOtpSent(true);
        setPhoneSectionMessage('Enviamos un código de verificación al teléfono indicado.');
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo enviar el código de verificación.');
    } finally {
      if (isEmail) {
        setIsSendingEmailOtp(false);
      } else {
        setIsSendingPhoneOtp(false);
      }
    }
  };

  const handleVerifyOtp = async (channel: 'email' | 'sms') => {
    const isEmail = channel === 'email';
    const code = (isEmail ? emailOtpCodeValue : phoneOtpCodeValue).trim();
    const value = isEmail ? emailValue.trim() : fullPhone;

    if (!code || !value) {
      setErrorMessage('Debes capturar el código de verificación para continuar.');
      return;
    }

    try {
      if (isEmail) {
        setIsVerifyingEmailOtp(true);
      } else {
        setIsVerifyingPhoneOtp(true);
      }

      const response = asRecord(
        await authClient.verifyContactVerification({
          channel,
          code,
          ...(isEmail ? { email: value } : { phone: value })
        })
      );

      const token = String(response.verification_proof_token || response.verificationProofToken || '');
      if (!token) {
        throw new Error('No se recibió token de verificación.');
      }

      if (isEmail) {
        setEmailVerificationProofToken(token);
        setEmailOtpSent(false);
        setValue('emailOtpCode', '', { shouldDirty: false, shouldTouch: false });
        setEmailSectionMessage('Correo validado correctamente.');
      } else {
        setPhoneVerificationProofToken(token);
        setPhoneOtpSent(false);
        setValue('phoneOtpCode', '', { shouldDirty: false, shouldTouch: false });
        setPhoneSectionMessage('Teléfono validado correctamente.');
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo validar el código.');
    } finally {
      if (isEmail) {
        setIsVerifyingEmailOtp(false);
      } else {
        setIsVerifyingPhoneOtp(false);
      }
    }
  };

  const handleSave = useCallback(async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!allowAccountEdit || !isEditMode) {
      return;
    }

    if (!hasChanges) {
      setSuccessMessage('No hay cambios por guardar.');
      return;
    }

    if (enableContactVerification && emailChanged && emailValue.trim() && !emailVerificationProofToken) {
      setErrorMessage('Debes validar el correo antes de guardar.');
      return;
    }

    if (enableContactVerification && phoneChanged && fullPhone && !phoneVerificationProofToken) {
      setErrorMessage('Debes validar el teléfono antes de guardar.');
      return;
    }

    try {
      setIsSaving(true);
      await validateAvailability();

      await authClient.updateAccount({
        email: emailValue.trim() || undefined,
        username: usernameValue.trim() || undefined,
        phone: fullPhone || undefined,
        ...(emailVerificationProofToken ? { email_verification_proof_token: emailVerificationProofToken } : {}),
        ...(phoneVerificationProofToken ? { phone_verification_proof_token: phoneVerificationProofToken } : {})
      });

      await reloadFromServer();
      setSuccessMessage('Cuenta actualizada correctamente.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la cuenta.');
    } finally {
      setIsSaving(false);
    }
  }, [
    allowAccountEdit,
    authClient,
    emailChanged,
    emailVerificationProofToken,
    emailValue,
    enableContactVerification,
    fullPhone,
    hasChanges,
    isEditMode,
    phoneChanged,
    phoneVerificationProofToken,
    reloadFromServer,
    usernameValue,
    validateAvailability
  ]);

  const shouldRenderInternalActions = !onHeaderActionsChange;

  const handleStartEdit = useCallback(() => {
    if (!allowAccountEdit) {
      return;
    }
    setIsEditMode(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [allowAccountEdit]);

  const handleCancelEdit = useCallback(() => {
    reset(originalFormState);
    setEmailOtpSent(false);
    setPhoneOtpSent(false);
    setEmailVerificationProofToken(null);
    setPhoneVerificationProofToken(null);
    setEmailSectionMessage(null);
    setPhoneSectionMessage(null);
    setIsEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [originalFormState, reset]);

  useEffect(() => {
    if (!onHeaderActionsChange) {
      return undefined;
    }

    if (!allowAccountEdit) {
      onHeaderActionsChange(null);
      return undefined;
    }

    if (!isEditMode) {
      onHeaderActionsChange({
        primary: {
          label: 'Realizar modificaciones',
          action: 'secondary',
          disabled: isLoading || isSaving,
          onClick: handleStartEdit
        }
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
        disabled:
          isLoading ||
          isSaving ||
          hasAvailabilityChecking ||
          !hasChanges ||
          !isEditMode ||
          (enableContactVerification &&
            emailChanged &&
            Boolean(emailValue.trim()) &&
            !emailVerificationProofToken) ||
          (enableContactVerification && phoneChanged && Boolean(fullPhone) && !phoneVerificationProofToken),
        onClick: () => {
          void handleSave();
        }
      }
    });

    return () => onHeaderActionsChange(null);
  }, [
    allowAccountEdit,
    emailChanged,
    emailVerificationProofToken,
    enableContactVerification,
    emailValue,
    fullPhone,
    handleCancelEdit,
    handleStartEdit,
    handleSave,
    hasAvailabilityChecking,
    hasChanges,
    isEditMode,
    isLoading,
    isSaving,
    onHeaderActionsChange,
    phoneChanged,
    phoneVerificationProofToken
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
      <Stack spacing={0.5}>
        <Typography variant="h6">Cuenta</Typography>
        <Typography variant="body2" color="text.secondary">
          Se deberá validar la disponibilidad antes de cambiar cualquiera de estos datos.
        </Typography>
        {!allowAccountEdit ? (
          <Typography variant="body2" color="text.secondary">
            La edición de cuenta está deshabilitada para esta implementación.
          </Typography>
        ) : !isEditMode ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Esta sección se muestra en modo solo lectura.
            </Typography>
            {shouldRenderInternalActions ? (
              <JBButton action="cancel" onClick={handleStartEdit} disabled={isLoading || isSaving}>
                Realizar modificaciones
              </JBButton>
            ) : null}
          </Stack>
        ) : null}
      </Stack>

      <Stack spacing={2.5}>
        <Box
          sx={{
            p: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">Correo</Typography>
            <JBTextField<ContactFormState, 'email'>
              control={control}
              name="email"
              label="Correo"
              fullWidth
              rules={{
                validate: (value) => {
                  const message = getEmailValidationMessage(String(value || ''));
                  return message || true;
                }
              }}
              inputProps={{
                maxLength: EMAIL_MAX_LENGTH,
                inputMode: 'email'
              }}
              InputProps={{
                endAdornment: getAvailabilityAdornment('email', emailChanged)
              }}
              disabled={!allowAccountEdit || !isEditMode}
            />
            {availabilityState.email.status === 'unavailable' ? (
              <Typography variant="caption" color="error.main">
                {availabilityState.email.detail || 'El correo ya se encuentra en uso.'}
              </Typography>
            ) : null}
            {emailSectionMessage ? (
              <Typography variant="caption" color="success.main">
                {emailSectionMessage}
              </Typography>
            ) : null}

            {allowAccountEdit && isEditMode && enableContactVerification && emailChanged ? (
              <Stack spacing={1.5}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">Verifica tu nuevo correo</Typography>
                    {emailVerificationProofToken ? <Chip color="success" size="small" label="Validado" /> : null}
                  </Stack>
                  {!emailVerificationProofToken ? (
                    <Typography variant="body2" color="text.secondary">
                      Vamos a validar tu nuevo correo mediante un código de verificación que enviaremos a este correo.
                    </Typography>
                  ) : null}
                </Stack>
                {!emailVerificationProofToken ? (
                  <Stack spacing={1.5}>
                    <JBButton
                      variant="text"
                      onClick={() => {
                        void handleSendOtp('email');
                      }}
                      disabled={isSendingEmailOtp}
                      sx={{
                        px: 0,
                        minWidth: 'auto',
                        textDecoration: 'underline',
                        justifyContent: 'flex-start'
                      }}>
                      {isSendingEmailOtp ? 'Enviando código...' : 'Enviar código al correo'}
                    </JBButton>
                    {emailOtpSent ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <JBTextField<ContactFormState, 'emailOtpCode'>
                          control={control}
                          name="emailOtpCode"
                          label="Código de verificación"
                        />
                        <JBButton
                          action="primary"
                          onClick={() => {
                            void handleVerifyOtp('email');
                          }}
                          disabled={isVerifyingEmailOtp}>
                          {isVerifyingEmailOtp ? 'Validando...' : 'Confirmar código'}
                        </JBButton>
                      </Stack>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">Teléfono</Typography>
            <Stack direction="row" spacing={1.5}>
              <JBSelectField<ContactFormState, 'phoneCountryCode'>
                control={control}
                name="phoneCountryCode"
                label="Código"
                sx={{ minWidth: 260 }}
                options={COUNTRY_CALLING_CODE_OPTIONS}
                emptyOptionLabel="Selecciona"
                rules={{
                  validate: (value) => {
                    const hasPhoneNumber = Boolean(getValues('phoneNumber')?.trim());
                    if (!hasPhoneNumber) {
                      return true;
                    }
                    return Boolean(value) || 'Selecciona un código de país.';
                  }
                }}
                disabled={!allowAccountEdit || !isEditMode}
              />
              <JBTextField<ContactFormState, 'phoneNumber'>
                control={control}
                name="phoneNumber"
                fullWidth
                label="Número telefónico"
                rules={{
                  validate: (value) => {
                    const message = getPhoneValidationMessage(String(value || ''));
                    return message || true;
                  }
                }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: PHONE_MAX_LENGTH
                }}
                InputProps={{
                  endAdornment: getAvailabilityAdornment('phone', phoneChanged)
                }}
                disabled={!allowAccountEdit || !isEditMode}
              />
            </Stack>
            {availabilityState.phone.status === 'unavailable' ? (
              <Typography variant="caption" color="error.main">
                {availabilityState.phone.detail || 'El teléfono ya se encuentra en uso.'}
              </Typography>
            ) : null}
            {phoneSectionMessage ? (
              <Typography variant="caption" color="success.main">
                {phoneSectionMessage}
              </Typography>
            ) : null}

            {allowAccountEdit && isEditMode && enableContactVerification && phoneChanged ? (
              <Stack spacing={1.5}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">Verifica tu nuevo teléfono</Typography>
                    {phoneVerificationProofToken ? <Chip color="success" size="small" label="Validado" /> : null}
                  </Stack>
                  {!phoneVerificationProofToken ? (
                    <Typography variant="body2" color="text.secondary">
                      Vamos a validar tu nuevo teléfono mediante un código de verificación que enviaremos por SMS.
                    </Typography>
                  ) : null}
                </Stack>
                {!phoneVerificationProofToken ? (
                  <Stack spacing={1.5}>
                    <JBButton
                      variant="text"
                      onClick={() => {
                        void handleSendOtp('sms');
                      }}
                      disabled={isSendingPhoneOtp}
                      sx={{
                        px: 0,
                        minWidth: 'auto',
                        textDecoration: 'underline',
                        justifyContent: 'flex-start'
                      }}>
                      {isSendingPhoneOtp ? 'Enviando código...' : 'Enviar código por SMS'}
                    </JBButton>
                    {phoneOtpSent ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <JBTextField<ContactFormState, 'phoneOtpCode'>
                          control={control}
                          name="phoneOtpCode"
                          label="Código de verificación"
                        />
                        <JBButton
                          action="primary"
                          onClick={() => {
                            void handleVerifyOtp('sms');
                          }}
                          disabled={isVerifyingPhoneOtp}>
                          {isVerifyingPhoneOtp ? 'Validando...' : 'Confirmar código'}
                        </JBButton>
                      </Stack>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
        </Box>

        <Box
          sx={{
            p: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2
          }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle1">Usuario</Typography>
            <JBTextField<ContactFormState, 'username'>
              control={control}
              name="username"
              label="Usuario"
              fullWidth
              rules={{
                validate: (value) => {
                  const message = getUsernameValidationMessage(String(value || ''));
                  return message || true;
                }
              }}
              inputProps={{
                maxLength: USERNAME_MAX_LENGTH
              }}
              InputProps={{
                endAdornment: getAvailabilityAdornment('username', usernameChanged)
              }}
              disabled={!allowAccountEdit || !isEditMode}
            />
            {availabilityState.username.status === 'unavailable' ? (
              <Typography variant="caption" color="error.main">
                {availabilityState.username.detail || 'El usuario ya se encuentra en uso.'}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </Stack>

      {shouldRenderInternalActions ? (
        <Stack direction="row" justifyContent="flex-end">
          {!allowAccountEdit || !isEditMode ? null : (
            <Stack direction="row" spacing={1}>
              <JBButton action="cancel" onClick={handleCancelEdit} disabled={isSaving}>
                Cancelar
              </JBButton>
              <JBButton
                action="primary"
                onClick={() => {
                  void handleSave();
                }}
                disabled={
                  isSaving ||
                  hasAvailabilityChecking ||
                  !hasChanges ||
                  (enableContactVerification &&
                    emailChanged &&
                    Boolean(emailValue.trim()) &&
                    !emailVerificationProofToken) ||
                  (enableContactVerification && phoneChanged && Boolean(fullPhone) && !phoneVerificationProofToken)
                }>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </JBButton>
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
