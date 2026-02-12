import { ComponentType, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { AuthPageWrapperProps } from '../routes';
import { AuthPagesMessageSection } from './AuthPagesMessageSection';
import { AuthMessageSectionProps, AuthPageLayoutVariant } from './types';

type AuthRoutePageWrapperProps = AuthPageWrapperProps & {
  children: ReactNode;
  layoutVariant?: AuthPageLayoutVariant;
  messageSectionProps?: AuthMessageSectionProps;
  MessageSectionComponent?: ComponentType<AuthMessageSectionProps>;
};

export function AuthRoutePageWrapper(props: AuthRoutePageWrapperProps) {
  const {
    children,
    routeKey,
    layoutVariant = 'split',
    messageSectionProps,
    MessageSectionComponent = AuthPagesMessageSection
  } = props;
  const isSignOut = routeKey === 'signOut';

  if (layoutVariant === 'modern') {
    return (
      <Box
        sx={{
          display: 'flex',
          minWidth: 0,
          flex: '1 1 auto',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { md: 4 }
        }}>
        <Paper
          sx={{
            display: 'flex',
            minHeight: { xs: '100%', sm: 'auto' },
            width: { xs: '100%', md: '100%' },
            maxWidth: { md: 1280 },
            overflow: 'hidden',
            borderRadius: { xs: 0, sm: 3 },
            boxShadow: { xs: 'none', sm: 1 }
          }}>
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              px: { xs: 2, sm: 6, md: 8 },
              py: { xs: 2, sm: 6, md: 8 },
              borderRight: (theme) => (theme.direction === 'ltr' ? 1 : 0),
              borderLeft: (theme) => (theme.direction === 'rtl' ? 1 : 0),
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSignOut ? 'center' : 'flex-start'
            }}>
            {children}
          </Box>
          <MessageSectionComponent {...(messageSectionProps ?? {})} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minWidth: 0,
        flex: '1 1 auto',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', md: 'flex-start' },
        justifyContent: { sm: 'center', md: 'flex-start' }
      }}>
      <Paper
        sx={{
          height: { xs: '100%', sm: 'auto', md: '100%' },
          width: { xs: '100%', sm: 'auto', md: layoutVariant === 'split' ? '50%' : '100%' },
          px: { xs: 2, sm: 6, md: 8 },
          py: { xs: layoutVariant === 'fullScreen' ? 2 : 1, sm: 6, md: layoutVariant === 'fullScreen' ? 12 : 8 },
          borderRadius: { xs: 0, sm: 3, md: 0 },
          boxShadow: { xs: 'none', sm: 1, md: 'none' },
          display: { md: 'flex' },
          alignItems: { md: 'center' },
          justifyContent: { md: 'flex-end' },
          borderRight: (theme) => (theme.direction === 'ltr' ? 1 : 0),
          borderLeft: (theme) => (theme.direction === 'rtl' ? 1 : 0),
          borderColor: 'divider',
          ...(isSignOut ? { alignItems: { xs: 'center', md: 'center' } } : null)
        }}>
        {children}
      </Paper>
      <MessageSectionComponent {...(messageSectionProps ?? {})} />
    </Box>
  );
}
