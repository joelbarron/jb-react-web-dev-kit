import { ComponentType, ReactElement } from 'react';

import { JBAppConfig, getAuthAccountConfig, getAuthProfileRoles, getAuthSocialConfig } from '../../config';
import { AuthClient } from '../client';
import { AuthAccountContactView } from './AuthAccountContactView';
import { AuthAccountProfileView } from './AuthAccountProfileView';
import { AuthAccountProfilesView } from './AuthAccountProfilesView';
import { AuthAccountSecurityView } from './AuthAccountSecurityView';
import { AuthAccountSocialView } from './AuthAccountSocialView';
import { AuthAccountSubscriptionView } from './AuthAccountSubscriptionView';

export type AccountRouteKey = 'profile' | 'account' | 'security' | 'profiles' | 'social' | 'subscription';

export type AccountRouteItem<TMeta extends Record<string, unknown> = Record<string, unknown>> = {
  path: string;
  element: ReactElement;
} & TMeta;

export type CreateAccountRoutesOptions<TMeta extends Record<string, unknown> = Record<string, unknown>> = {
  authClient: AuthClient;
  jbWebConfig?: JBAppConfig;
  basePath?: string;
  pages?: Partial<Record<AccountRouteKey, ComponentType>>;
  routeMeta?: Partial<Record<AccountRouteKey, TMeta>>;
  paths?: Partial<Record<AccountRouteKey, string>>;
};

const defaultPaths: Record<AccountRouteKey, string> = {
  profile: '',
  account: 'account',
  security: 'security',
  profiles: 'profiles',
  social: 'social',
  subscription: 'subscription'
};

const normalizePath = (basePath: string | undefined, routePath: string) => {
  const cleanBasePath = (basePath ?? '').replace(/^\/+|\/+$/g, '');
  const cleanRoutePath = routePath.replace(/^\/+|\/+$/g, '');

  if (!cleanBasePath) {
    return cleanRoutePath;
  }
  if (!cleanRoutePath) {
    return cleanBasePath;
  }
  return `${cleanBasePath}/${cleanRoutePath}`;
};

export function createAuthenticatedAccountRoutes<
  TMeta extends Record<string, unknown> = Record<string, unknown>
>(options: CreateAccountRoutesOptions<TMeta>): Array<AccountRouteItem<TMeta>> {
  const {
    authClient,
    jbWebConfig,
    basePath = 'account',
    pages,
    routeMeta,
    paths
  } = options;

  const accountConfig = jbWebConfig ? getAuthAccountConfig(jbWebConfig) : undefined;
  const profileRoles = jbWebConfig ? getAuthProfileRoles(jbWebConfig) : [];
  const socialConfig = jbWebConfig ? getAuthSocialConfig(jbWebConfig) : undefined;
  const resolvedPaths = { ...defaultPaths, ...(paths ?? {}) };

  const autoPages: Record<AccountRouteKey, ComponentType> = {
    profile: () => (
      <AuthAccountProfileView
        authClient={authClient}
        allowDefaultProfileEdit={accountConfig?.allowDefaultProfileEdit}
        allowProfilePictureChange={accountConfig?.allowProfilePictureChange}
        requireBirthday={accountConfig?.requireProfileBirthday}
        requiredProfileFields={accountConfig?.requiredProfileFields}
      />
    ),
    account: () => (
      <AuthAccountContactView
        authClient={authClient}
        enableContactVerification={accountConfig?.enableContactVerification}
        allowAccountEdit={accountConfig?.allowAccountEdit}
      />
    ),
    security: () => (
      <AuthAccountSecurityView
        authClient={authClient}
        allowDeleteAccount={accountConfig?.allowDeleteAccount}
      />
    ),
    profiles: () => (
      <AuthAccountProfilesView
        authClient={authClient}
        allowProfileManagement={accountConfig?.allowProfileManagement}
        profileRoles={profileRoles}
        requiredProfileFields={accountConfig?.requiredProfileFields}
      />
    ),
    social: () => (
      <AuthAccountSocialView
        authClient={authClient}
        socialConfig={socialConfig}
      />
    ),
    subscription: () => <AuthAccountSubscriptionView subscriptionUrl={accountConfig?.subscriptionUrl} />
  };

  const resolvedPages = {
    ...autoPages,
    ...(pages ?? {})
  };

  return (Object.keys(resolvedPaths) as AccountRouteKey[])
    .filter((routeKey) => Boolean(resolvedPages[routeKey]))
    .map((routeKey) => {
      const Page = resolvedPages[routeKey] as ComponentType;
      return {
        path: normalizePath(basePath, resolvedPaths[routeKey]),
        element: <Page />,
        ...(routeMeta?.[routeKey] ?? ({} as TMeta))
      };
    });
}
