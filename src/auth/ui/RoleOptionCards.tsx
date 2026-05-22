import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export type RoleCardOption = {
  value: string;
  label: string;
  description?: string;
};

export type RoleOptionCardsProps = {
  options: RoleCardOption[];
  value: string;
  onChange: (value: string) => void;
};

export function RoleOptionCards({ options, value, onChange }: RoleOptionCardsProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Box
            key={option.value}
            role='radio'
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(option.value);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              px: 2.5,
              py: 2,
              borderRadius: 3,
              border: '2px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              backgroundColor: isSelected
                ? (theme) => `${theme.palette.primary.main}14`
                : 'background.paper',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.18s, background-color 0.18s',
              '&:hover': {
                borderColor: isSelected ? 'primary.main' : 'primary.light',
                backgroundColor: isSelected
                  ? (theme) => `${theme.palette.primary.main}14`
                  : 'action.hover',
              },
              '&:focus-visible': {
                boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}40`,
              },
            }}
          >
            {/* Indicador radio */}
            <Box
              sx={{
                mt: 0.3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'text.disabled',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected && (
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
              )}
            </Box>

            {/* Label + descripción */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant='body1'
                fontWeight={600}
                color={isSelected ? 'primary.main' : 'text.primary'}
                lineHeight={1.3}
              >
                {option.label}
              </Typography>
              {option.description ? (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 0.5, lineHeight: 1.4 }}
                >
                  {option.description}
                </Typography>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
