import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AppleIcon from '@mui/icons-material/Apple';
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { JBButton } from '../../core';
import { authenticateWithSocialProvider } from '../social/providerAuth';
import { SocialProvider } from '../types';
import { AccountFeedbackSnackbars } from './AccountFeedbackSnackbars';
import { AuthAccountSocialViewProps } from './types';
import { asRecord, pickString } from './utils';

type ProviderDescriptor = {
  provider: SocialProvider;
  label: string;
  icon: ReactNode;
  avatarBackgroundColor: string;
  avatarIconColor: string;
};

const PROVIDERS: ProviderDescriptor[] = [
  {
    provider: 'google',
    label: 'Google',
    icon: <GoogleIcon fontSize="small" />,
    avatarBackgroundColor: '#FFF3E0',
    avatarIconColor: '#DB4437'
  },
  {
    provider: 'facebook',
    label: 'Facebook',
    icon: <FacebookIcon fontSize="small" />,
    avatarBackgroundColor: '#E3F2FD',
    avatarIconColor: '#1877F2'
  },
  {
    provider: 'apple',
    label: 'Apple',
    icon: <AppleIcon fontSize="small" />,
    avatarBackgroundColor: '#ECEFF1',
    avatarIconColor: '#111827'
  }
];

const normalizeSocialAccounts = (payload: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(payload)) {
    return payload.map((entry) => asRecord(entry));
  }
  const record = asRecord(payload);
  if (Array.isArray(record.results)) {
    return record.results.map((entry) => asRecord(entry));
  }
  return [];
};

export function AuthAccountSocialView(props: AuthAccountSocialViewProps) {
  const { authClient, socialConfig } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [socialAccounts, setSocialAccounts] = useState<Array<Record<string, unknown>>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);

  const refreshSocialAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await authClient.getAccountSocialAccounts();
      setSocialAccounts(normalizeSocialAccounts(payload));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las redes vinculadas.');
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  useEffect(() => {
    void refreshSocialAccounts();
  }, [refreshSocialAccounts]);

  const accountsByProvider = useMemo(() => {
    const nextMap = new Map<string, Record<string, unknown>>();
    socialAccounts.forEach((entry) => {
      const provider = pickString(entry, ['provider']).toLowerCase();
      if (!provider) {
        return;
      }
      nextMap.set(provider, entry);
    });
    return nextMap;
  }, [socialAccounts]);

  const visibleProviders = useMemo(() => {
    return PROVIDERS.filter((providerEntry) => {
      const isConfiguredEnabled = Boolean(socialConfig?.[providerEntry.provider]?.enabled);
      const isAlreadyLinked = accountsByProvider.has(providerEntry.provider);
      return isConfiguredEnabled || isAlreadyLinked;
    });
  }, [accountsByProvider, socialConfig]);

  const onLink = async (provider: SocialProvider) => {
    const providerConfig = socialConfig?.[provider];
    if (!providerConfig?.enabled || !providerConfig.clientId) {
      setErrorMessage(`No hay configuración disponible para vincular ${provider}.`);
      return;
    }

    try {
      setPendingProvider(provider);
      setErrorMessage(null);
      setSuccessMessage(null);
      const authPayload = await authenticateWithSocialProvider(provider, {
        clientId: providerConfig.clientId,
        redirectUri: providerConfig.redirectUri,
        scope: providerConfig.scope,
        scopes: providerConfig.scopes,
        usePopup: providerConfig.usePopup,
        responseMode: providerConfig.responseMode,
        responseType: providerConfig.responseType,
        state: providerConfig.state,
        nonce: providerConfig.nonce
      });

      await authClient.linkSocial({
        provider,
        idToken: authPayload.idToken,
        accessToken: authPayload.accessToken,
        authorizationCode: authPayload.authorizationCode,
        redirectUri: authPayload.redirectUri,
        clientId: authPayload.clientId
      });
      setSuccessMessage(`${provider} vinculado correctamente.`);
      await refreshSocialAccounts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `No se pudo vincular ${provider}.`);
    } finally {
      setPendingProvider(null);
    }
  };

  const onUnlink = async (provider: SocialProvider) => {
    if (!window.confirm(`¿Desvincular ${provider}?`)) {
      return;
    }
    try {
      setPendingProvider(provider);
      setErrorMessage(null);
      setSuccessMessage(null);
      await authClient.unlinkSocial({ provider });
      setSuccessMessage(`${provider} desvinculado correctamente.`);
      await refreshSocialAccounts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `No se pudo desvincular ${provider}.`);
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <Stack spacing={3}>
      {isLoading ? (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Stack spacing={2}>
          {!visibleProviders.length ? (
            <Alert severity="info">
              No hay proveedores sociales habilitados para vinculación en esta implementación.
            </Alert>
          ) : null}
          {visibleProviders.map((providerEntry) => {
            const linkedAccount = accountsByProvider.get(providerEntry.provider);
            const isLinked = Boolean(linkedAccount);
            const pending = pendingProvider === providerEntry.provider;
            const isEnabled = Boolean(socialConfig?.[providerEntry.provider]?.enabled);
            const accountEmail = linkedAccount ? pickString(linkedAccount, ['email']) : '';
            const linkedAt = linkedAccount ? pickString(linkedAccount, ['linked_at', 'linkedAt']) : '';
            return (
              <Card
                key={providerEntry.provider}
                variant="outlined"
                sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center">
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: providerEntry.avatarBackgroundColor,
                            color: providerEntry.avatarIconColor
                          }}
                        >
                          {providerEntry.icon}
                        </Avatar>
                        <Typography variant="subtitle1">{providerEntry.label}</Typography>
                      </Stack>
                      <Chip
                        size="small"
                        color={isLinked ? 'success' : 'default'}
                        label={isLinked ? 'Vinculada' : 'No vinculada'}
                      />
                    </Stack>
                    {isLinked ? (
                      <Stack spacing={0.5}>
                        <Typography
                          variant="body2"
                          color="text.secondary">
                          Correo: {accountEmail || 'N/D'}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary">
                          Vinculada: {linkedAt || 'N/D'}
                        </Typography>
                        {!isEnabled ? (
                          <Typography variant="caption" color="warning.main">
                            Este proveedor está deshabilitado para nuevas vinculaciones.
                          </Typography>
                        ) : null}
                      </Stack>
                    ) : null}
                    <Stack
                      direction="row"
                      justifyContent="flex-end">
                      {isLinked ? (
                        <JBButton
                          action="delete"
                          size="small"
                          onClick={() => {
                            void onUnlink(providerEntry.provider);
                          }}
                          disabled={pending}>
                          {pending ? 'Procesando...' : 'Desvincular'}
                        </JBButton>
                      ) : (
                        <JBButton
                          action="primary"
                          size="small"
                          onClick={() => {
                            void onLink(providerEntry.provider);
                          }}
                          disabled={pending || !isEnabled}>
                          {pending ? 'Vinculando...' : 'Vincular'}
                        </JBButton>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
      <AccountFeedbackSnackbars
        successMessage={successMessage}
        errorMessage={errorMessage}
        onCloseSuccess={() => setSuccessMessage(null)}
        onCloseError={() => setErrorMessage(null)}
      />
    </Stack>
  );
}
