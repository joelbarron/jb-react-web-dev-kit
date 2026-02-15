import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { JBAppConfig, getApiBaseUrl, getAuthBasePath } from '../config';
import { createLocalStorageTokenStorage } from './storage';
import {
  AccountUpdatePayload,
  AccountConfirmationPayload,
  AccountConfirmationResendPayload,
  ApiDetailResponse,
  CreateAdminUserPayload,
  CreateProfilePayload,
  CreateAuthenticatedAxiosOptions,
  DeleteAccountPayload,
  JbDrfAuthConfig,
  JbDrfAuthEndpoints,
  JbDrfWebAuthResponse,
  LinkSocialPayload,
  LoginBasicPayload,
  LoginSocialPrecheckResponse,
  LoginSocialPayload,
  PasswordChangePayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  ProfilePicturePayload,
  ProfilesResponse,
  RegisterPayload,
  RefreshPayload,
  RequestOtpPayload,
  SwitchProfilePayload,
  TokenPair,
  TokenStorage,
  UnlinkSocialPayload,
  UpdateProfilePayload,
  VerifyOtpPayload
} from './types';

const normalizeAuthBasePath = (basePath?: string) => {
  const normalized = (basePath ?? '/authentication').trim();
  if (!normalized) {
    return '/authentication';
  }
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.replace(/\/+$/, '');
};

export const createAuthEndpoints = (basePath?: string): JbDrfAuthEndpoints => {
  const root = normalizeAuthBasePath(basePath);
  return {
    loginBasic: `${root}/login/basic/`,
    loginSocial: `${root}/login/social/`,
    loginSocialPrecheck: `${root}/login/social/precheck/`,
    loginSocialLink: `${root}/login/social/link/`,
    loginSocialUnlink: `${root}/login/social/unlink/`,
    loginOtpVerify: `${root}/otp/verify/`,
    otpRequest: `${root}/otp/request/`,
    register: `${root}/register/`,
    accountConfirmation: `${root}/registration/account-confirmation-email/`,
    accountConfirmationResend: `${root}/registration/account-confirmation-email/resend/`,
    me: `${root}/me/?client=web`,
    profilePicture: `${root}/profile/picture/`,
    refresh: `${root}/token/refresh/`,
    switchProfile: `${root}/profile/switch/`,
    profiles: `${root}/profiles/`,
    accountUpdate: `${root}/account/update/`,
    accountDelete: `${root}/account/delete/`,
    passwordResetRequest: `${root}/password-reset/request/`,
    passwordResetConfirm: `${root}/password-reset/confirm/`,
    passwordResetChange: `${root}/password-reset/change/`,
    adminCreateSuperuser: `${root}/admin/create-superuser/`,
    adminCreateStaff: `${root}/admin/create-staff/`
  };
};

export const defaultAuthEndpoints: JbDrfAuthEndpoints = createAuthEndpoints('/authentication');

export type AuthClient = {
  endpoints: JbDrfAuthEndpoints;
  tokenStorage: TokenStorage;
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
  createPublicAxios: () => AxiosInstance;
  createAuthenticatedAxios: (options?: CreateAuthenticatedAxiosOptions) => AxiosInstance;
  createAuthenticatedAxiosWithRefresh: (options?: CreateAuthenticatedAxiosOptions) => AxiosInstance;
  loginBasic: (payload: LoginBasicPayload) => Promise<JbDrfWebAuthResponse>;
  loginSocial: (payload: LoginSocialPayload) => Promise<JbDrfWebAuthResponse>;
  loginSocialPrecheck: (payload: LoginSocialPayload) => Promise<LoginSocialPrecheckResponse>;
  linkSocial: (payload: LinkSocialPayload) => Promise<Record<string, unknown>>;
  unlinkSocial: (payload: UnlinkSocialPayload) => Promise<Record<string, unknown>>;
  requestOtp: (payload: RequestOtpPayload) => Promise<Record<string, unknown>>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<JbDrfWebAuthResponse>;
  register: (payload: RegisterPayload) => Promise<ApiDetailResponse>;
  confirmAccountEmail: (payload: AccountConfirmationPayload) => Promise<ApiDetailResponse>;
  resendAccountConfirmation: (payload: AccountConfirmationResendPayload) => Promise<ApiDetailResponse>;
  getMe: () => Promise<JbDrfWebAuthResponse>;
  updateProfilePicture: (payload: ProfilePicturePayload) => Promise<Record<string, unknown>>;
  updateAccount: (payload: AccountUpdatePayload, method?: 'PATCH' | 'PUT') => Promise<Record<string, unknown>>;
  deleteAccount: (payload: DeleteAccountPayload) => Promise<unknown>;
  getProfiles: () => Promise<ProfilesResponse>;
  getProfileById: (profileId: number | string) => Promise<Record<string, unknown>>;
  createProfile: (payload: CreateProfilePayload) => Promise<Record<string, unknown>>;
  updateProfile: (profileId: number | string, payload: UpdateProfilePayload) => Promise<Record<string, unknown>>;
  deleteProfile: (profileId: number | string) => Promise<Record<string, unknown>>;
  requestPasswordReset: (payload: PasswordResetRequestPayload) => Promise<Record<string, unknown>>;
  confirmPasswordReset: (payload: PasswordResetConfirmPayload) => Promise<Record<string, unknown>>;
  changePassword: (payload: PasswordChangePayload) => Promise<Record<string, unknown>>;
  refreshToken: (payload?: RefreshPayload) => Promise<TokenPair>;
  switchProfile: (payload: SwitchProfilePayload) => Promise<JbDrfWebAuthResponse>;
  createSuperuser: (payload: CreateAdminUserPayload, bootstrapToken?: string) => Promise<Record<string, unknown>>;
  createStaffUser: (payload: CreateAdminUserPayload, bootstrapToken?: string) => Promise<Record<string, unknown>>;
  logout: () => void;
};

type RefreshResponsePayload = {
  accessToken?: string;
  refreshToken?: string;
  access?: string;
  refresh?: string;
};

const getRefreshTokenFromResponse = (
  response: AxiosResponse<RefreshResponsePayload>
): TokenPair => ({
  accessToken: response.data.accessToken ?? response.data.access ?? '',
  refreshToken: response.data.refreshToken ?? response.data.refresh ?? ''
});

const normalizeBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/+$/, '');

const normalizeDetailResponse = (data: Record<string, unknown>): ApiDetailResponse => ({
  ...data,
  emailSent: (data.emailSent as boolean | undefined) ?? (data.email_sent as boolean | undefined)
});

const withClientPayload = <TPayload extends { client?: 'web' | 'mobile'; device?: unknown }>(
  payload: TPayload,
  defaultClient: 'web' | 'mobile'
) => {
  const client = payload.client ?? defaultClient;
  if (client === 'web') {
    const { device: _device, ...rest } = payload;
    return { ...rest, client };
  }
  return { ...payload, client };
};

export const createAuthClient = (config: JbDrfAuthConfig): AuthClient => {
  const endpoints: JbDrfAuthEndpoints = {
    ...createAuthEndpoints(config.apiBasePath),
    ...(config.endpoints ?? {})
  };

  const tokenStorageKey = config.tokenStorageKey ?? 'jwt_access_token';
  const refreshTokenStorageKey = config.refreshTokenStorageKey ?? 'jwt_refresh_token';
  const tokenStorage = config.tokenStorage ?? createLocalStorageTokenStorage(tokenStorageKey);
  const baseUrl = normalizeBaseUrl(config.apiBaseUrl);
  const defaultClient = config.defaultClient ?? 'web';

  const withBaseUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const getAccessToken = () => tokenStorage.getAccessToken();
  const setAccessToken = (token: string) => tokenStorage.setAccessToken(token);
  const clearSession = () => tokenStorage.removeAccessToken();
  let refreshPromise: Promise<string | null> | null = null;

  const saveRefreshToken = (token?: string | null) => {
    if (!token) {
      return;
    }
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(refreshTokenStorageKey, token);
  };

  const getStoredRefreshToken = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage.getItem(refreshTokenStorageKey);
  };

  const clearStoredRefreshToken = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(refreshTokenStorageKey);
  };

  const createPublicAxios = () =>
    axios.create({
      baseURL: baseUrl
    });

  const createAuthenticatedAxios = (options?: CreateAuthenticatedAxiosOptions) => {
    const instance = axios.create({
      baseURL: baseUrl,
      ...(options?.requestConfig ?? {})
    });

    instance.interceptors.request.use((requestConfig) => {
      const token = getAccessToken();
      if (token) {
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          typeof config.onUnauthorized === 'function'
        ) {
          config.onUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  };

  const createAuthenticatedAxiosWithRefresh = (options?: CreateAuthenticatedAxiosOptions) => {
    const instance = createAuthenticatedAxios(options);

    instance.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
          return Promise.reject(error);
        }

        const originalRequest = error.config as
          | (typeof error.config & { _retry?: boolean })
          | undefined;

        if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshTokenFromStorage = getStoredRefreshToken();
              if (!refreshTokenFromStorage) {
                return null;
              }

              const nextTokens = await refreshToken({ refreshToken: refreshTokenFromStorage });
              saveRefreshToken(nextTokens.refreshToken);

              return nextTokens.accessToken || null;
            })().finally(() => {
              refreshPromise = null;
            });
          }

          const nextAccessToken = await refreshPromise;
          if (!nextAccessToken) {
            return Promise.reject(error);
          }

          setAccessToken(nextAccessToken);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          if (typeof config.onUnauthorized === 'function') {
            config.onUnauthorized();
          }
          return Promise.reject(refreshError);
        }
      }
    );

    return instance;
  };

  const loginBasic = async (payload: LoginBasicPayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createPublicAxios().post<JbDrfWebAuthResponse>(withBaseUrl(endpoints.loginBasic), {
      ...withClientPayload(payload, defaultClient)
    });

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    saveRefreshToken(refreshTokenValue);

    return response.data;
  };

  const loginSocial = async (payload: LoginSocialPayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createPublicAxios().post<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.loginSocial),
      withClientPayload(payload, defaultClient)
    );

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    saveRefreshToken(refreshTokenValue);
    return response.data;
  };

  const loginSocialPrecheck = async (payload: LoginSocialPayload): Promise<LoginSocialPrecheckResponse> => {
    const response = await createPublicAxios().post<LoginSocialPrecheckResponse>(
      withBaseUrl(endpoints.loginSocialPrecheck),
      withClientPayload(payload, defaultClient)
    );
    return response.data;
  };

  const linkSocial = async (payload: LinkSocialPayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.loginSocialLink),
      payload
    );
    return response.data;
  };

  const unlinkSocial = async (payload: UnlinkSocialPayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.loginSocialUnlink),
      payload
    );
    return response.data;
  };

  const requestOtp = async (payload: RequestOtpPayload): Promise<Record<string, unknown>> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.otpRequest),
      payload
    );
    return response.data;
  };

  const verifyOtp = async (payload: VerifyOtpPayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createPublicAxios().post<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.loginOtpVerify),
      withClientPayload(payload, defaultClient)
    );
    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    saveRefreshToken(refreshTokenValue);
    return response.data;
  };

  const register = async (payload: RegisterPayload): Promise<ApiDetailResponse> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.register),
      payload
    );
    return normalizeDetailResponse(response.data);
  };

  const confirmAccountEmail = async (payload: AccountConfirmationPayload): Promise<ApiDetailResponse> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.accountConfirmation),
      payload
    );
    return normalizeDetailResponse(response.data);
  };

  const resendAccountConfirmation = async (
    payload: AccountConfirmationResendPayload
  ): Promise<ApiDetailResponse> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.accountConfirmationResend),
      payload
    );
    return normalizeDetailResponse(response.data);
  };

  const getMe = async (): Promise<JbDrfWebAuthResponse> => {
    const response = await createAuthenticatedAxiosWithRefresh().get<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.me)
    );
    return response.data;
  };

  const updateProfilePicture = async (
    payload: ProfilePicturePayload
  ): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().patch<Record<string, unknown>>(
      withBaseUrl(endpoints.profilePicture),
      payload
    );
    return response.data;
  };

  const updateAccount = async (
    payload: AccountUpdatePayload,
    method: 'PATCH' | 'PUT' = 'PATCH'
  ): Promise<Record<string, unknown>> => {
    const instance = createAuthenticatedAxiosWithRefresh();
    const response =
      method === 'PUT'
        ? await instance.put<Record<string, unknown>>(withBaseUrl(endpoints.accountUpdate), payload)
        : await instance.patch<Record<string, unknown>>(withBaseUrl(endpoints.accountUpdate), payload);
    return response.data;
  };

  const deleteAccount = async (payload: DeleteAccountPayload): Promise<unknown> => {
    const response = await createAuthenticatedAxiosWithRefresh().delete(withBaseUrl(endpoints.accountDelete), {
      data: payload
    });
    return response.data;
  };

  const getProfiles = async (): Promise<ProfilesResponse> => {
    const response = await createAuthenticatedAxiosWithRefresh().get<ProfilesResponse>(
      withBaseUrl(endpoints.profiles)
    );
    return response.data;
  };

  const getProfileById = async (profileId: number | string): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().get<Record<string, unknown>>(
      withBaseUrl(`${endpoints.profiles}${profileId}/`)
    );
    return response.data;
  };

  const createProfile = async (payload: CreateProfilePayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.profiles),
      payload
    );
    return response.data;
  };

  const updateProfile = async (
    profileId: number | string,
    payload: UpdateProfilePayload
  ): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().patch<Record<string, unknown>>(
      withBaseUrl(`${endpoints.profiles}${profileId}/`),
      payload
    );
    return response.data;
  };

  const deleteProfile = async (profileId: number | string): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().delete<Record<string, unknown>>(
      withBaseUrl(`${endpoints.profiles}${profileId}/`)
    );
    return response.data;
  };

  const requestPasswordReset = async (
    payload: PasswordResetRequestPayload
  ): Promise<Record<string, unknown>> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.passwordResetRequest),
      payload
    );
    return normalizeDetailResponse(response.data);
  };

  const confirmPasswordReset = async (
    payload: PasswordResetConfirmPayload
  ): Promise<Record<string, unknown>> => {
    const response = await createPublicAxios().post<Record<string, unknown>>(
      withBaseUrl(endpoints.passwordResetConfirm),
      payload
    );
    return response.data;
  };

  const changePassword = async (payload: PasswordChangePayload): Promise<Record<string, unknown>> => {
    const response = await createAuthenticatedAxiosWithRefresh().post<Record<string, unknown>>(
      withBaseUrl(endpoints.passwordResetChange),
      payload
    );
    return response.data;
  };

  const refreshToken = async (payload?: RefreshPayload): Promise<TokenPair> => {
    const refreshTokenValue = payload?.refreshToken ?? getStoredRefreshToken();
    if (!refreshTokenValue) {
      return {
        accessToken: '',
        refreshToken: ''
      };
    }

    const response = await createPublicAxios().post<RefreshResponsePayload>(
      withBaseUrl(endpoints.refresh),
      {
      refresh: refreshTokenValue
      }
    );
    const nextTokens = getRefreshTokenFromResponse(response);
    if (nextTokens.accessToken) {
      setAccessToken(nextTokens.accessToken);
    }
    saveRefreshToken(nextTokens.refreshToken);
    return nextTokens;
  };

  const switchProfile = async (payload: SwitchProfilePayload): Promise<JbDrfWebAuthResponse> => {
    const response = await createAuthenticatedAxios().post<JbDrfWebAuthResponse>(
      withBaseUrl(endpoints.switchProfile),
      withClientPayload(payload, defaultClient)
    );

    const accessToken = response.data.tokens?.accessToken;
    const refreshTokenValue = response.data.tokens?.refreshToken;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    saveRefreshToken(refreshTokenValue);

    return response.data;
  };

  const logout = () => {
    clearSession();
    clearStoredRefreshToken();
  };

  const createAdminUser = async (
    endpoint: string,
    payload: CreateAdminUserPayload,
    bootstrapToken?: string
  ): Promise<Record<string, unknown>> => {
    const headers = bootstrapToken
      ? {
          'X-Admin-Bootstrap-Token': bootstrapToken
        }
      : undefined;

    const requestClient = bootstrapToken ? createPublicAxios() : createAuthenticatedAxiosWithRefresh();
    const response = await requestClient.post<Record<string, unknown>>(
      withBaseUrl(endpoint),
      payload,
      { headers }
    );
    return response.data;
  };

  const createSuperuser = async (
    payload: CreateAdminUserPayload,
    bootstrapToken?: string
  ): Promise<Record<string, unknown>> => {
    return createAdminUser(endpoints.adminCreateSuperuser, payload, bootstrapToken);
  };

  const createStaffUser = async (
    payload: CreateAdminUserPayload,
    bootstrapToken?: string
  ): Promise<Record<string, unknown>> => {
    return createAdminUser(endpoints.adminCreateStaff, payload, bootstrapToken);
  };

  return {
    endpoints,
    tokenStorage,
    getAccessToken,
    setAccessToken,
    clearSession,
    createPublicAxios,
    createAuthenticatedAxios,
    createAuthenticatedAxiosWithRefresh,
    loginBasic,
    loginSocial,
    loginSocialPrecheck,
    linkSocial,
    unlinkSocial,
    requestOtp,
    verifyOtp,
    register,
    confirmAccountEmail,
    resendAccountConfirmation,
    getMe,
    updateProfilePicture,
    updateAccount,
    deleteAccount,
    getProfiles,
    getProfileById,
    createProfile,
    updateProfile,
    deleteProfile,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    refreshToken,
    switchProfile,
    createSuperuser,
    createStaffUser,
    logout
  };
};

export const createAuthClientFromJBWebConfig = (
  appConfig: JBAppConfig,
  overrides?: Omit<JbDrfAuthConfig, 'apiBaseUrl' | 'apiBasePath'>
): AuthClient => {
  return createAuthClient({
    apiBaseUrl: getApiBaseUrl(appConfig),
    apiBasePath: getAuthBasePath(appConfig),
    ...(overrides ?? {})
  });
};
