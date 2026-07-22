import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export function NotFoundPage() {
  return (
    <Box minHeight={420} display="grid" textAlign="center" sx={{ placeItems: 'center' }}>
      <div>
        <Typography component="h1" variant="h1">Page not found</Typography>
        <Typography color="text.secondary" mt={1}>The address may be incorrect or the record may no longer be available.</Typography>
        <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2.5 }}>Return to overview</Button>
      </div>
    </Box>
  );
}

