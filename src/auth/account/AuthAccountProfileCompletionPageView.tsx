import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Alert, Box, CircularProgress, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { defaultJBAppConfig, getAuthAccountConfig } from '../../config';
import { JBButton, JBContentContainer, JBFormHeader } from '../../core';
import { AuthAccountProfileView } from './AuthAccountProfileView';
import { resolveDefaultProfileCompletionStatus } from './profileCompletion';
import { AuthAccountHeaderAction, AuthAccountHeaderActions } from './types';
import { AuthAccountProfileCompletionPageViewProps } from './types';

export function AuthAccountProfileCompletionPageView(
  props: AuthAccountProfileCompletionPageViewProps
) {
  const {
    authClient,
    jbWebConfig,
    title = 'Completar perfil',
    subtitle = 'Completa los datos requeridos para continuar',
    homePath = '/home',
    breadcrumb,
    headerIcon,
    showBackButton = true,
    renderLayout
  } = props;

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [headerActions, setHeaderActions] = useState<AuthAccountHeaderActions | null>(null);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
  const [completionCheckError, setCompletionCheckError] = useState<string | null>(null);
  const accountConfig = useMemo(
    () => getAuthAccountConfig(jbWebConfig ?? defaultJBAppConfig),
    [jbWebConfig]
  );
  const handleProfileSaveSuccess = useCallback(() => {
    navigate(homePath, { replace: true });
  }, [homePath, navigate]);

  useEffect(() => {
    let isMounted = true;
    const loadCompletionStatus = async () => {
      setIsCheckingCompletion(true);
      setCompletionCheckError(null);
      try {
        const status = await resolveDefaultProfileCompletionStatus(
          authClient,
          accountConfig.requiredProfileFields
        );
        if (!isMounted) {
          return;
        }
        setIsAlreadyComplete(status.isComplete);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setIsAlreadyComplete(false);
        setCompletionCheckError(
          error instanceof Error
            ? error.message
            : 'No se pudo validar si el perfil ya estaba completo.'
        );
      } finally {
        if (isMounted) {
          setIsCheckingCompletion(false);
        }
      }
    };

    void loadCompletionStatus();
    return () => {
      isMounted = false;
    };
  }, [accountConfig.requiredProfileFields, authClient]);

  useEffect(() => {
    if (isCheckingCompletion || isAlreadyComplete) {
      setHeaderActions(null);
    }
  }, [isAlreadyComplete, isCheckingCompletion]);

  const renderHeaderActionButton = (actionConfig: AuthAccountHeaderAction | undefined, key: string) => {
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
      rightContent={(
        <Stack direction="row" spacing={1} alignItems="center">
          {renderHeaderActionButton(headerActions?.secondary, 'secondary')}
          {renderHeaderActionButton(headerActions?.danger, 'danger')}
          {renderHeaderActionButton(headerActions?.primary, 'primary')}
        </Stack>
      )}
    />
  );

  const content = (
    <JBContentContainer>
      {isCheckingCompletion ? (
        <Stack
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 10 }}
        >
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Validando estado de tu perfil...
          </Typography>
        </Stack>
      ) : null}
      {!isCheckingCompletion && isAlreadyComplete ? (
        <Stack
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 10 }}
        >
          <TaskAltOutlinedIcon color="success" sx={{ fontSize: 48 }} />
          <Typography variant="h6">Tu perfil ya está completo</Typography>
          <Typography variant="body2" color="text.secondary">
            Ya puedes continuar al inicio para usar la plataforma.
          </Typography>
          <JBButton
            action="primary"
            onClick={() => navigate(homePath, { replace: true })}
          >
            Comenzar
          </JBButton>
        </Stack>
      ) : null}
      {!isCheckingCompletion && !isAlreadyComplete ? (
        <Stack spacing={2}>
          <Alert icon={<FactCheckOutlinedIcon fontSize="inherit" />} severity="info">
            Completa y guarda los campos obligatorios del perfil para continuar.
          </Alert>
          {completionCheckError ? (
            <Alert severity="warning">{completionCheckError}</Alert>
          ) : null}
          <AuthAccountProfileView
            authClient={authClient}
            allowDefaultProfileEdit={accountConfig.allowDefaultProfileEdit || accountConfig.ensureProfileCompletion}
            allowProfilePictureChange={accountConfig.allowProfilePictureChange}
            requiredProfileFields={accountConfig.requiredProfileFields}
            forceEditMode
            onHeaderActionsChange={setHeaderActions}
            onSaveSuccess={handleProfileSaveSuccess}
          />
        </Stack>
      ) : null}
    </JBContentContainer>
  );

  if (renderLayout) {
    return <>{renderLayout({ header, content, isMobile })}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%', width: '100%' }}>
      {header}
      <Box sx={{ flex: 1, minHeight: 0 }}>{content}</Box>
    </Box>
  );
}
