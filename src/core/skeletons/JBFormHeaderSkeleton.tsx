import { Box, Skeleton } from '@mui/material';

export type JBFormHeaderSkeletonProps = {
  showBackLink?: boolean;
  showActions?: boolean;
};

export function JBFormHeaderSkeleton(props: JBFormHeaderSkeletonProps) {
  const { showBackLink = true, showActions = true } = props;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: { xs: 2, sm: 3 }
      }}>
      <Skeleton
        variant="rounded"
        width={300}
        height={28}
      />

      {showBackLink ? (
        <Skeleton
          variant="text"
          width={170}
          height={30}
        />
      ) : null}

      <Box
        sx={{
          display: { xs: 'flex', sm: 'grid' },
          flexDirection: { xs: 'column', sm: 'row' },
          gridTemplateColumns: { sm: 'minmax(0, 1fr) auto' },
          alignItems: { xs: 'stretch', sm: 'center' },
          width: '100%',
          gap: 2
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <Skeleton
            variant="circular"
            width={30}
            height={30}
          />
          <Box sx={{ minWidth: 0 }}>
            <Skeleton
              variant="text"
              width={280}
              height={52}
            />
            <Skeleton
              variant="text"
              width={240}
              height={30}
            />
          </Box>
        </Box>

        {showActions ? (
          <Box sx={{ display: 'flex', gap: 1, justifySelf: { sm: 'end' } }}>
            <Skeleton
              variant="rounded"
              width={116}
              height={42}
            />
            <Skeleton
              variant="rounded"
              width={116}
              height={42}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

