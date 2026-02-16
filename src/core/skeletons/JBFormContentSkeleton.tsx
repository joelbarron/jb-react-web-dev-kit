import { Box, Skeleton } from '@mui/material';

export type JBFormContentSkeletonProps = {
  fieldCount?: number;
};

export function JBFormContentSkeleton(props: JBFormContentSkeletonProps) {
  const { fieldCount = 4 } = props;
  const fields = Array.from({ length: fieldCount });

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
      {fields.map((_, index) => (
        <Box
          key={index}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton
            variant="text"
            width={140}
            height={24}
          />
          <Skeleton
            variant="rounded"
            width="100%"
            height={44}
          />
        </Box>
      ))}
    </Box>
  );
}

