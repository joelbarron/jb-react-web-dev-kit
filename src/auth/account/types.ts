import { ReactNode } from 'react';

import { JBAppConfig, JBAuthProfileRoleOption, JBAuthRequiredProfileFields, JBAuthSocialConfig } from '../../config';
import { AuthClient } from '../client';

export type AuthAccountSectionKey = 'profile' | 'account' | 'security' | 'profiles' | 'social' | 'subscription';

export type AuthAccountCommonViewProps = {
  authClient: AuthClient;
};

export type AuthAccountHeaderAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  action?: 'primary' | 'secondary' | 'save' | 'edit' | 'cancel' | 'delete';
  icon?: string;
};

export type AuthAccountHeaderActions = {
  primary?: AuthAccountHeaderAction;
  secondary?: AuthAccountHeaderAction;
  danger?: AuthAccountHeaderAction;
};

export type AuthAccountHeaderActionsChange = (actions: AuthAccountHeaderActions | null) => void;
export type AuthAccountUnsavedChangesChange = (hasUnsavedChanges: boolean) => void;

export type AuthAccountProfileViewProps = AuthAccountCommonViewProps & {
  onHeaderActionsChange?: AuthAccountHeaderActionsChange;
  onUnsavedChangesChange?: AuthAccountUnsavedChangesChange;
  onSaveSuccess?: () => void;
  allowDefaultProfileEdit?: boolean;
  allowProfilePictureChange?: boolean;
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>;
  forceEditMode?: boolean;
};

export type AuthAccountContactViewProps = AuthAccountCommonViewProps & {
  enableContactVerification?: boolean;
  allowAccountEdit?: boolean;
  onHeaderActionsChange?: AuthAccountHeaderActionsChange;
  onUnsavedChangesChange?: AuthAccountUnsavedChangesChange;
};

export type AuthAccountSecurityViewProps = AuthAccountCommonViewProps & {
  allowDeleteAccount?: boolean;
  onHeaderActionsChange?: AuthAccountHeaderActionsChange;
  onUnsavedChangesChange?: AuthAccountUnsavedChangesChange;
};

export type AuthAccountProfilesViewProps = AuthAccountCommonViewProps & {
  allowProfileManagement?: boolean;
  profileRoles?: JBAuthProfileRoleOption[];
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>;
  onHeaderActionsChange?: AuthAccountHeaderActionsChange;
  onUnsavedChangesChange?: AuthAccountUnsavedChangesChange;
};

export type AuthAccountSocialViewProps = AuthAccountCommonViewProps & {
  socialConfig?: JBAuthSocialConfig;
};

export type AuthAccountSubscriptionViewProps = {
  subscriptionUrl?: string;
};

export type AuthAccountModuleLayoutArgs = {
  header: ReactNode;
  content: ReactNode;
  isMobile: boolean;
};

export type AuthAccountProfileCompletionPageViewProps = {
  authClient: AuthClient;
  jbWebConfig?: JBAppConfig;
  title?: string;
  subtitle?: string;
  homePath?: string;
  breadcrumb?: ReactNode;
  headerIcon?: ReactNode;
  showBackButton?: boolean;
  renderLayout?: (args: AuthAccountModuleLayoutArgs) => ReactNode;
};

export type AuthAccountModuleViewProps = {
  authClient: AuthClient;
  jbWebConfig: JBAppConfig;
  basePath?: string;
  tabParamName?: string;
  homePath?: string;
  title?: string;
  subtitle?: string;
  breadcrumb?: ReactNode;
  headerIcon?: ReactNode;
  showBackButton?: boolean;
  syncDefaultProfile?: boolean;
  renderLayout?: (args: AuthAccountModuleLayoutArgs) => ReactNode;
};
