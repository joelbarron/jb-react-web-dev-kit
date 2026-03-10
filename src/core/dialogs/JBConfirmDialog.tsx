import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { ReactNode } from 'react';

export type JBConfirmDialogProps = {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onConfirm: () => void;
  onClose: () => void;
};

export function JBConfirmDialog(props: JBConfirmDialogProps) {
  const {
    open,
    title = 'Confirmar',
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    loading = false,
    maxWidth = 'xs',
    confirmColor = 'primary',
    onConfirm,
    onClose
  } = props;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      {description ? (
        <DialogContent>
          {typeof description === 'string' ? <Typography variant="body2">{description}</Typography> : description}
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

