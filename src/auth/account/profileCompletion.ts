import { JBAuthRequiredProfileFields } from '../../config';
import { AuthClient } from '../client';
import { pickString } from './utils';
import { asRecord, findDefaultProfile, normalizeProfilesList } from './utils';

export type ProfileCompletionFieldKey = keyof JBAuthRequiredProfileFields;

export type ProfileCompletionResult = {
  isComplete: boolean;
  missingFields: ProfileCompletionFieldKey[];
  requiredFields: JBAuthRequiredProfileFields;
};

export type DefaultProfileCompletionStatus = ProfileCompletionResult & {
  profile: Record<string, unknown>;
  profileId: number | null;
};

const DEFAULT_REQUIRED_PROFILE_FIELDS: JBAuthRequiredProfileFields = {
  firstName: true,
  lastName1: true,
  lastName2: false,
  birthday: true,
  gender: true,
  label: false
};

const EMPTY_VALUE_MARKERS = new Set([
  '',
  'null',
  'none',
  'n/a',
  'na',
  'unknown',
  'unspecified'
]);

const normalizeAbsolutePath = (path: string): string => {
  const trimmed = String(path || '').trim();
  if (!trimmed) {
    return '/account/complete-profile';
  }
  const cleanPath = trimmed.replace(/\/+$/g, '');
  return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
};

const hasValue = (value: unknown): boolean => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return !EMPTY_VALUE_MARKERS.has(normalized);
};

const getProfileId = (profile: Record<string, unknown> | null): number | null => {
  if (!profile) {
    return null;
  }

  const rawId = Number(profile.id ?? 0);
  if (!Number.isFinite(rawId) || rawId <= 0) {
    return null;
  }
  return rawId;
};

const getProfileFieldValue = (
  profile: Record<string, unknown>,
  fieldKey: ProfileCompletionFieldKey
): string => {
  switch (fieldKey) {
    case 'firstName':
      return pickString(profile, ['first_name', 'firstName']);
    case 'lastName1':
      return pickString(profile, ['last_name_1', 'lastName1']);
    case 'lastName2':
      return pickString(profile, ['last_name_2', 'lastName2']);
    case 'birthday':
      return pickString(profile, ['birthday']);
    case 'gender':
      return pickString(profile, ['gender']);
    case 'label':
      return pickString(profile, ['label']);
    default:
      return '';
  }
};

export const resolveRequiredProfileFields = (
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>
): JBAuthRequiredProfileFields => {
  return {
    ...DEFAULT_REQUIRED_PROFILE_FIELDS,
    ...(requiredProfileFields ?? {})
  };
};

export const resolveProfileCompletion = (
  profile: Record<string, unknown>,
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>
): ProfileCompletionResult => {
  const resolvedRequiredFields = resolveRequiredProfileFields(requiredProfileFields);

  const missingFields = (Object.keys(resolvedRequiredFields) as ProfileCompletionFieldKey[]).filter((fieldKey) => {
    if (!resolvedRequiredFields[fieldKey]) {
      return false;
    }
    return !hasValue(getProfileFieldValue(profile, fieldKey));
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    requiredFields: resolvedRequiredFields
  };
};

export const resolveProfileCompletionPath = (path?: string): string => {
  return normalizeAbsolutePath(path || '/account/complete-profile');
};

export const resolveDefaultProfileCompletionStatus = async (
  authClient: AuthClient,
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>
): Promise<DefaultProfileCompletionStatus> => {
  const [mePayload, profilesPayload] = await Promise.all([
    authClient.getMe(),
    authClient.getProfiles()
  ]);
  const meRecord = asRecord(mePayload);
  const profiles = normalizeProfilesList(profilesPayload);
  let defaultProfile = findDefaultProfile(profiles);

  if (!defaultProfile) {
    defaultProfile = asRecord(meRecord.active_profile ?? meRecord.activeProfile);
  }

  const defaultProfileId = getProfileId(defaultProfile);
  let profileDetail = defaultProfile ?? {};

  if (defaultProfileId) {
    try {
      profileDetail = asRecord(await authClient.getProfileById(defaultProfileId));
    } catch {
      // Keep profile list payload as fallback.
    }
  }

  const completion = resolveProfileCompletion(profileDetail, requiredProfileFields);
  return {
    ...completion,
    profile: profileDetail,
    profileId: defaultProfileId
  };
};
