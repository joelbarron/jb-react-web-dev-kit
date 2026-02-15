import AppleIcon from '@mui/icons-material/Apple';
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { ReactNode } from 'react';

import { SocialProvider } from '../types';

type AuthSocialProviderButtonProps = Omit<ButtonProps, 'variant' | 'color'> & {
  provider: SocialProvider | 'sms';
  loading?: boolean;
  loadingLabel?: ReactNode;
};

const providerIcon: Record<SocialProvider | 'sms', ReactNode> = {
  google: <GoogleIcon fontSize='small' />,
  facebook: <FacebookIcon fontSize='small' />,
  apple: <AppleIcon fontSize='small' />,
  sms: <PhoneIphoneIcon fontSize='small' />
};

const providerLabel: Record<SocialProvider | 'sms', string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
  sms: 'SMS'
};

export function AuthSocialProviderButton(props: AuthSocialProviderButtonProps) {
  const { provider, loading = false, loadingLabel, children, disabled, sx, ...rest } = props;
  const label = children ?? providerLabel[provider];

  return (
    <Button
      {...rest}
      variant='outlined'
      color='inherit'
      disabled={Boolean(disabled) || loading}
      aria-label={providerLabel[provider]}
      startIcon={
        loading ? (
          <CircularProgress
            size={16}
            color='inherit'
          />
        ) : (
          providerIcon[provider]
        )
      }
      sx={{
        width: '100%',
        minWidth: 0,
        minHeight: 38,
        justifyContent: 'center',
        '& .MuiButton-startIcon': {
          marginRight: 1
        },
        ...(sx ?? {})
      }}>
      {loading ? loadingLabel ?? label : label}
    </Button>
  );
}
