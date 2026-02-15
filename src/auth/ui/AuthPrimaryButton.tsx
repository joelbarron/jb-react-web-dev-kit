import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { ReactNode } from 'react';

type AuthPrimaryButtonProps = Omit<ButtonProps, 'variant' | 'color'> & {
  loading?: boolean;
  loadingLabel?: ReactNode;
};

export function AuthPrimaryButton(props: AuthPrimaryButtonProps) {
  const { loading = false, loadingLabel, children, disabled, sx, startIcon, ...rest } = props;

  return (
    <Button
      {...rest}
      variant="contained"
      color="primary"
      disabled={Boolean(disabled) || loading}
      startIcon={
        loading ? (
          <CircularProgress
            size={16}
            color="inherit"
          />
        ) : startIcon
      }
      sx={{
        width: '100%',
        minHeight: 38,
        '&.Mui-disabled': {
          opacity: 1,
          color: 'common.white',
          backgroundColor: 'primary.main'
        },
        '&.Mui-disabled.MuiButton-contained': {
          opacity: 0.6
        },
        ...(sx ?? {})
      }}>
      {loading ? loadingLabel ?? children : children}
    </Button>
  );
}
