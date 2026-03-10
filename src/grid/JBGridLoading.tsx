import { Box, CircularProgress, Typography } from '@mui/material';

type JBGridLoadingProps = {
  minHeight?: number;
  size?: number;
  message?: string;
  color?: 'primary' | 'secondary' | 'inherit';
};

export function JBGridLoading(props: JBGridLoadingProps) {
  const { minHeight = 320, size = 40, message, color = 'primary' } = props;

  return (
    <Box
      sx={{
        width: '100%',
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25
      }}>
      <CircularProgress
        size={size}
        color={color}
      />
      {message ? (
        <Typography
          variant="body2"
          color="text.secondary">
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}
