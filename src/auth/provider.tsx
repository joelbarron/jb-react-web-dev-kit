import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AuthClient } from './client';
import {
  AccountConfirmationPayload,
  AccountConfirmationResendPayload,
  ApiDetailResponse,
  LoginBasicPayload,
  PasswordChangePayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  ProfilesResponse,
  RegisterPayload,
  RequestOtpPayload,
  SwitchProfilePayload,
  VerifyOtpPayload
} from './types';

export type JBAuthStatus = 'configuring' | 'authenticated' | 'unauthenticated';

export type JBAuthContextValue = {
  authStatus: JBAuthStatus;
  isAuthenticated: boolean;
  user: unknown | null;
  signIn: (payload: LoginBasicPayload) => Promise<unknown>;
  signUp: (payload: RegisterPayload) => Promise<ApiDetailResponse>;
  confirmAccountEmail: (payload: AccountConfirmationPayload) => Promise<ApiDetailResponse>;
  resendAccountConfirmation: (payload: AccountConfirmationResendPayload) => Promise<ApiDetailResponse>;
  signInOtp: (payload: VerifyOtpPayload) => Promise<unknown>;
  requestOtp: (payload: RequestOtpPayload) => Promise<Record<string, unknown>>;
  requestPasswordReset: (payload: PasswordResetRequestPayload) => Promise<Record<string, unknown>>;
  confirmPasswordReset: (payload: PasswordResetConfirmPayload) => Promise<Record<string, unknown>>;
  changePassword: (payload: PasswordChangePayload) => Promise<Record<string, unknown>>;
  getProfiles: () => Promise<ProfilesResponse>;
  switchProfile: (payload: SwitchProfilePayload) => Promise<unknown>;
  signOut: () => void;
  refreshToken: () => Promise<string | null>;
};

type JBAuthProviderProps = {
  authClient: AuthClient;
  children: ReactNode;
  onAuthStateChanged?: (state: {
    authStatus: JBAuthStatus;
    isAuthenticated: boolean;
    user: unknown | null;
  }) => void;
};

const JBAuthContext = createContext<JBAuthContextValue | undefined>(undefined);

const isTokenValid = (token: string | null) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
};

export function JBAuthProvider(props: JBAuthProviderProps) {
  const { authClient, children, onAuthStateChanged } = props;
  const [authStatus, setAuthStatus] = useState<JBAuthStatus>('configuring');
  const [user, setUser] = useState<unknown | null>(null);

  useEffect(() => {
    onAuthStateChanged?.({
      authStatus,
      isAuthenticated: authStatus === 'authenticated',
      user
    });
  }, [authStatus, onAuthStateChanged, user]);

  const setAuthenticatedSession = useCallback((authResponse: { user?: unknown }) => {
    setUser(authResponse.user ?? null);
    setAuthStatus('authenticated');
    return authResponse.user ?? null;
  }, []);

  const signIn = useCallback(
    async (payload: LoginBasicPayload) => {
      const response = await authClient.loginBasic(payload);
      return setAuthenticatedSession(response);
    },
    [authClient, setAuthenticatedSession]
  );

  const signInOtp = useCallback(
    async (payload: VerifyOtpPayload) => {
      const response = await authClient.verifyOtp(payload);
      return setAuthenticatedSession(response);
    },
    [authClient, setAuthenticatedSession]
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authClient.register(payload);
      return response;
    },
    [authClient]
  );

  const confirmAccountEmail = useCallback(
    async (payload: AccountConfirmationPayload) => authClient.confirmAccountEmail(payload),
    [authClient]
  );

  const resendAccountConfirmation = useCallback(
    async (payload: AccountConfirmationResendPayload) => authClient.resendAccountConfirmation(payload),
    [authClient]
  );

  const signOut = useCallback(() => {
    authClient.logout();
    setUser(null);
    setAuthStatus('unauthenticated');
  }, [authClient]);

  const refreshToken = useCallback(async () => {
    const response = await authClient.refreshToken();
    return response.accessToken || null;
  }, [authClient]);

  const requestOtp = useCallback(
    async (payload: RequestOtpPayload) => authClient.requestOtp(payload),
    [authClient]
  );

  const requestPasswordReset = useCallback(
    async (payload: PasswordResetRequestPayload) => authClient.requestPasswordReset(payload),
    [authClient]
  );

  const confirmPasswordReset = useCallback(
    async (payload: PasswordResetConfirmPayload) => authClient.confirmPasswordReset(payload),
    [authClient]
  );

  const changePassword = useCallback(
    async (payload: PasswordChangePayload) => authClient.changePassword(payload),
    [authClient]
  );

  const getProfiles = useCallback(async () => authClient.getProfiles(), [authClient]);

  const switchProfile = useCallback(
    async (payload: SwitchProfilePayload) => {
      const response = await authClient.switchProfile(payload);
      return setAuthenticatedSession(response);
    },
    [authClient, setAuthenticatedSession]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const accessToken = authClient.getAccessToken();

      if (!isTokenValid(accessToken)) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const response = await authClient.getMe();
        if (!isMounted) return;
        setAuthenticatedSession(response);
      } catch {
        if (!isMounted) return;
        authClient.logout();
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [authClient, setAuthenticatedSession]);

  const contextValue = useMemo<JBAuthContextValue>(
    () => ({
      authStatus,
      isAuthenticated: authStatus === 'authenticated',
      user,
      signIn,
      signUp,
      confirmAccountEmail,
      resendAccountConfirmation,
      signInOtp,
      requestOtp,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
      getProfiles,
      switchProfile,
      signOut,
      refreshToken
    }),
    [
      authStatus,
      user,
      signIn,
      signUp,
      confirmAccountEmail,
      resendAccountConfirmation,
      signInOtp,
      requestOtp,
      requestPasswordReset,
      confirmPasswordReset,
      changePassword,
      getProfiles,
      switchProfile,
      signOut,
      refreshToken
    ]
  );

  return <JBAuthContext.Provider value={contextValue}>{children}</JBAuthContext.Provider>;
}

export function useJBAuth() {
  const context = useContext(JBAuthContext);
  if (!context) {
    throw new Error('useJBAuth must be used within JBAuthProvider');
  }
  return context;
}
