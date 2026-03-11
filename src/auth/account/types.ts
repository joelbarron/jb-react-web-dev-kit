import { JBAuthProfileRoleOption, JBAuthRequiredProfileFields, JBAuthSocialConfig } from '../../config';
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
  allowDefaultProfileEdit?: boolean;
  allowProfilePictureChange?: boolean;
  requireBirthday?: boolean;
  requiredProfileFields?: Partial<JBAuthRequiredProfileFields>;
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
