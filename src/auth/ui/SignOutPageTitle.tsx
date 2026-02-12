import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type SignOutPageTitleProps = {
  logoSrc?: string;
};

export function SignOutPageTitle(props: SignOutPageTitleProps) {
  const { logoSrc = '/assets/images/logo/logo.svg' } = props;

  return (
    <Box sx={{ width: '100%' }}>
      <img
        style={{ width: 48, display: 'block', marginInline: 'auto' }}
        src={logoSrc}
        alt="logo"
      />

      <Typography
        sx={{ mt: 4, textAlign: 'center', fontSize: 36, lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.02em' }}>
        Has cerrado sesión
      </Typography>
    </Box>
  );
}
