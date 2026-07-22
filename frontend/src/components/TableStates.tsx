import { Box, Button, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';
import { InboxOutlined, RefreshOutlined } from '@mui/icons-material';

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <Stack gap={1.5} p={2} aria-label="Loading records">
      {Array.from({ length: rows }, (_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
    </Stack>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Box textAlign="center" px={2} py={7}>
      <InboxOutlined color="disabled" sx={{ fontSize: 40 }} />
      <Typography variant="h2" mt={1.5}>{title}</Typography>
      <Typography color="text.secondary" mt={0.75} mx="auto" maxWidth="48ch">{description}</Typography>
      {action && <Box mt={2}>{action}</Box>}
    </Box>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Box textAlign="center" px={2} py={6} role="alert">
      <Typography variant="h2">We couldn’t load this view</Typography>
      <Typography color="text.secondary" mt={0.75}>{message}</Typography>
      <Button startIcon={<RefreshOutlined />} onClick={onRetry} sx={{ mt: 2 }}>Try again</Button>
    </Box>
  );
}

export function PageLoading() {
  return (
    <Box minHeight={320} display="grid" sx={{ placeItems: 'center' }}>
      <CircularProgress size={28} aria-label="Loading page" />
    </Box>
  );
}

