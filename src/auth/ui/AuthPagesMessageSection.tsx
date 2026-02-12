import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';

import { AuthMessageSectionProps } from './types';

const defaultTitleLines = ['Bienvenido a', 'nuestra comunidad'];
const defaultDescription =
  'Fuse ayuda a desarrolladores a construir paneles organizados, bien estructurados y con módulos visuales de alta calidad. Únete y empieza a construir tu aplicación hoy.';
const defaultFooterText = 'Más de 17k personas ya se unieron, ahora te toca a ti.';
const defaultAvatarUrls = [
  '/assets/images/avatars/female-18.jpg',
  '/assets/images/avatars/female-11.jpg',
  '/assets/images/avatars/male-09.jpg',
  '/assets/images/avatars/male-16.jpg'
];

export function AuthPagesMessageSection(props: AuthMessageSectionProps) {
  const {
    titleLines = defaultTitleLines,
    description = defaultDescription,
    footerText = defaultFooterText,
    avatarUrls = defaultAvatarUrls
  } = props;

  return (
    <Box
      sx={{
        position: 'relative',
        display: { xs: 'none', md: 'flex' },
        height: '100%',
        flex: '1 1 auto',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        p: 6,
        px: { lg: 10 },
        backgroundColor: 'primary.dark',
        color: 'primary.contrastText'
      }}>
      <svg
        style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}
        viewBox="0 0 960 540"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg">
        <Box
          component="g"
          sx={{ opacity: 0.05 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="100">
          <circle
            r="234"
            cx="196"
            cy="23"
          />
          <circle
            r="234"
            cx="790"
            cy="491"
          />
        </Box>
      </svg>
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          top: -64,
          right: -64,
          opacity: 0.2,
          color: 'primary.light'
        }}
        viewBox="0 0 220 192"
        width="220px"
        height="192px"
        fill="none">
        <defs>
          <pattern
            id="jb-auth-message-pattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse">
            <rect
              x="0"
              y="0"
              width="4"
              height="4"
              fill="currentColor"
            />
          </pattern>
        </defs>
        <rect
          width="220"
          height="192"
          fill="url(#jb-auth-message-pattern)"
        />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 896 }}>
        <Box sx={{ fontSize: 64, lineHeight: 1, fontWeight: 700, color: 'grey.100' }}>
          {titleLines.map((line) => (
            <Box key={line}>{line}</Box>
          ))}
        </Box>
        <Box sx={{ mt: 3, fontSize: 18, lineHeight: 1.5, letterSpacing: '-0.01em', color: 'grey.400' }}>
          {description}
        </Box>
        <Box sx={{ mt: 4, display: 'flex', alignItems: 'center' }}>
          <AvatarGroup
            sx={{
              '& .MuiAvatar-root': {
                borderColor: 'primary.main'
              }
            }}>
            {avatarUrls.map((avatarUrl) => (
              <Avatar
                key={avatarUrl}
                src={avatarUrl}
              />
            ))}
          </AvatarGroup>

          <Box sx={{ ml: 2, fontWeight: 500, letterSpacing: '-0.01em', color: 'grey.400' }}>
            {footerText}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
