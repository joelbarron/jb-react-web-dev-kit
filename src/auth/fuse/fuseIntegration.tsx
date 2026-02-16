import React, { ReactNode, useMemo } from 'react';

import { AuthClient } from '../client';
import { createFuseJwtAuthProvider } from './fuseAdapter';

const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export type FuseUser = {
  id: string;
  role: string[] | string | null;
  displayName: string;
  photoURL?: string;
  email?: string;
  shortcuts?: string[];
  settings?: Record<string, unknown>;
  loginRedirectUrl?: string;
};

export const fuseAuthRoles = {
  admin: ['admin'],
  staff: ['admin', 'staff'],
  user: ['admin', 'staff', 'user'],
  onlyGuest: []
} as const;

export type FuseAuthRolesMap = Record<string, string[]>;

export function createFuseAuthRoles(customRoles?: FuseAuthRolesMap): FuseAuthRolesMap {
  const mergedRoles: FuseAuthRolesMap = Object.entries(fuseAuthRoles).reduce<FuseAuthRolesMap>(
    (accumulator, [roleKey, roleValues]) => {
      accumulator[roleKey] = [...roleValues];
      return accumulator;
    },
    {}
  );

  if (!customRoles) {
    return mergedRoles;
  }

  Object.entries(customRoles).forEach(([roleKey, roleValues]) => {
    const normalizedRoleValues = Array.from(new Set(roleValues ?? []));
    if (!mergedRoles[roleKey]) {
      mergedRoles[roleKey] = normalizedRoleValues;
      return;
    }

    mergedRoles[roleKey] = Array.from(new Set([...mergedRoles[roleKey], ...normalizedRoleValues]));
  });

  return mergedRoles;
}

export function createFuseUserModel<TUser extends FuseUser>() {
  return (data?: Partial<TUser>): TUser => {
    const userData = data || {};

    return ({
      id: null,
      role: null,
      displayName: null,
      photoURL: '',
      email: '',
      shortcuts: [],
      settings: {},
      loginRedirectUrl: '/',
      ...userData
    } as unknown) as TUser;
  };
}

type CreateFuseUseUserOptions<TUser extends FuseUser> = {
  useAuth: () => {
    authState: { user: TUser | null } | null;
    signOut: () => void;
    updateUser: (updates: Partial<TUser>) => Promise<Response>;
  };
  setIn: (obj: unknown, path: string, value: unknown) => unknown;
};

export function createFuseUseUser<TUser extends FuseUser>(options: CreateFuseUseUserOptions<TUser>) {
  const { useAuth, setIn } = options;

  return function useUser() {
    const { authState, signOut, updateUser } = useAuth();
    const user = authState?.user as TUser;
    const isGuest = useMemo(() => !user?.role || user?.role?.length === 0, [user]);

    async function handleUpdateUser(data: Partial<TUser>) {
      const response = await updateUser(data);

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = (await response.json()) as TUser;
      return updatedUser;
    }

    async function handleUpdateUserSettings(newSettings: TUser['settings']) {
      const newUser = setIn(user, 'settings', newSettings) as TUser;

      if (isEqual(user, newUser)) {
        return undefined;
      }

      const updatedUser = await handleUpdateUser(newUser);
      return updatedUser?.settings;
    }

    async function handleSignOut() {
      return signOut();
    }

    return {
      data: user,
      isGuest,
      signOut: handleSignOut,
      updateUser: handleUpdateUser,
      updateUserSettings: handleUpdateUserSettings
    };
  };
}

export function createWithUser<TProps extends object, TUserHookReturn>(
  useUserHook: () => TUserHookReturn
) {
  return function withUser(Component: React.ComponentType<TProps & TUserHookReturn>) {
    return function WrappedComponent(props: TProps) {
      const userProps = useUserHook();
      return (
        <Component
          {...props}
          {...userProps}
        />
      );
    };
  };
}

type CreateFuseAuthenticationOptions<TUser extends FuseUser> = {
  authClient: AuthClient;
  FuseAuthProvider: React.ComponentType<{
    providers: Array<{
      name: string;
      Provider: React.ComponentType<any> | React.ForwardRefExoticComponent<any>;
    }>;
    children: (authState: { user?: TUser | null } | null) => ReactNode;
  }>;
  FuseAuthorization: React.ComponentType<{
    userRole: TUser['role'] | undefined;
    children: ReactNode;
  }>;
  providerName?: string;
};

export function createFuseAuthentication<TUser extends FuseUser>(options: CreateFuseAuthenticationOptions<TUser>) {
  const { authClient, FuseAuthProvider, FuseAuthorization, providerName = 'jb-jwt' } = options;
  const JwtProvider = createFuseJwtAuthProvider(authClient);

  const providers = [
    {
      name: providerName,
      Provider: JwtProvider
    }
  ];

  return function Authentication(props: { children: ReactNode }) {
    const { children } = props;

    return (
      <FuseAuthProvider providers={providers}>
        {(authState) => {
          const userRole = authState?.user?.role as TUser['role'];
          return <FuseAuthorization userRole={userRole}>{children}</FuseAuthorization>;
        }}
      </FuseAuthProvider>
    );
  };
}
