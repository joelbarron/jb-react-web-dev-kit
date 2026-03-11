import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { Alert, Box, CircularProgress, Stack, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ReactNode, SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router';

import { getAuthAccountConfig, getAuthProfileRoles, getAuthSocialConfig } from '../../config';
import { JBButton, JBConfirmDialog, JBContentContainer, JBFormHeader } from '../../core';
import { AuthAccountContactView } from './AuthAccountContactView';
import { AuthAccountProfileView } from './AuthAccountProfileView';
import { AuthAccountProfilesView } from './AuthAccountProfilesView';
import { AuthAccountSecurityView } from './AuthAccountSecurityView';
import { AuthAccountSocialView } from './AuthAccountSocialView';
import { AuthAccountSubscriptionView } from './AuthAccountSubscriptionView';
import { AuthAccountHeaderAction, AuthAccountHeaderActions, AuthAccountSectionKey, AuthAccountModuleViewProps } from './types';

type AccountTab = AuthAccountSectionKey;

const tabs: Array<{ value: AccountTab; label: string; icon: ReactNode }> = [
  { value: 'profile', label: 'Perfil', icon: <BadgeOutlinedIcon fontSize="small" /> },
  { value: 'account', label: 'Cuenta', icon: <AccountCircleOutlinedIcon fontSize="small" /> },
  { value: 'security', label: 'Seguridad y datos', icon: <LockOutlinedIcon fontSize="small" /> },
  { value: 'profiles', label: 'Perfiles', icon: <GroupsOutlinedIcon fontSize="small" /> },
  { value: 'social', label: 'Redes sociales', icon: <ShareOutlinedIcon fontSize="small" /> },
  { value: 'subscription', label: 'Suscripción', icon: <CreditCardOutlinedIcon fontSize="small" /> }
];

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const normalizeProfiles = (payload: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload.map((item) => asRecord(item));
  }
  const record = asRecord(payload);
  if (Array.isArray(record.results)) {
    return record.results.map((item) => asRecord(item));
  }
  return [];
};

const getProfileId = (profile: Record<string, unknown> | null): number | null => {
  if (!profile) {
    return null;
  }
  const rawId = Number(profile.id ?? 0);
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null;
};

const normalizeBasePath = (basePath?: string): string => {
  const rawValue = String(basePath ?? '/account').trim();
  const cleanPath = rawValue.replace(/\/+$/g, '').replace(/^\/+/g, '');
  return cleanPath ? `/${cleanPath}` : '/account';
};

export function AuthAccountModuleView(props: AuthAccountModuleViewProps) {
  const {
    authClient,
    jbWebConfig,
    basePath = '/account',
    tabParamName = 'tab',
    homePath = '/home',
    title = 'Mi cuenta',
    subtitle = 'Administra tu cuenta y seguridad',
    breadcrumb,
    headerIcon,
    showBackButton = true,
    syncDefaultProfile = true,
    renderLayout
  } = props;

  const navigate = useNavigate();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [headerActions, setHeaderActions] = useState<AuthAccountHeaderActions | null>(null);
  const [isEnsuringDefaultProfile, setIsEnsuringDefaultProfile] = useState(Boolean(syncDefaultProfile));
  const [defaultProfileGuardError, setDefaultProfileGuardError] = useState<string | null>(null);

  const normalizedBasePath = useMemo(() => normalizeBasePath(basePath), [basePath]);
  const accountConfig = useMemo(() => getAuthAccountConfig(jbWebConfig), [jbWebConfig]);
  const profileRoles = useMemo(() => getAuthProfileRoles(jbWebConfig), [jbWebConfig]);
  const socialConfig = useMemo(() => getAuthSocialConfig(jbWebConfig), [jbWebConfig]);
  const hasEnabledSocialProviders = useMemo(
    () => Object.values(socialConfig).some((providerConfig) => Boolean(providerConfig?.enabled)),
    [socialConfig]
  );

  const visibleTabs = useMemo(
    () =>
      tabs.filter((item) => {
        if (item.value === 'profiles' && !accountConfig.allowProfileManagement) {
          return false;
        }
        if (item.value === 'subscription' && !accountConfig.subscriptionUrl) {
          return false;
        }
        if (item.value === 'social' && !hasEnabledSocialProviders) {
          return false;
        }
        return true;
      }),
    [accountConfig.allowProfileManagement, accountConfig.subscriptionUrl, hasEnabledSocialProviders]
  );

  const rawTab = params[tabParamName];
  const activeTab: AccountTab = useMemo(() => {
    const candidate = String(rawTab || '').trim().toLowerCase() as AccountTab;
    if (visibleTabs.some((item) => item.value === candidate)) {
      return candidate;
    }
    return visibleTabs[0]?.value || 'profile';
  }, [rawTab, visibleTabs]);

  const buildTabPath = useCallback(
    (value: AccountTab) => `${normalizedBasePath}/${value}`,
    [normalizedBasePath]
  );

  useEffect(() => {
    if (!syncDefaultProfile) {
      setIsEnsuringDefaultProfile(false);
      setDefaultProfileGuardError(null);
      return undefined;
    }

    let isMounted = true;
    const ensureDefaultProfile = async () => {
      setIsEnsuringDefaultProfile(true);
      setDefaultProfileGuardError(null);

      try {
        const [mePayload, profilesPayload] = await Promise.all([authClient.getMe(), authClient.getProfiles()]);
        const meRecord = asRecord(mePayload);
        const activeProfile = asRecord(meRecord.active_profile ?? meRecord.activeProfile);
        const activeProfileId = getProfileId(activeProfile);
        const profiles = normalizeProfiles(profilesPayload);
        const defaultProfile = profiles.find((profile) => Boolean(profile.is_default ?? profile.isDefault)) ?? null;
        const defaultProfileId = getProfileId(defaultProfile);

        if (defaultProfileId && defaultProfileId !== activeProfileId) {
          await authClient.switchProfile({
            profile: defaultProfileId,
            client: 'web'
          });
          window.location.reload();
          return;
        }

        if (isMounted) {
          setIsEnsuringDefaultProfile(false);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setDefaultProfileGuardError(
          error instanceof Error
            ? error.message
            : 'No se pudo sincronizar el perfil predeterminado para administrar la cuenta.'
        );
        setIsEnsuringDefaultProfile(false);
      }
    };

    void ensureDefaultProfile();

    return () => {
      isMounted = false;
    };
  }, [authClient, syncDefaultProfile]);

  useEffect(() => {
    const expectedPath = buildTabPath(activeTab);
    const currentPath = `${normalizedBasePath}/${String(rawTab || '').trim().toLowerCase()}`;
    if (!rawTab || currentPath !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [activeTab, buildTabPath, navigate, normalizedBasePath, rawTab]);

  const handleTabChange = (_: SyntheticEvent, nextValue: AccountTab) => {
    navigate(buildTabPath(nextValue));
  };

  const handleUnsavedChangesChange = useCallback((nextHasUnsavedChanges: boolean) => {
    setHasUnsavedChanges(nextHasUnsavedChanges);
  }, []);

  const handleHeaderActionsChange = useCallback((nextActions: AuthAccountHeaderActions | null) => {
    setHeaderActions(nextActions);
  }, []);

  useEffect(() => {
    setHeaderActions(null);
  }, [activeTab]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!hasUnsavedChanges) {
      return false;
    }
    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash
    );
  });

  useBeforeUnload(
    (event) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    },
    { capture: true }
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setLeaveDialogOpen(true);
    }
  }, [blocker.state]);

  const handleCloseLeaveDialog = () => {
    setLeaveDialogOpen(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleConfirmLeave = () => {
    setLeaveDialogOpen(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const renderHeaderButton = (actionConfig: AuthAccountHeaderAction | undefined, key: string) => {
    if (!actionConfig) {
      return null;
    }

    return (
      <JBButton
        key={key}
        action={actionConfig.action ?? 'primary'}
        onClick={actionConfig.onClick}
        disabled={actionConfig.disabled}
      >
        {actionConfig.label}
      </JBButton>
    );
  };

  const rightContent = (
    <Stack direction="row" spacing={1} alignItems="center">
      {renderHeaderButton(headerActions?.secondary, 'secondary')}
      {renderHeaderButton(headerActions?.danger, 'danger')}
      {renderHeaderButton(headerActions?.primary, 'primary')}
    </Stack>
  );

  const header = (
    <JBFormHeader
      moduleConfig={{
        texts: {
          moduleName: 'Cuenta',
          formHeaderSubtitle: subtitle
        }
      }}
      title={title}
      breadcrumb={breadcrumb}
      icon={
        headerIcon ?? (
          <AccountCircleOutlinedIcon
            color="secondary"
            sx={{ fontSize: 44 }}
          />
        )
      }
      showBackButton={showBackButton}
      onBackClick={() => navigate(homePath)}
      rightContent={rightContent}
    />
  );

  const content = (
    <JBContentContainer
      stickyHeader
      header={
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {visibleTabs.map((item) => (
            <Tab
              key={item.value}
              value={item.value}
              label={
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  {item.icon}
                  <span>{item.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      }
    >
      {isEnsuringDefaultProfile ? (
        <Stack
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Sincronizando perfil predeterminado...
          </Typography>
        </Stack>
      ) : null}
      {!isEnsuringDefaultProfile && defaultProfileGuardError ? (
        <Stack spacing={2} sx={{ py: 2 }}>
          <Alert severity="error">{defaultProfileGuardError}</Alert>
          <Stack direction="row" spacing={1}>
            <JBButton
              action="secondary"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </JBButton>
            <JBButton
              action="cancel"
              onClick={() => navigate(homePath)}
            >
              Ir al inicio
            </JBButton>
          </Stack>
        </Stack>
      ) : null}
      {!isEnsuringDefaultProfile && !defaultProfileGuardError && activeTab === 'profile' ? (
        <AuthAccountProfileView
          authClient={authClient}
          allowDefaultProfileEdit={accountConfig.allowDefaultProfileEdit}
          allowProfilePictureChange={accountConfig.allowProfilePictureChange}
          requiredProfileFields={accountConfig.requiredProfileFields}
          onHeaderActionsChange={handleHeaderActionsChange}
          onUnsavedChangesChange={handleUnsavedChangesChange}
        />
      ) : null}
      {!isEnsuringDefaultProfile && !defaultProfileGuardError && activeTab === 'account' ? (
        <AuthAccountContactView
          authClient={authClient}
          enableContactVerification={accountConfig.enableContactVerification}
          allowAccountEdit={accountConfig.allowAccountEdit}
          onHeaderActionsChange={handleHeaderActionsChange}
          onUnsavedChangesChange={handleUnsavedChangesChange}
        />
      ) : null}
      {!isEnsuringDefaultProfile && !defaultProfileGuardError && activeTab === 'security' ? (
        <AuthAccountSecurityView
          authClient={authClient}
          allowDeleteAccount={accountConfig.allowDeleteAccount}
          onHeaderActionsChange={handleHeaderActionsChange}
          onUnsavedChangesChange={handleUnsavedChangesChange}
        />
      ) : null}
      {!isEnsuringDefaultProfile && !defaultProfileGuardError && activeTab === 'profiles' ? (
        <AuthAccountProfilesView
          authClient={authClient}
          allowProfileManagement={accountConfig.allowProfileManagement}
          profileRoles={profileRoles}
          requiredProfileFields={accountConfig.requiredProfileFields}
          onHeaderActionsChange={handleHeaderActionsChange}
          onUnsavedChangesChange={handleUnsavedChangesChange}
        />
      ) : null}
      {!isEnsuringDefaultProfile && !defaultProfileGuardError && activeTab === 'social' ? (
        <AuthAccountSocialView
          authClient={authClient}
          socialConfig={socialConfig}
        />
      ) : null}
      {!isEnsuringDefaultProfile && !defaultProfileGuardError && activeTab === 'subscription' ? (
        <AuthAccountSubscriptionView subscriptionUrl={accountConfig.subscriptionUrl} />
      ) : null}
    </JBContentContainer>
  );

  const resolvedLayout = renderLayout
    ? renderLayout({ header, content, isMobile })
    : (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width: '100%' }}>
        {header}
        <Box sx={{ flex: 1, minHeight: 0 }}>{content}</Box>
      </Box>
    );

  return (
    <>
      {resolvedLayout}
      <JBConfirmDialog
        open={leaveDialogOpen}
        title="Tienes cambios sin guardar"
        description="Si continúas, perderás los cambios que no se han guardado. ¿Deseas salir de esta sección?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        confirmColor="warning"
        onClose={handleCloseLeaveDialog}
        onConfirm={handleConfirmLeave}
      />
    </>
  );
}
