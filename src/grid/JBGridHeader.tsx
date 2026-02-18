import { Box, Button, InputBase, Paper, Typography } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import { JBGridHeaderProps } from './types';

export function JBGridHeader(props: JBGridHeaderProps) {
  const {
    moduleConfig,
    iconNameRenderer,
    animated = true,
    animationDurationMs = 240,
    animationStaggerMs = 60,
    animationPreset = 'vertical',
    breadcrumb,
    title,
    subtitle,
    icon,
    searchText,
    onSearchTextChange,
    searchPlaceholder,
    allowCreate = true,
    createButtonLabel,
    onCreateClick,
    rightContent
  } = props;

  const resolvedTitle = title ?? moduleConfig?.texts?.moduleName ?? '';
  const resolvedSubtitle = subtitle ?? moduleConfig?.texts?.formHeaderSubtitle ?? '';
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? moduleConfig?.texts?.searchPlaceholder ?? 'Search...';
  const resolvedCreateLabel = createButtonLabel ?? moduleConfig?.texts?.newText ?? 'Create';
  const resolvedIcon =
    icon ?? (moduleConfig?.texts?.iconName && iconNameRenderer
      ? iconNameRenderer(moduleConfig.texts.iconName)
      : null);
  const animateSx = (delayMs: number) =>
    animated
      ? {
          animation: `jbGridHeaderFadeIn ${animationDurationMs}ms ease-out ${delayMs}ms both`
        }
      : undefined;
  const animateFromLeftSx = (delayMs: number) =>
    animated && animationPreset === 'sides'
      ? {
          animation: `jbGridHeaderFadeInLeft ${animationDurationMs}ms ease-out ${delayMs}ms both`
        }
      : animateSx(delayMs);
  const animateFromRightSx = (delayMs: number) =>
    animated && animationPreset === 'sides'
      ? {
          animation: `jbGridHeaderFadeInRight ${animationDurationMs}ms ease-out ${delayMs}ms both`
        }
      : animateSx(delayMs);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: { xs: 2, sm: 3 },
        '@keyframes jbGridHeaderFadeIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        '@keyframes jbGridHeaderFadeInLeft': {
          from: { opacity: 0, transform: 'translateX(-14px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        },
        '@keyframes jbGridHeaderFadeInRight': {
          from: { opacity: 0, transform: 'translateX(14px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        }
      }}>
      {breadcrumb ? <Box sx={animateSx(0)}>{breadcrumb}</Box> : null}

      <Box
        sx={{
          display: { xs: 'flex', sm: 'grid' },
          flexDirection: { xs: 'column', sm: 'row' },
          gridTemplateColumns: { sm: 'minmax(0, 1fr) auto' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          width: '100%'
        }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
          ...animateFromLeftSx(animationStaggerMs)
        }}>
        {resolvedIcon ? <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>{resolvedIcon}</Box> : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, lineHeight: 1.15 }}>
            {resolvedTitle}
          </Typography>
          {resolvedSubtitle ? (
            <Typography
              variant="body2"
              color="text.secondary">
              {resolvedSubtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box
        sx={{
          width: { xs: '100%', sm: 'auto' },
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifySelf: { sm: 'end' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          flexWrap: 'wrap',
          gap: 1,
          minWidth: 0,
          ...animateFromRightSx(animationStaggerMs * 2)
        }}>
        <Paper
          sx={{
            px: 1.5,
            py: 0.5,
            width: { xs: '100%', sm: 320 },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderRadius: 1.5
          }}>
          <SearchRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <InputBase
            fullWidth
            placeholder={resolvedSearchPlaceholder}
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
          />
        </Paper>

        {rightContent}

        {allowCreate && onCreateClick ? (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon fontSize="small" />}
            sx={(theme) => ({
              borderRadius: 1.5,
              minHeight: 42,
              px: 2.25,
              fontWeight: 700,
              boxShadow: 'none',
              backgroundImage: 'none',
              '&:hover': {
                boxShadow: 'none',
                backgroundImage: 'none',
                backgroundColor: theme.palette.primary.dark
              }
            })}
            onClick={onCreateClick}>
            {resolvedCreateLabel}
          </Button>
        ) : null}
      </Box>
      </Box>
    </Box>
  );
}
