import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type AuthPageTitleProps = {
  title: string;
  logoSrc?: string;
};

export function AuthPageTitle(props: AuthPageTitleProps) {
  const { title, logoSrc = '/assets/images/logo/logo.svg' } = props;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        style={{ width: 48 }}
        src={logoSrc}
        alt="logo"
      />

      <Typography
        sx={{ mt: 4, textAlign: 'center', fontSize: 36, lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
    </Box>
  );
}
