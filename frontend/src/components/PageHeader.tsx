import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'flex-start' }}
      spacing={2}
      mb={3}
    >
      <Box>
        <Typography component="h1" variant="h1" sx={{ textWrap: 'balance' }}>{title}</Typography>
        <Typography color="text.secondary" mt={0.75} maxWidth="72ch">{description}</Typography>
      </Box>
      {action && <Box flexShrink={0}>{action}</Box>}
    </Stack>
  );
}

