import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, EditOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { useDebouncedValue } from '../app/useDebouncedValue';
import { useFeedback } from '../app/FeedbackProvider';
import { PageHeader } from '../components/PageHeader';
import { ListToolbar } from '../components/ListToolbar';
import { StatusChip } from '../components/StatusChip';
import { EmptyState, ErrorState, TableLoading } from '../components/TableStates';
import { TablePaginationBar } from '../components/TablePaginationBar';
import { useAuth } from '../features/auth/AuthProvider';
import { CustomerDialog, type CustomerFormValues } from '../features/customers/CustomerDialog';
import { CUSTOMER_KEYS } from '../features/customers/customerKeys';
import type { ApiItem, ApiList, Customer } from '../types';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const params = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status || undefined,
    type: type || undefined,
  };

  const customers = useQuery({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: async () => (await api.get<ApiList<Customer>>('/customers', { params })).data,
  });
  const saveCustomer = useMutation({
    mutationFn: async (values: CustomerFormValues) => selected
      ? (await api.patch<ApiItem<Customer>>(`/customers/${selected.id}`, values)).data
      : (await api.post<ApiItem<Customer>>('/customers', values)).data,
    onSuccess: (result) => {
      feedback.show(result.message ?? 'Customer saved');
      setDialogOpen(false);
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });

  const openCreate = () => {
    setSelected(null);
    setDialogOpen(true);
  };
  const openEdit = (customer: Customer) => {
    setSelected(customer);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage leads, active buyers, business details, and the next follow-up."
        action={can('ADMIN', 'SALES') ? (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={openCreate}>Add customer</Button>
        ) : undefined}
      />
      <Paper variant="outlined">
        <ListToolbar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search customers, mobile, business, or GST"
          filters={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flex={1}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="customer-status-filter">Status</InputLabel>
                <Select
                  labelId="customer-status-filter"
                  label="Status"
                  value={status}
                  onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                >
                  <MenuItem value="">All statuses</MenuItem>
                  <MenuItem value="LEAD">Lead</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel id="customer-type-filter">Type</InputLabel>
                <Select
                  labelId="customer-type-filter"
                  label="Type"
                  value={type}
                  onChange={(event) => { setType(event.target.value); setPage(1); }}
                >
                  <MenuItem value="">All types</MenuItem>
                  <MenuItem value="RETAIL">Retail</MenuItem>
                  <MenuItem value="WHOLESALE">Wholesale</MenuItem>
                  <MenuItem value="DISTRIBUTOR">Distributor</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        />
        {customers.isPending ? <TableLoading /> : customers.isError ? (
          <ErrorState message={getApiError(customers.error)} onRetry={() => void customers.refetch()} />
        ) : customers.data.data.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={search || status || type ? 'Adjust your search or filters to see more records.' : 'Add the first customer to begin CRM follow-ups and sales challans.'}
            action={!search && !status && !type && can('ADMIN', 'SALES') ? <Button onClick={openCreate}>Add customer</Button> : undefined}
          />
        ) : (
          <>
            <TableContainer aria-label="Customer records">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Next follow-up</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.data.data.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Typography fontWeight={650}>{customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.businessName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{customer.mobile}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.email || 'No email'}</Typography>
                      </TableCell>
                      <TableCell>{customer.type.toLowerCase().replace(/^./, (char) => char.toUpperCase())}</TableCell>
                      <TableCell><StatusChip status={customer.status} /></TableCell>
                      <TableCell className="tabular">
                        {customer.followUpDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(customer.followUpDate)) : 'Not scheduled'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Open customer">
                          <IconButton component={RouterLink} to={`/customers/${customer.id}`} aria-label={`Open ${customer.name}`}>
                            <OpenInNewOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {can('ADMIN', 'SALES') && (
                          <Tooltip title="Edit customer">
                            <IconButton onClick={() => openEdit(customer)} aria-label={`Edit ${customer.name}`}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePaginationBar
              total={customers.data.meta.total}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
            />
          </>
        )}
      </Paper>
      <CustomerDialog
        open={dialogOpen}
        customer={selected}
        loading={saveCustomer.isPending}
        onClose={() => { setDialogOpen(false); setSelected(null); }}
        onSubmit={async (values) => { await saveCustomer.mutateAsync(values); }}
      />
    </>
  );
}
