import type { ReactNode } from 'react';
import { InputAdornment, Stack, TextField } from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';

export function ListToolbar({
  search,
  onSearchChange,
  placeholder,
  filters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  filters?: ReactNode;
}) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} p={2} alignItems={{ md: 'center' }}>
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        sx={{ maxWidth: { md: 420 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>
          ),
        }}
      />
      {filters}
    </Stack>
  );
}

