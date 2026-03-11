import { CircularProgress, Stack } from '@mui/material';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { JBAppConfig, defaultJBAppConfig, getAuthAccountConfig } from '../../config';
import { AuthClient } from '../client';
import { resolveDefaultProfileCompletionStatus, resolveProfileCompletionPath } from './profileCompletion';

type AuthEnsureProfileCompletionGuardProps = PropsWithChildren<{
  authClient: AuthClient;
  jbWebConfig?: JBAppConfig;
  completionPath?: string;
  allowedPathPrefixes?: string[];
  loadingFallback?: ReactNode;
  enabled?: boolean;
}>;

type GuardState = {
  isChecking: boolean;
  isComplete: boolean;
};

const DEFAULT_ALLOWED_PATH_PREFIXES = ['/sign-out'];

const defaultLoadingFallback = (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="center"
    sx={{ width: '100%', minHeight: '50vh' }}
  >
    <CircularProgress />
  </Stack>
);

export function AuthEnsureProfileCompletionGuard(props: AuthEnsureProfileCompletionGuardProps) {
  const {
    authClient,
    jbWebConfig,
    completionPath,
    allowedPathPrefixes,
    loadingFallback = defaultLoadingFallback,
    enabled = true,
    children
  } = props;

  const navigate = useNavigate();
  const location = useLocation();
  const accountConfig = useMemo(
    () => getAuthAccountConfig(jbWebConfig ?? defaultJBAppConfig),
    [jbWebConfig]
  );
  const ensureProfileCompletion = Boolean(accountConfig.ensureProfileCompletion);
  const shouldEnforce = Boolean(enabled && ensureProfileCompletion);
  const resolvedCompletionPath = useMemo(
    () => resolveProfileCompletionPath(completionPath ?? accountConfig.profileCompletionPath),
    [accountConfig.profileCompletionPath, completionPath]
  );

  const resolvedAllowedPathPrefixes = useMemo(
    () => [resolvedCompletionPath, ...(allowedPathPrefixes ?? DEFAULT_ALLOWED_PATH_PREFIXES)],
    [allowedPathPrefixes, resolvedCompletionPath]
  );

  const isAllowedPath = useMemo(
    () => resolvedAllowedPathPrefixes.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname, resolvedAllowedPathPrefixes]
  );

  const [guardState, setGuardState] = useState<GuardState>({
    isChecking: shouldEnforce,
    isComplete: !shouldEnforce
  });

  useEffect(() => {
    if (!shouldEnforce) {
      setGuardState({
        isChecking: false,
        isComplete: true
      });
      return undefined;
    }

    let isMounted = true;
    const runProfileCompletionCheck = async () => {
      setGuardState((previousState) => ({
        ...previousState,
        isChecking: true
      }));

      try {
        const completionResult = await resolveDefaultProfileCompletionStatus(
          authClient,
          accountConfig.requiredProfileFields
        );

        if (!isMounted) {
          return;
        }

        setGuardState({
          isChecking: false,
          isComplete: completionResult.isComplete
        });
      } catch {
        if (!isMounted) {
          return;
        }
        // Avoid locking users out on transient API failures.
        setGuardState({
          isChecking: false,
          isComplete: true
        });
      }
    };

    void runProfileCompletionCheck();

    return () => {
      isMounted = false;
    };
  }, [
    accountConfig.requiredProfileFields,
    authClient,
    shouldEnforce,
    location.pathname
  ]);

  useEffect(() => {
    if (!shouldEnforce) {
      return;
    }
    if (isAllowedPath) {
      return;
    }
    if (guardState.isChecking || guardState.isComplete) {
      return;
    }
    navigate(resolvedCompletionPath, { replace: true });
  }, [
    shouldEnforce,
    guardState.isChecking,
    guardState.isComplete,
    isAllowedPath,
    navigate,
    resolvedCompletionPath
  ]);

  if (shouldEnforce && !isAllowedPath && guardState.isChecking) {
    return <>{loadingFallback}</>;
  }

  if (shouldEnforce && !isAllowedPath && !guardState.isComplete) {
    return null;
  }

  return <>{children}</>;
}
