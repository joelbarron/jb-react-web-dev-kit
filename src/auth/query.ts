import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AuthClient } from './client';
import {
  ContactVerificationRequestPayload,
  ContactVerificationVerifyPayload,
  EmailAvailabilityPayload,
  AccountUpdatePayload,
  DeleteAccountPayload,
  JbDrfWebAuthResponse,
  LinkSocialPayload,
  LoginBasicPayload,
  LoginSocialPayload,
  PhoneAvailabilityPayload,
  SwitchProfilePayload,
  UnlinkSocialPayload,
  UsernameAvailabilityPayload
} from './types';

export const authQueryKeys = {
  all: ['auth'] as const,
  me: () => [...authQueryKeys.all, 'me'] as const,
  social: () => [...authQueryKeys.all, 'social'] as const,
  account: () => [...authQueryKeys.all, 'account'] as const,
  accountSocialAccounts: () => [...authQueryKeys.account(), 'social-accounts'] as const
};

export const createAuthQueryHooks = (
  authClient: Pick<
    AuthClient,
    | 'getMe'
    | 'loginBasic'
    | 'loginSocial'
    | 'linkSocial'
    | 'unlinkSocial'
    | 'updateAccount'
    | 'checkEmailAvailability'
    | 'checkPhoneAvailability'
    | 'checkUsernameAvailability'
    | 'requestContactVerification'
    | 'verifyContactVerification'
    | 'getAccountSocialAccounts'
    | 'deleteAccount'
    | 'switchProfile'
    | 'logout'
  >
) => {
  const useMeQuery = (enabled = true) =>
    useQuery({
      queryKey: authQueryKeys.me(),
      queryFn: () => authClient.getMe(),
      enabled
    });

  const useLoginMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: LoginBasicPayload) => authClient.loginBasic(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  const useSwitchProfileMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: SwitchProfilePayload) => authClient.switchProfile(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  const useSocialLoginMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: LoginSocialPayload) => authClient.loginSocial(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  const useLinkSocialMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: LinkSocialPayload) => authClient.linkSocial(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.social() });
      }
    });
  };

  const useUnlinkSocialMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: UnlinkSocialPayload) => authClient.unlinkSocial(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.social() });
      }
    });
  };

  const useAccountUpdateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ payload, method }: { payload: AccountUpdatePayload; method?: 'PATCH' | 'PUT' }) =>
        authClient.updateAccount(payload, method),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.account() });
      }
    });
  };

  const useAccountSocialAccountsQuery = (enabled = true) =>
    useQuery({
      queryKey: authQueryKeys.accountSocialAccounts(),
      queryFn: () => authClient.getAccountSocialAccounts(),
      enabled
    });

  const useEmailAvailabilityMutation = () =>
    useMutation({
      mutationFn: (payload: EmailAvailabilityPayload) => authClient.checkEmailAvailability(payload)
    });

  const usePhoneAvailabilityMutation = () =>
    useMutation({
      mutationFn: (payload: PhoneAvailabilityPayload) => authClient.checkPhoneAvailability(payload)
    });

  const useUsernameAvailabilityMutation = () =>
    useMutation({
      mutationFn: (payload: UsernameAvailabilityPayload) => authClient.checkUsernameAvailability(payload)
    });

  const useRequestContactVerificationMutation = () =>
    useMutation({
      mutationFn: (payload: ContactVerificationRequestPayload) => authClient.requestContactVerification(payload)
    });

  const useVerifyContactVerificationMutation = () =>
    useMutation({
      mutationFn: (payload: ContactVerificationVerifyPayload) => authClient.verifyContactVerification(payload)
    });

  const useDeleteAccountMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: DeleteAccountPayload) => authClient.deleteAccount(payload),
      onSuccess: async () => {
        queryClient.setQueryData<JbDrfWebAuthResponse | null>(authQueryKeys.me(), null);
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.account() });
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.accountSocialAccounts() });
      }
    });
  };

  const useLogoutMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (): Promise<void> => {
        authClient.logout();
      },
      onSuccess: async () => {
        queryClient.setQueryData<JbDrfWebAuthResponse | null>(authQueryKeys.me(), null);
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
      }
    });
  };

  return {
    useMeQuery,
    useLoginMutation,
    useSocialLoginMutation,
    useLinkSocialMutation,
    useUnlinkSocialMutation,
    useAccountUpdateMutation,
    useAccountSocialAccountsQuery,
    useEmailAvailabilityMutation,
    usePhoneAvailabilityMutation,
    useUsernameAvailabilityMutation,
    useRequestContactVerificationMutation,
    useVerifyContactVerificationMutation,
    useDeleteAccountMutation,
    useSwitchProfileMutation,
    useLogoutMutation
  };
};
