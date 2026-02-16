import { LoginSocialPayload, SocialProvider } from '../types';

type SocialProviderClientConfig = {
  clientId: string;
  redirectUri?: string;
  scope?: string;
  scopes?: string[];
  usePopup?: boolean;
  responseMode?: 'web_message' | 'form_post' | 'query' | 'fragment';
  responseType?: 'code' | 'id_token' | 'code id_token';
  state?: string;
  nonce?: string;
  debug?: boolean;
};

type GoogleCodeResponse = {
  code?: string;
  error?: string;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptMomentNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
};

type AppleSignInResponse = {
  authorization?: {
    code?: string;
    grant_code?: string;
    grantCode?: string;
    authorizationCode?: string;
    id_token?: string;
    idToken?: string;
    scope?: string | string[];
  };
};

type FacebookLoginResponse = {
  authResponse?: {
    accessToken?: string;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void;
          cancel: () => void;
        };
        oauth2?: {
          initCodeClient: (options: {
            client_id: string;
            scope: string;
            redirect_uri?: string;
            ux_mode: 'popup';
            callback: (response: GoogleCodeResponse) => void;
          }) => { requestCode: () => void };
        };
      };
    };
    AppleID?: {
      auth: {
        init: (options: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
          responseMode?: 'web_message' | 'form_post' | 'query' | 'fragment';
          responseType?: 'code' | 'id_token' | 'code id_token';
          state?: string;
          nonce?: string;
        }) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
    FB?: {
      init: (options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: {
          scope?: string;
          display?: 'popup' | 'touch' | 'page';
        }
      ) => void;
    };
  }
}

const scriptLoaders = new Map<string, Promise<void>>();

const loadScript = (src: string): Promise<void> => {
  const existing = scriptLoaders.get(src);
  if (existing) {
    return existing;
  }

  const loader = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('Social auth is only available in browser environments.'));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  scriptLoaders.set(src, loader);
  return loader;
};

const ensureGoogleSdk = async () => {
  await loadScript('https://accounts.google.com/gsi/client');

  if (!window.google?.accounts?.id?.initialize) {
    throw new Error('Google SDK is not available.');
  }
};

const ensureAppleSdk = async () => {
  await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');

  if (!window.AppleID?.auth) {
    throw new Error('Apple SDK is not available.');
  }
};

const ensureFacebookSdk = async (clientId: string) => {
  await loadScript('https://connect.facebook.net/en_US/sdk.js');

  if (!window.FB?.init) {
    throw new Error('Facebook SDK is not available.');
  }

  window.FB.init({
    appId: clientId,
    cookie: true,
    xfbml: false,
    version: 'v20.0'
  });
};

const isLikelyMobileBrowser = () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  const hasTouch = (navigator.maxTouchPoints ?? 0) > 0;
  const hasCoarsePointer = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
  const smallViewport = typeof window.innerWidth === 'number' ? window.innerWidth <= 1024 : false;
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(userAgent);
  const isIpadOsDesktopMode = /Macintosh/i.test(userAgent) && hasTouch;

  return isMobileUserAgent || isIpadOsDesktopMode || ((hasTouch || hasCoarsePointer) && smallViewport);
};

const logSocialDebug = (enabled: boolean | undefined, message: string, payload?: unknown) => {
  if (!enabled) {
    return;
  }
  if (typeof payload === 'undefined') {
    console.info(`[jb-auth][social] ${message}`);
    return;
  }
  console.info(`[jb-auth][social] ${message}`, payload);
};

const authenticateWithGoogle = async (
  config: SocialProviderClientConfig
): Promise<Pick<LoginSocialPayload, 'provider' | 'idToken' | 'clientId'>> => {
  logSocialDebug(config.debug, 'google provider auth start', {
    clientId: config.clientId
  });
  await ensureGoogleSdk();

  const response = await new Promise<GoogleCredentialResponse>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(new Error('Google authentication timeout.'));
    }, 30000);

    window.google!.accounts!.id!.initialize({
      client_id: config.clientId,
      callback: (credentialResponse) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(credentialResponse);
      }
    });

    window.google!.accounts!.id!.cancel();
    window.google!.accounts!.id!.prompt((notification) => {
      if (settled) {
        return;
      }

      const isNotDisplayed = notification?.isNotDisplayed?.() ?? false;
      const isSkipped = notification?.isSkippedMoment?.() ?? false;
      const isDismissed = notification?.isDismissedMoment?.() ?? false;

      if (!isNotDisplayed && !isSkipped && !isDismissed) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      const reason =
        notification?.getNotDisplayedReason?.() ||
        notification?.getSkippedReason?.() ||
        notification?.getDismissedReason?.() ||
        'Google sign-in cancelled';
      reject(new Error(`Google authentication was not completed: ${reason}`));
    });
  });

  if (!response.credential) {
    throw new Error('Google authentication failed.');
  }

  return {
    provider: 'google',
    idToken: response.credential,
    clientId: config.clientId
  };
};

const authenticateWithApple = async (
  config: SocialProviderClientConfig
): Promise<Pick<LoginSocialPayload, 'provider' | 'authorizationCode' | 'idToken' | 'redirectUri' | 'clientId'>> => {
  logSocialDebug(config.debug, 'apple provider auth start', {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    usePopup: config.usePopup,
    responseMode: config.responseMode,
    responseType: config.responseType
  });
  await ensureAppleSdk();

  const usePopup = config.usePopup ?? true;
  const resolvedScope = config.scope ?? config.scopes?.join(' ') ?? 'name email';
  const resolvedRedirectUri = config.redirectUri || window.location.origin;
  const resolvedResponseMode = config.responseMode ?? (usePopup ? 'web_message' : 'form_post');
  const resolvedResponseType = config.responseType ?? (usePopup ? 'code id_token' : 'code');

  window.AppleID!.auth.init({
    clientId: config.clientId,
    scope: resolvedScope,
    redirectURI: resolvedRedirectUri,
    usePopup,
    responseMode: resolvedResponseMode,
    responseType: resolvedResponseType,
    state: config.state,
    nonce: config.nonce
  });

  const response = await window.AppleID!.auth.signIn();
  const authorizationCode =
    response.authorization?.code ??
    response.authorization?.grant_code ??
    response.authorization?.grantCode ??
    response.authorization?.authorizationCode;
  const idToken = response.authorization?.id_token ?? response.authorization?.idToken;

  if (!authorizationCode && !idToken) {
    throw new Error('Apple authentication failed.');
  }

  return {
    provider: 'apple',
    authorizationCode,
    idToken,
    redirectUri: resolvedRedirectUri,
    clientId: config.clientId
  };
};

const authenticateWithFacebook = async (
  config: SocialProviderClientConfig
): Promise<Pick<LoginSocialPayload, 'provider' | 'accessToken' | 'clientId'>> => {
  const mobileBrowser = isLikelyMobileBrowser();
  const shouldUsePopup = config.usePopup ?? !mobileBrowser;
  const resolvedDisplay: 'popup' | 'touch' | 'page' = shouldUsePopup
    ? 'popup'
    : mobileBrowser
      ? 'touch'
      : 'page';

  logSocialDebug(config.debug, 'facebook provider auth start', {
    clientId: config.clientId,
    display: resolvedDisplay,
    usePopup: shouldUsePopup
  });
  await ensureFacebookSdk(config.clientId);

  const response = await new Promise<FacebookLoginResponse>((resolve) => {
    window.FB!.login(resolve, {
      scope: config.scope ?? 'email,public_profile',
      display: resolvedDisplay
    });
  });

  const accessToken = response.authResponse?.accessToken;
  if (!accessToken) {
    throw new Error('Facebook authentication failed.');
  }

  return {
    provider: 'facebook',
    accessToken,
    clientId: config.clientId
  };
};

export const authenticateWithSocialProvider = async (
  provider: SocialProvider,
  config: SocialProviderClientConfig
): Promise<Pick<LoginSocialPayload, 'provider' | 'authorizationCode' | 'idToken' | 'accessToken' | 'redirectUri' | 'clientId'>> => {
  if (!config.clientId?.trim()) {
    throw new Error(`Missing social clientId for provider "${provider}".`);
  }

  if (provider === 'google') {
    return authenticateWithGoogle(config);
  }

  if (provider === 'facebook') {
    return authenticateWithFacebook(config);
  }

  return authenticateWithApple(config);
};
