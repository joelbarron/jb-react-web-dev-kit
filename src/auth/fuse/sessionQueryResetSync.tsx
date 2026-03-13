import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

type SessionQueryResetSyncProps = {
  queryKeys: ReadonlyArray<QueryKey>;
  enabled?: boolean;
};

const normalizeSessionUserId = (value: unknown): string | number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return null;
};

type SessionUserHookResult<TUserId extends string | number = string | number> =
  | {
      data?: {
        id?: TUserId | null;
      } | null;
    }
  | {
      id?: TUserId | null;
    }
  | null
  | undefined;

type CreateSessionQueryResetSyncOptions<TUserId extends string | number = string | number> = {
  useSessionUser: () => SessionUserHookResult<TUserId>;
  resolveSessionUserId?: (result: SessionUserHookResult<TUserId>) => string | number | null;
};

export function createSessionQueryResetSync<TUserId extends string | number = string | number>(
  options: CreateSessionQueryResetSyncOptions<TUserId>
) {
  const { useSessionUser, resolveSessionUserId } = options;

  const getNextSessionUserId =
    resolveSessionUserId ??
    ((result: SessionUserHookResult<TUserId>) => {
      if (!result) {
        return null;
      }

      const normalizedResult = result as {
        data?: {
          id?: TUserId | null;
        } | null;
        id?: TUserId | null;
      };

      if (typeof normalizedResult.data !== 'undefined') {
        return normalizeSessionUserId(normalizedResult.data?.id);
      }

      return normalizeSessionUserId(normalizedResult.id);
    });

  return function SessionQueryResetSync(props: SessionQueryResetSyncProps) {
    const { queryKeys, enabled = true } = props;
    const sessionUserResult = useSessionUser();
    const queryClient = useQueryClient();
    const previousSessionUserIdRef = useRef<string | number | null>(null);
    const hasBootstrappedRef = useRef(false);

    useEffect(() => {
      if (!enabled) {
        return;
      }

      const nextSessionUserId = getNextSessionUserId(sessionUserResult);

      if (!hasBootstrappedRef.current) {
        previousSessionUserIdRef.current = nextSessionUserId;
        hasBootstrappedRef.current = true;
        return;
      }

      if (previousSessionUserIdRef.current === nextSessionUserId) {
        return;
      }

      previousSessionUserIdRef.current = nextSessionUserId;
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    }, [enabled, getNextSessionUserId, queryClient, queryKeys, sessionUserResult]);

    return null;
  };
}
