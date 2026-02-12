import { AxiosRequestConfig } from 'axios';
import { Gender } from './constants';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type TokenStorage = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  removeAccessToken: () => void;
};

export type JbDrfAuthEndpoints = {
  loginBasic: string;
  loginSocial: string;
  loginSocialLink: string;
  loginSocialUnlink: string;
  loginOtpVerify: string;
  otpRequest: string;
  register: string;
  accountConfirmation: string;
  accountConfirmationResend: string;
  me: string;
  profilePicture: string;
  refresh: string;
  switchProfile: string;
  profiles: string;
  accountUpdate: string;
  accountDelete: string;
  passwordResetRequest: string;
  passwordResetConfirm: string;
  passwordResetChange: string;
  adminCreateSuperuser: string;
  adminCreateStaff: string;
};

export type JbDrfAuthConfig = {
  apiBaseUrl: string;
  apiBasePath?: string;
  endpoints?: Partial<JbDrfAuthEndpoints>;
  tokenStorageKey?: string;
  refreshTokenStorageKey?: string;
  tokenStorage?: TokenStorage;
  defaultClient?: 'web' | 'mobile';
  onUnauthorized?: () => void;
};

export type LoginBasicPayload = {
  login: string;
  password: string;
  client?: 'web' | 'mobile';
  device?: {
    platform?: string;
    name?: string;
    token?: string;
    notificationToken?: string;
  };
};

export type SocialProvider = 'google' | 'facebook' | 'apple';

export type SocialDevicePayload = {
  platform?: string;
  name?: string;
  token?: string;
  notificationToken?: string;
};

export type LoginSocialPayload = {
  provider: SocialProvider;
  idToken?: string;
  accessToken?: string;
  authorizationCode?: string;
  redirectUri?: string;
  codeVerifier?: string;
  clientId?: string;
  role?: string;
  client?: 'web' | 'mobile';
  termsAndConditionsAccepted?: boolean;
  device?: SocialDevicePayload;
};

export type LinkSocialPayload = {
  provider: SocialProvider;
  idToken?: string;
  accessToken?: string;
  authorizationCode?: string;
  redirectUri?: string;
  codeVerifier?: string;
  clientId?: string;
};

export type UnlinkSocialPayload = {
  provider: SocialProvider;
};

export type SwitchProfilePayload = {
  profile: number;
  client?: 'web' | 'mobile';
  device?: {
    platform?: string;
    name?: string;
    token?: string;
    notificationToken?: string;
  };
};

export type ProfilePicturePayload = {
  profile?: number;
  picture: string;
};

export type RefreshPayload = {
  refreshToken?: string;
};

export type OtpChannel = 'sms' | 'email';

export type RequestOtpPayload = {
  channel: OtpChannel;
  email?: string;
  phone?: string;
};

export type VerifyOtpPayload = {
  channel: OtpChannel;
  code: string;
  client?: 'web' | 'mobile';
  role?: string;
  email?: string;
  phone?: string;
  device?: {
    platform?: string;
    name?: string;
    token?: string;
    notificationToken?: string;
  };
};

export type RegisterPayload = {
  email: string;
  phone?: string | null;
  username?: string | null;
  password: string;
  passwordConfirm?: string;
  firstName?: string;
  lastName1?: string;
  lastName2?: string;
  birthday?: string;
  gender?: Gender;
  role?: string;
  termsAndConditionsAccepted?: boolean;
};

export type PasswordResetRequestPayload = {
  email: string;
};

export type PasswordResetConfirmPayload = {
  uid: string;
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type PasswordChangePayload = {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type AccountUpdatePayload = {
  email?: string;
  username?: string;
  phone?: string;
  termsAndConditions?: boolean;
  language?: string;
  timezone?: string;
  [key: string]: unknown;
};

export type DeleteAccountPayload = {
  confirmation: boolean;
};

export type CreateProfilePayload = Record<string, unknown>;
export type UpdateProfilePayload = Record<string, unknown>;

export type CreateAdminUserPayload = {
  email: string;
  password: string;
};

export type AccountConfirmationPayload = {
  uid: string;
  token: string;
};

export type AccountConfirmationResendPayload = {
  email: string;
};

export type JbDrfWebAuthUser = {
  data: {
    displayName: string;
    photoUrl: string;
    email: string;
    username: string;
    birthday: string | null;
    shortcuts: string[];
  };
  loginRedirectUrl: string;
  role: string[];
  status: string;
};

export type JbDrfWebAuthResponse = {
  user: JbDrfWebAuthUser;
  activeProfile: Record<string, unknown>;
  termsAndConditions?: string | null;
  tokens?: TokenPair;
};

export type ApiDetailResponse = {
  detail?: string;
  emailSent?: boolean;
  [key: string]: unknown;
};

export type ProfilesResponse = {
  results?: Record<string, unknown>[];
} | Record<string, unknown>[];

export type CreateAuthenticatedAxiosOptions = {
  requestConfig?: AxiosRequestConfig;
};
