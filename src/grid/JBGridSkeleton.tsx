import { Box, Skeleton } from '@mui/material';

type JBGridSkeletonProps = {
  rows?: number;
  showToolbar?: boolean;
};

export function JBGridSkeleton(props: JBGridSkeletonProps) {
  const { rows = 8, showToolbar = true } = props;

  return (
    <Box sx={{ width: '100%', p: 1.5 }}>
      {showToolbar ? (
        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
          <Skeleton variant="rounded" width={240} height={36} />
          <Skeleton variant="rounded" width={160} height={36} />
        </Box>
      ) : null}

      <Skeleton variant="rounded" width="100%" height={44} />

      <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            width="100%"
            height={40}
          />
        ))}
      </Box>
    </Box>
  );
}

