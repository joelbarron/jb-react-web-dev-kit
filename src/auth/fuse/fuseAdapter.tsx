import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';

import { AuthClient } from '../client';
import {
  AccountConfirmationPayload,
  AccountConfirmationResendPayload,
  LoginSocialPrecheckResponse,
  LoginSocialPayload,
  PasswordChangePayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  RegisterPayload,
  RequestOtpPayload,
  VerifyOtpPayload
} from '../types';

type JsonRecord = Record<string, unknown>;

type FuseAuthState<TUser = JsonRecord> = {
  authStatus: 'configuring' | 'authenticated' | 'unauthenticated';
  isAuthenticated: boolean;
  user: TUser | null;
};

export type FuseJwtAuthContextType<TUser = JsonRecord> = FuseAuthState<TUser> & {
  signIn: (credentials: { login: string; password: string; username?: string }) => Promise<JsonRecord>;
  signInSocial: (payload: LoginSocialPayload) => Promise<JsonRecord>;
  signInSocialPrecheck: (payload: LoginSocialPayload) => Promise<LoginSocialPrecheckResponse>;
  requestOtp: (payload: RequestOtpPayload) => Promise<Record<string, unknown>>;
  signInOtp: (payload: VerifyOtpPayload) => Promise<JsonRecord>;
  signUp: (payload: RegisterPayload) => Promise<JsonRecord>;
  confirmAccountEmail: (payload: AccountConfirmationPayload) => Promise<Record<string, unknown>>;
  resendAccountConfirmation: (payload: AccountConfirmationResendPayload) => Promise<Record<string, unknown>>;
  requestPasswordReset: (payload: PasswordResetRequestPayload) => Promise<Record<string, unknown>>;
  confirmPasswordReset: (payload: PasswordResetConfirmPayload) => Promise<Record<string, unknown>>;
  changePassword: (payload: PasswordChangePayload) => Promise<Record<string, unknown>>;
  switchProfile: (profileId: number) => Promise<JsonRecord>;
  getProfiles: () => Promise<Record<string, unknown>[]>;
  signOut: () => void;
  refreshToken: () => Promise<string | null>;
};

type FuseAuthProviderComponentProps = {
  children?: ReactNode;
  onAuthStateChanged?: (state: FuseAuthState) => void;
  ref?: React.Ref<{
    signOut: () => void;
  }>;
};

const FuseJwtAuthContext = createContext<FuseJwtAuthContextType | undefined>(undefined);

const asRecord = (value: unknown) => (value ?? {}) as JsonRecord;

const isTokenValid = (token: string | null) => {
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

const normalizeUserShape = (userInput: unknown): JsonRecord => {
  const user = asRecord(userInput);
  const userData = asRecord(user.data);
  const displayName =
    (user.displayName as string) ||
    (userData.displayName as string) ||
    ([userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(' ') as string) ||
    'User';

  return {
    id: (user.id || user.user_id || user.pk || userData.id || userData.user_id || userData.pk || '0') as string,
    role: (user.role || user.roles || userData.role || userData.roles || ['admin']) as
      | string[]
      | string
      | null,
    displayName,
    photoURL: (user.photoURL || user.photoUrl || userData.photoURL || userData.photoUrl || '') as string,
    email: (user.email || userData.email || '') as string,
    shortcuts: ((user.shortcuts || userData.shortcuts || []) as string[]) || [],
    settings: (user.settings || userData.settings || {}) as Record<string, unknown>,
    loginRedirectUrl: (user.loginRedirectUrl || userData.loginRedirectUrl || '/') as string
  };
};

const getTokens = (data: JsonRecord) => {
  const tokens = asRecord(data.tokens);
  const accessToken = (data.access_token || tokens.accessToken || tokens.access_token || data.access) as
    | string
    | undefined;
  const refreshToken = (data.refresh_token || tokens.refreshToken || tokens.refresh_token || data.refresh || null) as
    | string
    | null;
  return { accessToken, refreshToken };
};

const normalizeSession = (response: unknown) => {
  const data = asRecord(response);
  const { accessToken, refreshToken } = getTokens(data);
  const user = normalizeUserShape(data.user);

  if (!accessToken) {
    throw new Error('Invalid auth response: missing access token');
  }

  return {
    user,
    accessToken,
    refreshToken
  };
};

export const createFuseJwtAuthProvider = (authClient: AuthClient) => {
  function FuseJwtAuthProvider(props: FuseAuthProviderComponentProps) {
    const { ref, children, onAuthStateChanged } = props;
    const [authState, setAuthState] = useState<FuseAuthState>({
      authStatus: 'configuring',
      isAuthenticated: false,
      user: null
    });

    useEffect(() => {
      if (onAuthStateChanged) {
        onAuthStateChanged(authState);
      }
    }, [authState, onAuthStateChanged]);

    const signOut = useCallback(() => {
      authClient.logout();
      setAuthState({
        authStatus: 'unauthenticated',
        isAuthenticated: false,
        user: null
      });
    }, []);

    const refreshToken = useCallback(async () => {
      try {
        const response = await authClient.refreshToken();
        return response.accessToken || null;
      } catch {
        return null;
      }
    }, []);

    useEffect(() => {
      let isMounted = true;

      const attemptAutoLogin = async () => {
        let token = authClient.getAccessToken();

        if (!isTokenValid(token)) {
          token = await refreshToken();
        }

        if (!isTokenValid(token)) {
          return false;
        }

        try {
          authClient.setAccessToken(token as string);
          const response = await authClient.getMe();
          return normalizeUserShape(response.user);
        } catch {
          return false;
        }
      };

      if (!authState.isAuthenticated) {
        attemptAutoLogin().then((userData) => {
          if (!isMounted) {
            return;
          }

          if (userData) {
            setAuthState({
              authStatus: 'authenticated',
              isAuthenticated: true,
              user: userData
            });
          } else {
            authClient.logout();
            setAuthState({
              authStatus: 'unauthenticated',
              isAuthenticated: false,
              user: null
            });
          }
        });
      }

      return () => {
        isMounted = false;
      };
    }, [authState.isAuthenticated, refreshToken]);

    const signIn: FuseJwtAuthContextType['signIn'] = useCallback(async (credentials) => {
      const session = normalizeSession(
        await authClient.loginBasic({
          login: credentials.login || credentials.username || '',
          password: credentials.password,
          client: 'web'
        })
      );
      setAuthState({
        authStatus: 'authenticated',
        isAuthenticated: true,
        user: session.user
      });
      return {
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        access_token: session.accessToken,
        refresh_token: session.refreshToken
      };
    }, []);

    const requestOtp: FuseJwtAuthContextType['requestOtp'] = useCallback(
      async (payload) => authClient.requestOtp(payload),
      []
    );

    const signInSocial: FuseJwtAuthContextType['signInSocial'] = useCallback(async (payload) => {
      const session = normalizeSession(
        await authClient.loginSocial({
          ...payload,
          client: payload.client ?? 'web'
        })
      );
      setAuthState({
        authStatus: 'authenticated',
        isAuthenticated: true,
        user: session.user
      });
      return {
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        access_token: session.accessToken,
        refresh_token: session.refreshToken
      };
    }, []);

    const signInSocialPrecheck: FuseJwtAuthContextType['signInSocialPrecheck'] = useCallback(
      async (payload) =>
        authClient.loginSocialPrecheck({
          ...payload,
          client: payload.client ?? 'web'
        }),
      []
    );

    const signInOtp: FuseJwtAuthContextType['signInOtp'] = useCallback(async (payload) => {
      const session = normalizeSession(
        await authClient.verifyOtp({
          ...payload,
          client: payload.client ?? 'web'
        })
      );
      setAuthState({
        authStatus: 'authenticated',
        isAuthenticated: true,
        user: session.user
      });
      return {
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        access_token: session.accessToken,
        refresh_token: session.refreshToken
      };
    }, []);

    const signUp: FuseJwtAuthContextType['signUp'] = useCallback(async (payload) => {
      const response = await authClient.register(payload);
      return response as JsonRecord;
    }, []);

    const requestPasswordReset: FuseJwtAuthContextType['requestPasswordReset'] = useCallback(
      async (payload) => authClient.requestPasswordReset(payload),
      []
    );

    const confirmAccountEmail: FuseJwtAuthContextType['confirmAccountEmail'] = useCallback(
      async (payload) => authClient.confirmAccountEmail(payload),
      []
    );

    const resendAccountConfirmation: FuseJwtAuthContextType['resendAccountConfirmation'] = useCallback(
      async (payload) => authClient.resendAccountConfirmation(payload),
      []
    );

    const confirmPasswordReset: FuseJwtAuthContextType['confirmPasswordReset'] = useCallback(
      async (payload) => authClient.confirmPasswordReset(payload),
      []
    );

    const changePassword: FuseJwtAuthContextType['changePassword'] = useCallback(
      async (payload) => authClient.changePassword(payload),
      []
    );

    const switchProfile: FuseJwtAuthContextType['switchProfile'] = useCallback(async (profileId: number) => {
      const session = normalizeSession(
        await authClient.switchProfile({
          profile: profileId,
          client: 'web'
        })
      );
      setAuthState({
        authStatus: 'authenticated',
        isAuthenticated: true,
        user: session.user
      });
      return {
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        access_token: session.accessToken,
        refresh_token: session.refreshToken
      };
    }, []);

    const getProfiles: FuseJwtAuthContextType['getProfiles'] = useCallback(async () => {
      const response = await authClient.getProfiles();
      if (Array.isArray(response)) {
        return response as Record<string, unknown>[];
      }
      return (response.results ?? []) as Record<string, unknown>[];
    }, []);

    const contextValue = useMemo<FuseJwtAuthContextType>(
      () => ({
        ...authState,
        signIn,
        signInSocial,
        signInSocialPrecheck,
        requestOtp,
        signInOtp,
        signUp,
        confirmAccountEmail,
        resendAccountConfirmation,
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
        switchProfile,
        getProfiles,
        signOut,
        refreshToken
      }),
      [
        authState,
        signIn,
        signInSocial,
        signInSocialPrecheck,
        requestOtp,
        signInOtp,
        signUp,
        confirmAccountEmail,
        resendAccountConfirmation,
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
        switchProfile,
        getProfiles,
        signOut,
        refreshToken
      ]
    );

    useImperativeHandle(ref, () => ({
      signOut
    }));

    return <FuseJwtAuthContext.Provider value={contextValue}>{children}</FuseJwtAuthContext.Provider>;
  }

  return FuseJwtAuthProvider;
};

export const useFuseJwtAuth = () => {
  const context = useContext(FuseJwtAuthContext);
  if (!context) {
    throw new Error('useFuseJwtAuth must be used within createFuseJwtAuthProvider provider');
  }
  return context;
};
