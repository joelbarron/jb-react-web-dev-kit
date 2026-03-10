import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { Button, ButtonProps } from '@mui/material';
import { ReactNode } from 'react';

export type JBButtonAction = 'save' | 'edit' | 'cancel' | 'delete' | 'primary' | 'secondary';

export type JBButtonProps = Omit<ButtonProps, 'size' | 'action'> & {
  action?: JBButtonAction;
  size?: ButtonProps['size'];
};

const ACTION_VARIANT: Record<JBButtonAction, ButtonProps['variant']> = {
  save: 'contained',
  edit: 'contained',
  cancel: 'outlined',
  delete: 'contained',
  primary: 'contained',
  secondary: 'contained'
};

const ACTION_COLOR: Record<JBButtonAction, ButtonProps['color'] | undefined> = {
  save: 'primary',
  edit: 'warning',
  cancel: undefined,
  delete: 'error',
  primary: 'primary',
  secondary: 'secondary'
};

const ACTION_ICON: Record<JBButtonAction, ReactNode | undefined> = {
  save: <SaveRoundedIcon fontSize="small" />,
  edit: <EditRoundedIcon fontSize="small" />,
  cancel: <CloseRoundedIcon fontSize="small" />,
  delete: <DeleteRoundedIcon fontSize="small" />,
  primary: undefined,
  secondary: undefined
};

export function JBButton(props: JBButtonProps) {
  const {
    action,
    size = 'large',
    variant,
    color,
    startIcon,
    sx,
    children,
    ...rest
  } = props;

  const resolvedVariant = variant ?? (action ? ACTION_VARIANT[action] : 'contained');
  const resolvedColor = color ?? (action ? ACTION_COLOR[action] : 'primary');
  const resolvedStartIcon = startIcon ?? (action ? ACTION_ICON[action] : undefined);

  return (
    <Button
      {...rest}
      size={size}
      variant={resolvedVariant}
      color={resolvedColor}
      startIcon={resolvedStartIcon}
      sx={[
        () => ({
          borderRadius: 1.5,
          minHeight: 42,
          px: 2.25,
          fontWeight: 700,
          ...(resolvedVariant === 'contained'
            ? {
                boxShadow: 'none',
                backgroundImage: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  backgroundImage: 'none'
                }
              }
            : {})
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
      ]}>
      {children}
    </Button>
  );
}
