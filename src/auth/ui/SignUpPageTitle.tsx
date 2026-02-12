import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type SignUpPageTitleProps = {
  logoSrc?: string;
};

export function SignUpPageTitle(props: SignUpPageTitleProps) {
  const { logoSrc = '/assets/images/logo/logo.svg' } = props;

  return (
    <Box sx={{ width: '100%' }}>
      <img
        style={{ width: 48 }}
        src={logoSrc}
        alt="logo"
      />

      <Typography
        sx={{ mt: 4, fontSize: 36, lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.02em' }}>
        Crear cuenta
      </Typography>
    </Box>
  );
}
