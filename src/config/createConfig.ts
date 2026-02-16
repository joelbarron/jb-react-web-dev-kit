import { defaultJBAppConfig } from './defaults';
import { deepMerge } from './merge';
import {
  JBApiHostConfig,
  JBAppConfig,
  JBAppConfigOverrides,
  JBAppStage,
  JBAppStageLowercase,
  JBAuthProfileRoleOption,
  JBAuthSocialConfig,
  JBSocialProviderName,
  JBStageValueMap
} from './types';

export const createJBWebConfig = (
  baseConfig?: JBAppConfigOverrides,
  overrides?: JBAppConfigOverrides
): JBAppConfig => {
  const withBase = deepMerge(defaultJBAppConfig as unknown as Record<string, unknown>, baseConfig as Record<string, unknown> | undefined);
  const resolvedConfig = deepMerge(withBase, overrides as Record<string, unknown> | undefined) as unknown as JBAppConfig;

  const signupRoles = (resolvedConfig.auth?.profileRoles ?? []).filter((role) => role.allowSignup === true);
  const defaultProfileRole = resolvedConfig.auth?.defaultProfileRole;

  if (defaultProfileRole) {
    const hasValidDefaultSignupRole = signupRoles.some((role) => role.value === defaultProfileRole);
    if (!hasValidDefaultSignupRole) {
      throw new Error(
        `[jb-web-config] auth.defaultProfileRole="${defaultProfileRole}" must exist in auth.profileRoles with allowSignup=true.`
      );
    }
  }

  const socialConfig = resolvedConfig.auth?.social;
  if (socialConfig) {
    (Object.keys(socialConfig) as JBSocialProviderName[]).forEach((providerName) => {
      const providerConfig = socialConfig[providerName];
      if (providerConfig?.enabled && !providerConfig.clientId?.trim()) {
        throw new Error(
          `[jb-web-config] auth.social.${providerName}.clientId is required when auth.social.${providerName}.enabled=true.`
        );
      }
    });
  }

  return resolvedConfig;
};

export const resolveApiHostByStage = (hostConfig: JBApiHostConfig, stage: JBAppStage): string => {
  return hostConfig[stage];
};

export const getStageValue = <T>(
  stageMap: JBStageValueMap<T> | undefined,
  stage: JBAppStage,
  fallback?: T
): T | undefined => {
  if (!stageMap) {
    return fallback;
  }

  const lowerStage = stage.toLowerCase() as JBAppStageLowercase;
  const value = stageMap[stage] ?? stageMap[lowerStage];
  return value ?? fallback;
};

export const getApiBaseUrl = (config: JBAppConfig): string => {
  return resolveApiHostByStage(config.api.host, config.stage);
};

export const getConfigStageValue = <T>(
  config: Pick<JBAppConfig, 'stage'>,
  stageMap: JBStageValueMap<T> | undefined,
  fallback?: T
): T | undefined => {
  return getStageValue(stageMap, config.stage, fallback);
};

export const createJBWebConfigFromEnv = (
  baseConfig?: JBAppConfigOverrides,
  env?: Record<string, string | undefined>
): JBAppConfig => {
  const runtimeEnv = env ?? {};
  const parseEnvList = (value?: string): string[] | undefined => {
    if (!value) {
      return undefined;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return undefined;
    }

    if (normalizedValue.startsWith('[') && normalizedValue.endsWith(']')) {
      try {
        const parsed = JSON.parse(normalizedValue);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter(Boolean);
        }
      } catch {
        // If JSON parsing fails, continue with comma-separated parsing.
      }
    }

    return normalizedValue
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const parseBooleanEnv = (value?: string): boolean | undefined => {
    if (typeof value === 'undefined') {
      return undefined;
    }
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  };
  const googleEnabled = parseBooleanEnv(runtimeEnv.VITE_AUTH_SOCIAL_GOOGLE_ENABLED);
  const facebookEnabled = parseBooleanEnv(runtimeEnv.VITE_AUTH_SOCIAL_FACEBOOK_ENABLED);
  const appleEnabled = parseBooleanEnv(runtimeEnv.VITE_AUTH_SOCIAL_APPLE_ENABLED);

  return createJBWebConfig(baseConfig, {
    debug: runtimeEnv.VITE_DEBUG === 'true' ? true : undefined,
    stage: runtimeEnv.VITE_STAGE as JBAppStage | undefined,
    integrations: {
      mapboxToken: runtimeEnv.VITE_MAPBOX_TOKEN
    },
    auth: {
      apiBasePath: runtimeEnv.VITE_AUTH_BASE_PATH,
      showDebugSocial: parseBooleanEnv(runtimeEnv.VITE_AUTH_SHOW_DEBUG_SOCIAL),
      social: {
        google: {
          ...(typeof googleEnabled === 'boolean' ? { enabled: googleEnabled } : {}),
          clientId: runtimeEnv.VITE_AUTH_SOCIAL_GOOGLE_CLIENT_ID,
          redirectUri: runtimeEnv.VITE_AUTH_SOCIAL_GOOGLE_REDIRECT_URI,
          scope: runtimeEnv.VITE_AUTH_SOCIAL_GOOGLE_SCOPE,
          scopes: parseEnvList(runtimeEnv.VITE_AUTH_SOCIAL_GOOGLE_SCOPES)
        },
        facebook: {
          ...(typeof facebookEnabled === 'boolean' ? { enabled: facebookEnabled } : {}),
          clientId: runtimeEnv.VITE_AUTH_SOCIAL_FACEBOOK_CLIENT_ID,
          redirectUri: runtimeEnv.VITE_AUTH_SOCIAL_FACEBOOK_REDIRECT_URI,
          scope: runtimeEnv.VITE_AUTH_SOCIAL_FACEBOOK_SCOPE,
          scopes: parseEnvList(runtimeEnv.VITE_AUTH_SOCIAL_FACEBOOK_SCOPES)
        },
        apple: {
          ...(typeof appleEnabled === 'boolean' ? { enabled: appleEnabled } : {}),
          clientId: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_CLIENT_ID,
          redirectUri: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_REDIRECT_URI,
          scope: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_SCOPE,
          scopes: parseEnvList(runtimeEnv.VITE_AUTH_SOCIAL_APPLE_SCOPES),
          usePopup: parseBooleanEnv(runtimeEnv.VITE_AUTH_SOCIAL_APPLE_USE_POPUP),
          responseMode: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_RESPONSE_MODE as
            | 'web_message'
            | 'form_post'
            | 'query'
            | 'fragment'
            | undefined,
          responseType: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_RESPONSE_TYPE as
            | 'code'
            | 'id_token'
            | 'code id_token'
            | undefined,
          state: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_STATE,
          nonce: runtimeEnv.VITE_AUTH_SOCIAL_APPLE_NONCE
        }
      }
    }
  });
};

export const getAuthBasePath = (config: JBAppConfig): string => {
  return config.auth?.apiBasePath || '/authentication';
};

export const getAuthProfileRoles = (config: JBAppConfig): JBAuthProfileRoleOption[] => {
  return config.auth?.profileRoles ?? [];
};

export const getAuthSignupProfileRoles = (config: JBAppConfig): JBAuthProfileRoleOption[] => {
  return getAuthProfileRoles(config).filter((role) => role.allowSignup);
};

export const getAuthDefaultProfileRole = (config: JBAppConfig): string | undefined => {
  return config.auth?.defaultProfileRole;
};

export const getAuthSocialConfig = (config: JBAppConfig): JBAuthSocialConfig => {
  return config.auth?.social ?? defaultJBAppConfig.auth.social;
};

export const getAuthShowDebugSocial = (config: JBAppConfig): boolean => {
  return config.auth?.showDebugSocial ?? defaultJBAppConfig.auth.showDebugSocial;
};
