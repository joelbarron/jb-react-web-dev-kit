import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type SignInPageTitleProps = {
  logoSrc?: string;
};

export function SignInPageTitle(props: SignInPageTitleProps) {
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
        Iniciar sesión
      </Typography>
    </Box>
  );
}
