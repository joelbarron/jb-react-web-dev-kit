import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AuthAccountSubscriptionViewProps } from './types';

export function AuthAccountSubscriptionView(props: AuthAccountSubscriptionViewProps) {
  const { subscriptionUrl } = props;

  if (!subscriptionUrl) {
    return (
      <Alert severity="info">
        Esta implementación no configuró un destino para suscripciones.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Suscripción</Typography>
      <Typography
        variant="body2"
        color="text.secondary">
        Puedes administrar tu plan de suscripción en el portal correspondiente.
      </Typography>
      <Stack
        direction="row"
        justifyContent="flex-start">
        <Button
          variant="contained"
          onClick={() => {
            window.location.assign(subscriptionUrl);
          }}>
          Ir a suscripción
        </Button>
      </Stack>
    </Stack>
  );
}
