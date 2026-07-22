import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { useDebouncedValue } from '../app/useDebouncedValue';
import { PageHeader } from '../components/PageHeader';
import { ListToolbar } from '../components/ListToolbar';
import { StatusChip } from '../components/StatusChip';
import { EmptyState, ErrorState, TableLoading } from '../components/TableStates';
import { TablePaginationBar } from '../components/TablePaginationBar';
import { useAuth } from '../features/auth/AuthProvider';
import { CHALLAN_KEYS } from '../features/challans/challanKeys';
import type { ApiList, Challan } from '../types';

export function ChallansPage() {
  const [urlParams] = useSearchParams();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(urlParams.get('status') ?? '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const debouncedSearch = useDebouncedValue(search);
  const params = { page, limit, search: debouncedSearch, status };
  const challans = useQuery({
    queryKey: CHALLAN_KEYS.list(params),
    queryFn: async () => (await api.get<ApiList<Challan>>('/challans', { params })).data,
  });

  return (
    <>
      <PageHeader
        title="Sales challans"
        description="Prepare dispatch lines, preserve product snapshots, and track every stock-affecting status change."
        action={can('ADMIN', 'SALES') ? (
          <Button component={RouterLink} to="/challans/new" variant="contained" startIcon={<AddOutlined />}>
            Create challan
          </Button>
        ) : undefined}
      />
      <Paper variant="outlined">
        <ListToolbar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search challan number or customer"
          filters={(
            <FormControl sx={{ minWidth: 170 }}>
              <InputLabel id="challan-status-filter">Status</InputLabel>
              <Select
                labelId="challan-status-filter"
                label="Status"
                value={status}
                onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          )}
        />
        {challans.isPending ? <TableLoading /> : challans.isError ? (
          <ErrorState message={getApiError(challans.error)} onRetry={() => void challans.refetch()} />
        ) : challans.data.data.length === 0 ? (
          <EmptyState
            title="No challans found"
            description={search || status ? 'Adjust your search or status filter.' : 'Create a sales challan when a customer is ready for dispatch.'}
            action={!search && !status && can('ADMIN', 'SALES') ? (
              <Button component={RouterLink} to="/challans/new">Create challan</Button>
            ) : undefined}
          />
        ) : (
          <>
            <TableContainer aria-label="Sales challans">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Challan</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Products</TableCell>
                    <TableCell align="right">Total quantity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {challans.data.data.map((challan) => (
                    <TableRow key={challan.id} hover>
                      <TableCell>
                        <Typography fontWeight={700} className="tabular">{challan.challanNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">by {challan.createdBy.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={650}>{challan.customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{challan.customer.businessName}</Typography>
                      </TableCell>
                      <TableCell align="right" className="tabular">{challan.items.length}</TableCell>
                      <TableCell align="right" className="tabular">{challan.totalQuantity}</TableCell>
                      <TableCell><StatusChip status={challan.status} /></TableCell>
                      <TableCell className="tabular">
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(challan.createdAt))}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Open challan">
                          <IconButton component={RouterLink} to={`/challans/${challan.id}`} aria-label={`Open ${challan.challanNumber}`}>
                            <OpenInNewOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePaginationBar
              total={challans.data.meta.total}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(next) => { setLimit(next); setPage(1); }}
            />
          </>
        )}
      </Paper>
    </>
  );
}

