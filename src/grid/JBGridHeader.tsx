import { Box, Button, InputBase, Paper, Typography } from '@mui/material';

import { JBGridHeaderProps } from './types';

export function JBGridHeader(props: JBGridHeaderProps) {
  const {
    moduleConfig,
    iconNameRenderer,
    breadcrumb,
    title,
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
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? moduleConfig?.texts?.searchPlaceholder ?? 'Search...';
  const resolvedCreateLabel = createButtonLabel ?? moduleConfig?.texts?.newText ?? 'Create';
  const resolvedIcon =
    icon ?? (moduleConfig?.texts?.iconName && iconNameRenderer
      ? iconNameRenderer(moduleConfig.texts.iconName)
      : null);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2
      }}>
      {breadcrumb ? <Box>{breadcrumb}</Box> : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {resolvedIcon}
        <Typography
          variant="h5"
          sx={{ fontWeight: 700 }}>
          {resolvedTitle}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: { xs: '100%', sm: 'auto' }
        }}>
        <Paper
          sx={{
            px: 1.5,
            py: 0.5,
            width: { xs: '100%', sm: 300 }
          }}>
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
            onClick={onCreateClick}>
            {resolvedCreateLabel}
          </Button>
        ) : null}
      </Box>
      </Box>
    </Box>
  );
}
