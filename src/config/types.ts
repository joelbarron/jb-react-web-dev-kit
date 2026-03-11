export type JBAppStage = 'PRODUCTION' | 'QA' | 'DEVELOPMENT' | 'LOCAL';
export type JBAppStageLowercase = Lowercase<JBAppStage>;
export type JBStageValueMap<T> = Partial<Record<JBAppStage, T>> & Partial<Record<JBAppStageLowercase, T>>;

export type JBApiHostConfig = Record<JBAppStage, string>;

export type JBAuthProfileRoleOption = {
  value: string;
  label: string;
  allowSignup?: boolean;
};

export type JBAuthProfileFieldKey =
  | 'first_name'
  | 'last_name_1'
  | 'last_name_2'
  | 'birthday'
  | 'gender'
  | 'label';

export type JBAuthRequiredProfileFields = Record<JBAuthProfileFieldKey, boolean>;

export type JBSocialProviderName = 'google' | 'facebook' | 'apple';

export type JBAuthSocialProviderConfig = {
  enabled: boolean;
  clientId?: string;
  redirectUri?: string;
  scope?: string;
  scopes?: string[];
  usePopup?: boolean;
  responseMode?: 'web_message' | 'form_post' | 'query' | 'fragment';
  responseType?: 'code' | 'id_token' | 'code id_token';
  state?: string;
  nonce?: string;
};

export type JBAuthSocialConfig = Record<JBSocialProviderName, JBAuthSocialProviderConfig>;

export type JBAuthAccountConfig = {
  allowProfileManagement: boolean;
  enableContactVerification: boolean;
  allowDeleteAccount: boolean;
  allowAccountEdit: boolean;
  allowDefaultProfileEdit: boolean;
  allowProfilePictureChange: boolean;
  requireProfileBirthday: boolean;
  requiredProfileFields: JBAuthRequiredProfileFields;
  subscriptionUrl?: string;
};

export type JBAppConfig = {
  debug: boolean;
  forceHideStage: boolean;
  stage: JBAppStage;
  defaultRows: number;
  maxRows: number;
  momentLocale: string;
  defaultLocaleDate: string;
  dateFormat: string;
  dateTimeFormat: string;
  defaultFormatDateAPI: string;
  api: {
    version: string;
    host: JBApiHostConfig;
  };
  auth: {
    apiBasePath: string;
    showDebugSocial: boolean;
    enableOtpAuth: boolean;
    profileRoles: JBAuthProfileRoleOption[];
    defaultProfileRole?: string;
    social: JBAuthSocialConfig;
    account: JBAuthAccountConfig;
  };
  integrations: Record<string, unknown>;
};

type JBDeepPartial<T> = T extends Array<infer U>
  ? Array<JBDeepPartial<U>>
  : T extends object
    ? { [K in keyof T]?: JBDeepPartial<T[K]> }
    : T;

export type JBAppConfigOverrides = JBDeepPartial<JBAppConfig>;
