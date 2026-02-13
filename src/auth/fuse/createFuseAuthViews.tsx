import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import {
  AuthAccountConfirmationForm,
  AuthForgotPasswordForm,
  AuthOtpSignInForm,
  AuthPasswordResetConfirmForm,
  AuthPasswordSignInForm,
  AuthSignUpForm,
} from "../forms";
import { JBAuthProfileRoleOption, JBAuthSocialConfig } from "../../config";
import { authenticateWithSocialProvider } from "../social/providerAuth";
import { useFuseJwtAuth } from "./fuseAdapter";
import {
  AuthLinkComponent,
  AuthRoleSelectionDialog,
  AuthSocialProviderButton,
  AuthSecondaryButton,
  SignInPageTitle,
  SignOutPageTitle,
  SignUpPageTitle,
} from "../ui";
import { SocialProvider } from "../types";
import { parseAuthError } from "../forms/errorParser";

type SignInFormMode = "password" | "otp";
const IS_DEV =
  typeof window !== "undefined" && window.location.hostname === "localhost";

const DEV_LOGIN_DEFAULT_VALUES = IS_DEV
  ? {
      login: "admin",
      password: "Test123_",
      remember: true,
    }
  : undefined;

const DEV_SIGN_UP_DEFAULT_VALUES = IS_DEV
  ? {
      firstName: "Joel",
      lastName1: "Barron",
      lastName2: "Hernandez",
      email: "joel.test+1@example.com",
      birthday: "1995-12-16",
      gender: "MALE" as const,
      password: "Test123_",
      passwordConfirm: "Test123_",
      acceptTermsConditions: true,
    }
  : undefined;

const DEV_OTP_DEFAULT_VALUES = IS_DEV
  ? {
      countryCode: "+52",
      phone: "5512345678",
      code: "",
    }
  : undefined;

type EnabledSocialProvider = {
  provider: SocialProvider;
  clientId: string;
  redirectUri?: string;
  scope?: string;
  scopes?: string[];
  usePopup?: boolean;
  responseMode?: "web_message" | "form_post" | "query" | "fragment";
  responseType?: "code" | "id_token" | "code id_token";
  state?: string;
  nonce?: string;
};

const SOCIAL_PROVIDER_ORDER: SocialProvider[] = ["google", "facebook", "apple"];

function getEnabledSocialProviders(socialConfig?: JBAuthSocialConfig): EnabledSocialProvider[] {
  if (!socialConfig) {
    return [];
  }

  return SOCIAL_PROVIDER_ORDER.flatMap((provider) => {
    const providerConfig = socialConfig[provider];
    if (!providerConfig?.enabled || !providerConfig.clientId?.trim()) {
      return [];
    }

    return [
      {
        provider,
        clientId: providerConfig.clientId.trim(),
        redirectUri: providerConfig.redirectUri?.trim() || undefined,
        scope: providerConfig.scope?.trim() || undefined,
        scopes: providerConfig.scopes,
        usePopup: providerConfig.usePopup,
        responseMode: providerConfig.responseMode,
        responseType: providerConfig.responseType,
        state: providerConfig.state,
        nonce: providerConfig.nonce
      }
    ];
  });
}

type FuseSignInControllerProps = {
  LinkComponent: AuthLinkComponent;
  mode?: SignInFormMode;
  onBackToPassword?: () => void;
  requestRoleSelection?: () => Promise<string | undefined>;
};

function FuseSignInController(props: FuseSignInControllerProps) {
  const { LinkComponent, mode = "password", onBackToPassword, requestRoleSelection } = props;
  const { signIn, requestOtp, signInOtp } = useFuseJwtAuth();

  if (mode === "otp") {
    return (
      <AuthOtpSignInForm
        defaultValues={DEV_OTP_DEFAULT_VALUES}
        requestRoleSelection={requestRoleSelection}
        onBackToPassword={onBackToPassword}
        onRequestOtp={({ phone }) =>
          requestOtp({
            channel: "sms",
            phone,
          })
        }
        onVerifyOtp={({ phone, code, role }) =>
          signInOtp({
            channel: "sms",
            phone,
            code,
            role,
          })
        }
      />
    );
  }

  return (
    <AuthPasswordSignInForm
      defaultValues={DEV_LOGIN_DEFAULT_VALUES}
      LinkComponent={LinkComponent}
      onSubmit={(values) =>
        signIn({
          login: values.login,
          password: values.password,
        })
      }
    />
  );
}

type FuseSignUpControllerProps = {
  onSuccess?: (values: {
    email: string;
    detail?: string;
    response: Record<string, unknown>;
  }) => void;
  requiresRoleSelection?: boolean;
  requestRoleSelection?: () => Promise<string | undefined>;
};

function FuseSignUpController(props: FuseSignUpControllerProps) {
  const { onSuccess, requestRoleSelection, requiresRoleSelection = false } = props;
  const { signUp } = useFuseJwtAuth();

  return (
    <AuthSignUpForm
      defaultValues={DEV_SIGN_UP_DEFAULT_VALUES}
      onSubmit={async (values) => {
        const selectedRole = requestRoleSelection
          ? await requestRoleSelection()
          : values.role;
        if (requiresRoleSelection && !selectedRole) {
          return;
        }

        const response = await signUp({
          ...values,
          role: selectedRole ?? values.role,
        });
        onSuccess?.({
          email: values.email,
          detail: (response.detail as string | undefined) ?? undefined,
          response
        });
      }}
    />
  );
}

type FuseOtpSignUpFormProps = {
  onBackToPassword?: () => void;
  requestRoleSelection?: () => Promise<string | undefined>;
};

function FuseOtpSignUpForm(props: FuseOtpSignUpFormProps) {
  const { onBackToPassword, requestRoleSelection } = props;
  const { requestOtp, signInOtp } = useFuseJwtAuth();

  return (
    <AuthOtpSignInForm
      defaultValues={DEV_OTP_DEFAULT_VALUES}
      requestRoleSelection={requestRoleSelection}
      onBackToPassword={onBackToPassword}
      onRequestOtp={({ phone }) =>
        requestOtp({
          channel: "sms",
          phone,
        })
      }
      onVerifyOtp={({ phone, code, role }) =>
        signInOtp({
          channel: "sms",
          phone,
          code,
          role,
        })
      }
    />
  );
}

type AlternativesProps = {
  onSmsClick?: () => void;
  socialProviders?: EnabledSocialProvider[];
  onSocialClick?: (provider: SocialProvider) => void;
  socialLoadingProvider?: SocialProvider | null;
  socialError?: string | null;
};

function FuseAuthAlternativesSection(props: AlternativesProps) {
  const { onSmsClick, socialProviders = [], onSocialClick, socialLoadingProvider, socialError } = props;

  return (
    <>
      <Box sx={{ mt: 4, display: "flex", alignItems: "center" }}>
        <Box
          sx={{ mt: "1px", flex: 1, borderTop: 1, borderColor: "divider" }}
        />
        <Typography sx={{ mx: 1 }} color="text.secondary">
          O continúa con
        </Typography>
        <Box
          sx={{ mt: "1px", flex: 1, borderTop: 1, borderColor: "divider" }}
        />
      </Box>

      <Box
        sx={{
          mt: 4,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1.5
        }}>
        {socialProviders.map((socialProvider) => (
          <AuthSocialProviderButton
            key={socialProvider.provider}
            provider={socialProvider.provider}
            loading={socialLoadingProvider === socialProvider.provider}
            disabled={Boolean(socialLoadingProvider && socialLoadingProvider !== socialProvider.provider)}
            onClick={() => onSocialClick?.(socialProvider.provider)}
          />
        ))}

        <AuthSecondaryButton
          sx={{ minWidth: 0 }}
          aria-label="SMS"
          onClick={onSmsClick}
          startIcon={<PhoneIphoneIcon fontSize="small" />}>
          SMS
        </AuthSecondaryButton>
      </Box>

      {socialError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {socialError}
        </Alert>
      ) : null}
    </>
  );
}

type SignUpCtaProps = {
  LinkComponent: AuthLinkComponent;
  signUpPath?: string;
};

function FuseSignUpCtaSection(props: SignUpCtaProps) {
  const { LinkComponent, signUpPath = "/sign-up" } = props;

  return (
    <>
      <Box sx={{ mt: 6, display: "flex", alignItems: "center" }}>
        <Box
          sx={{ mt: "1px", flex: 1, borderTop: 1, borderColor: "divider" }}
        />
        <Typography sx={{ mx: 1 }} color="text.secondary">
          ¿No tienes una cuenta?
        </Typography>
        <Box
          sx={{ mt: "1px", flex: 1, borderTop: 1, borderColor: "divider" }}
        />
      </Box>

      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <AuthSecondaryButton
          component={LinkComponent}
          to={signUpPath}
          sx={{ flex: 1 }}
          aria-label="Crear cuenta"
        >
          Crear cuenta
        </AuthSecondaryButton>
      </Box>
    </>
  );
}

type SignInCtaProps = {
  LinkComponent: AuthLinkComponent;
  signInPath?: string;
};

function FuseSignInCtaSection(props: SignInCtaProps) {
  const { LinkComponent, signInPath = "/sign-in" } = props;

  return (
    <>
      <Box sx={{ mt: 6, display: "flex", alignItems: "center" }}>
        <Box
          sx={{ mt: "1px", flex: 1, borderTop: 1, borderColor: "divider" }}
        />
        <Typography sx={{ mx: 1 }} color="text.secondary">
          ¿Ya tienes una cuenta?
        </Typography>
        <Box
          sx={{ mt: "1px", flex: 1, borderTop: 1, borderColor: "divider" }}
        />
      </Box>

      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <AuthSecondaryButton
          component={LinkComponent}
          to={signInPath}
          sx={{ flex: 1 }}
          aria-label="Iniciar sesión"
        >
          Iniciar sesión
        </AuthSecondaryButton>
      </Box>
    </>
  );
}

function FuseForgotPasswordPageForm() {
  const { requestPasswordReset } = useFuseJwtAuth();
  return (
    <AuthForgotPasswordForm
      onSubmit={(values) => requestPasswordReset({ email: values.email })}
    />
  );
}

type ResetPasswordFormProps = {
  initialUid?: string;
  initialToken?: string;
};

function FuseResetPasswordPageForm(props: ResetPasswordFormProps) {
  const { initialUid = "", initialToken = "" } = props;
  const { confirmPasswordReset } = useFuseJwtAuth();

  return (
    <AuthPasswordResetConfirmForm
      defaultValues={{
        uid: initialUid,
        token: initialToken,
      }}
      onSubmit={(values) => confirmPasswordReset(values)}
    />
  );
}

type AccountConfirmationFormProps = {
  initialUid?: string;
  initialToken?: string;
};

function FuseAccountConfirmationPageForm(props: AccountConfirmationFormProps) {
  const { initialUid = "", initialToken = "" } = props;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const { confirmAccountEmail, resendAccountConfirmation } = useFuseJwtAuth();

  return (
    <AuthAccountConfirmationForm
      defaultValues={{
        uid: initialUid,
        token: initialToken,
      }}
      defaultEmail={initialEmail}
      onGoToSignIn={() => navigate('/sign-in')}
      onSubmit={(values) => confirmAccountEmail(values)}
      onResend={(values) => resendAccountConfirmation(values)}
    />
  );
}

type RoleOption = { value: string; label: string };

function useRoleSelectionDialog(options: RoleOption[], defaultRole?: string) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole ?? options[0]?.value ?? "");
  const roleSelectionResolverRef = useRef<((role: string | undefined) => void) | null>(null);

  const requestRoleSelection = useCallback((): Promise<string | undefined> => {
    if (!options.length) {
      return Promise.resolve(undefined);
    }

    if (options.length === 1) {
      return Promise.resolve(options[0].value);
    }

    return new Promise((resolve) => {
      roleSelectionResolverRef.current = resolve;
      setIsDialogOpen(true);
    });
  }, [options]);

  const closeRoleDialog = useCallback((role: string | undefined) => {
    const resolver = roleSelectionResolverRef.current;
    roleSelectionResolverRef.current = null;
    setIsDialogOpen(false);
    resolver?.(role);
  }, []);

  const dialog = (
    <AuthRoleSelectionDialog
      open={isDialogOpen}
      options={options}
      initialRole={selectedRole}
      onCancel={() => closeRoleDialog(undefined)}
      onConfirm={(role) => {
        setSelectedRole(role);
        closeRoleDialog(role);
      }}
    />
  );

  return { requestRoleSelection, dialog, hasRoleOptions: options.length > 0 };
}

type CreateFuseAuthViewsOptions = {
  LinkComponent: AuthLinkComponent;
  accountConfirmationPath?: string;
  signUpRoleOptions?: JBAuthProfileRoleOption[];
  defaultSignUpRole?: string;
  socialConfig?: JBAuthSocialConfig;
  onSignUpSuccess?: (values: {
    email: string;
    detail?: string;
    response: Record<string, unknown>;
  }) => void;
};

export function createFuseAuthViews(options: CreateFuseAuthViewsOptions) {
  const {
    LinkComponent,
    accountConfirmationPath = "/verify-email",
    signUpRoleOptions,
    defaultSignUpRole,
    socialConfig,
    onSignUpSuccess,
  } = options;

  function SignInPageView() {
    const [mode, setMode] = useState<SignInFormMode>("password");
    const { signInSocial } = useFuseJwtAuth();
    const [socialLoadingProvider, setSocialLoadingProvider] = useState<SocialProvider | null>(null);
    const [socialError, setSocialError] = useState<string | null>(null);
    const signupRoleOptions = (signUpRoleOptions ?? [])
      .filter((roleOption) => roleOption.allowSignup === true)
      .map((roleOption) => ({
        value: roleOption.value,
        label: roleOption.label,
      }));
    const { requestRoleSelection, dialog, hasRoleOptions } = useRoleSelectionDialog(
      signupRoleOptions,
      defaultSignUpRole
    );
    const enabledSocialProviders = useMemo(
      () => getEnabledSocialProviders(socialConfig),
      [socialConfig]
    );

    const onSocialClick = useCallback(
      async (provider: SocialProvider) => {
        const providerConfig = enabledSocialProviders.find((item) => item.provider === provider);
        if (!providerConfig) {
          return;
        }

        try {
          setSocialError(null);
          setSocialLoadingProvider(provider);
          const tokenPayload = await authenticateWithSocialProvider(provider, providerConfig);
          const selectedRole = hasRoleOptions ? await requestRoleSelection() : undefined;
          if (hasRoleOptions && !selectedRole) {
            return;
          }

          await signInSocial({
            ...tokenPayload,
            provider,
            role: selectedRole,
            client: "web",
            termsAndConditionsAccepted: true,
          });
        } catch (error) {
          const parsed = parseAuthError(error);
          setSocialError(parsed.rootMessage || "No se pudo continuar con el proveedor social.");
        } finally {
          setSocialLoadingProvider(null);
        }
      },
      [enabledSocialProviders, hasRoleOptions, requestRoleSelection, signInSocial]
    );

    return (
      <Box
        sx={{
          mx: { xs: "auto", sm: 0 },
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <SignInPageTitle />
        <Box sx={{ width: "100%" }}>
          <FuseSignInController
            LinkComponent={LinkComponent}
            mode={mode}
            requestRoleSelection={requestRoleSelection}
            onBackToPassword={() => setMode("password")}
          />

          {mode === "password" && (
            <>
              <FuseSignUpCtaSection LinkComponent={LinkComponent} />
              <FuseAuthAlternativesSection
                onSmsClick={() => setMode("otp")}
                socialProviders={enabledSocialProviders}
                onSocialClick={onSocialClick}
                socialLoadingProvider={socialLoadingProvider}
                socialError={socialError}
              />
            </>
          )}
        </Box>
        {dialog}
      </Box>
    );
  }

  function SignUpPageView() {
    const [mode, setMode] = useState<SignInFormMode>("password");
    const { signInSocial } = useFuseJwtAuth();
    const [socialLoadingProvider, setSocialLoadingProvider] = useState<SocialProvider | null>(null);
    const [socialError, setSocialError] = useState<string | null>(null);
    const navigate = useNavigate();
    const signupRoleOptions = (signUpRoleOptions ?? [])
      .filter((roleOption) => roleOption.allowSignup === true)
      .map((roleOption) => ({
        value: roleOption.value,
        label: roleOption.label,
      }));
    const { requestRoleSelection, dialog, hasRoleOptions } = useRoleSelectionDialog(
      signupRoleOptions,
      defaultSignUpRole
    );
    const enabledSocialProviders = useMemo(
      () => getEnabledSocialProviders(socialConfig),
      [socialConfig]
    );

    const onSocialClick = useCallback(
      async (provider: SocialProvider) => {
        const providerConfig = enabledSocialProviders.find((item) => item.provider === provider);
        if (!providerConfig) {
          return;
        }

        try {
          setSocialError(null);
          setSocialLoadingProvider(provider);
          const tokenPayload = await authenticateWithSocialProvider(provider, providerConfig);
          const selectedRole = hasRoleOptions ? await requestRoleSelection() : undefined;
          if (hasRoleOptions && !selectedRole) {
            return;
          }

          await signInSocial({
            ...tokenPayload,
            provider,
            role: selectedRole,
            client: "web",
            termsAndConditionsAccepted: true,
          });
        } catch (error) {
          const parsed = parseAuthError(error);
          setSocialError(parsed.rootMessage || "No se pudo continuar con el proveedor social.");
        } finally {
          setSocialLoadingProvider(null);
        }
      },
      [enabledSocialProviders, hasRoleOptions, requestRoleSelection, signInSocial]
    );

    return (
      <Box
        sx={{
          mx: { xs: "auto", sm: 0 },
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <SignUpPageTitle />
        <Box sx={{ width: "100%" }}>
          {mode === "password" ? (
            <>
              <FuseSignUpController
                requiresRoleSelection={hasRoleOptions}
                requestRoleSelection={requestRoleSelection}
                onSuccess={(payload) => {
                  const { email } = payload;
                  onSignUpSuccess?.(payload);
                  navigate(
                    `${accountConfirmationPath}?email=${encodeURIComponent(email)}`,
                  );
                }}
              />
              <FuseSignInCtaSection LinkComponent={LinkComponent} />
              <FuseAuthAlternativesSection
                onSmsClick={() => setMode("otp")}
                socialProviders={enabledSocialProviders}
                onSocialClick={onSocialClick}
                socialLoadingProvider={socialLoadingProvider}
                socialError={socialError}
              />
            </>
          ) : (
            <FuseOtpSignUpForm
              requestRoleSelection={requestRoleSelection}
              onBackToPassword={() => setMode("password")}
            />
          )}
        </Box>
        {dialog}
      </Box>
    );
  }

  function ForgotPasswordPageView() {
    return (
      <Box
        sx={{
          mx: { xs: "auto", sm: 0 },
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <img
            style={{ width: 48 }}
            src="/assets/images/logo/logo.svg"
            alt="logo"
          />

          <Typography
            sx={{
              mt: 4,
              fontSize: 36,
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Olvidé mi contraseña
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 16 }} color="text.secondary">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </Typography>
        </Box>

        <FuseForgotPasswordPageForm />

        <Typography
          sx={{ fontSize: 16, fontWeight: 500 }}
          color="text.secondary"
        >
          Volver a <LinkComponent to="/sign-in">Iniciar sesión</LinkComponent>
        </Typography>
      </Box>
    );
  }

  function ResetPasswordPageView() {
    const [searchParams] = useSearchParams();
    const initialUid = useMemo(
      () => searchParams.get("uid") || "",
      [searchParams],
    );
    const initialToken = useMemo(
      () => searchParams.get("token") || "",
      [searchParams],
    );

    return (
      <Box
        sx={{
          mx: { xs: "auto", sm: 0 },
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <img
            style={{ width: 48 }}
            src="/assets/images/logo/logo.svg"
            alt="logo"
          />

          <Typography
            sx={{
              mt: 4,
              fontSize: 36,
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Restablecer contraseña
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 16 }} color="text.secondary">
            Define una nueva contraseña para volver a acceder a tu cuenta.
          </Typography>
        </Box>

        <FuseResetPasswordPageForm
          initialUid={initialUid}
          initialToken={initialToken}
        />

        <Typography
          sx={{ fontSize: 16, fontWeight: 500 }}
          color="text.secondary"
        >
          Volver a <LinkComponent to="/sign-in">Iniciar sesión</LinkComponent>
        </Typography>
      </Box>
    );
  }

  function SignOutPageView() {
    return (
      <Box
        sx={{
          mx: { xs: "auto", sm: 0 },
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
        }}
      >
        <SignOutPageTitle />

        <Typography
          sx={{ mt: 2, textAlign: "center", fontSize: 16, fontWeight: 500 }}
          color="text.secondary"
        >
          Ir a <LinkComponent to="/sign-in">iniciar sesión</LinkComponent>
        </Typography>
      </Box>
    );
  }

  function AccountConfirmationPageView() {
    const [searchParams] = useSearchParams();
    const initialUid = useMemo(
      () => searchParams.get("uid") || "",
      [searchParams],
    );
    const initialToken = useMemo(
      () => searchParams.get("token") || "",
      [searchParams],
    );

    return (
      <Box
        sx={{
          mx: { xs: "auto", sm: 0 },
          width: { xs: "100%", sm: 320 },
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <img
            style={{ width: 48 }}
            src="/assets/images/logo/logo.svg"
            alt="logo"
          />

          <Typography
            sx={{
              mt: 4,
              fontSize: 36,
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Verificar cuenta
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 16 }} color="text.secondary">
            Estamos validando tu enlace de confirmación.
          </Typography>
        </Box>

        <FuseAccountConfirmationPageForm
          initialUid={initialUid}
          initialToken={initialToken}
        />
      </Box>
    );
  }

  return {
    SignInPageView,
    SignUpPageView,
    ForgotPasswordPageView,
    ResetPasswordPageView,
    SignOutPageView,
    AccountConfirmationPageView,
  };
}
