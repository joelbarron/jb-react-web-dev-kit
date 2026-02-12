import { Box, Button, InputBase, Paper, Typography } from '@mui/material';

import { JBGridHeaderProps } from './types';

export function JBGridHeader(props: JBGridHeaderProps) {
  const {
    title,
    icon,
    searchText,
    onSearchTextChange,
    searchPlaceholder = 'Search...',
    allowCreate = true,
    createButtonLabel = 'Create',
    onCreateClick,
    rightContent
  } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        p: 2
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography
          variant="h5"
          sx={{ fontWeight: 700 }}>
          {title}
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
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
          />
        </Paper>

        {rightContent}

        {allowCreate && onCreateClick ? (
          <Button
            variant="contained"
            onClick={onCreateClick}>
            {createButtonLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

