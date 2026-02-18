import { Box, Paper, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactNode } from 'react';

export type JBContentContainerProps = {
  children: ReactNode;
  header?: ReactNode;
  animated?: boolean;
  animationDelayMs?: number;
  animationDurationMs?: number;
  padding?: number | string | { xs?: number | string; sm?: number | string; md?: number | string; lg?: number | string };
  contentPadding?: number | string | { xs?: number | string; sm?: number | string; md?: number | string; lg?: number | string };
  // borderRadius?: number;
  withGradient?: boolean;
  paperSx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

const defaultOuterPadding = { xs: 1.5, sm: 2.5, md: 3 };
const defaultContentPadding = { xs: 2.5, sm: 3, md: 4 };

export function JBContentContainer(props: JBContentContainerProps) {
  const {
    children,
    header,
    animated = true,
    animationDelayMs = 0,
    animationDurationMs = 260,
    padding = defaultOuterPadding,
    contentPadding = defaultContentPadding,
    // borderRadius = 3,
    withGradient = false,
    paperSx,
    headerSx,
    contentSx
  } = props;

  return (
    <Box
      className="w-full h-full"
      sx={{ p: padding }}
    >
      <Box
        sx={
          animated
            ? {
                '@keyframes jbFadeSlideIn': {
                  from: { opacity: 0, transform: 'translateY(14px)' },
                  to: { opacity: 1, transform: 'translateY(0)' }
                },
                animation: `jbFadeSlideIn ${animationDurationMs}ms ease-out ${animationDelayMs}ms both`
              }
            : undefined
        }
      >
        <Paper
          elevation={0}
          sx={[
            (theme) => ({
              position: 'relative',
              overflow: 'hidden',
              // borderRadius,
              // border: `1px solid ${theme.palette.divider}`,
              background: withGradient
                ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
                : theme.palette.background.paper
            }),
            ...(Array.isArray(paperSx) ? paperSx : paperSx ? [paperSx] : [])
          ]}
        >
          {header ? (
            <Box
              sx={[
                {
                  px: { xs: 2, sm: 3, md: 4 },
                  pt: { xs: 2, sm: 2.5 },
                  pb: 0.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                },
                ...(Array.isArray(headerSx) ? headerSx : headerSx ? [headerSx] : [])
              ]}
            >
              {header}
            </Box>
          ) : null}

          <Box
            sx={[
              { px: contentPadding, py: contentPadding },
              ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : [])
            ]}
          >
            {children}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

