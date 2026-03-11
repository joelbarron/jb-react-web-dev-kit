import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

type AccountFeedbackSnackbarsProps = {
  successMessage?: string | null;
  errorMessage?: string | null;
  onCloseSuccess: () => void;
  onCloseError: () => void;
};

export function AccountFeedbackSnackbars(props: AccountFeedbackSnackbarsProps) {
  const { successMessage, errorMessage, onCloseSuccess, onCloseError } = props;

  return (
    <>
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={(_, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          onCloseSuccess();
        }}
      >
        <Alert severity="success" variant="filled" onClose={onCloseSuccess}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={(_, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          onCloseError();
        }}
      >
        <Alert severity="error" variant="filled" onClose={onCloseError}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
