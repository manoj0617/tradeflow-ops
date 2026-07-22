import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ArrowBackOutlined, BlockOutlined, TaskAltOutlined } from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { useFeedback } from '../app/FeedbackProvider';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { ErrorState, PageLoading } from '../components/TableStates';
import { useAuth } from '../features/auth/AuthProvider';
import { CHALLAN_KEYS } from '../features/challans/challanKeys';
import { INVENTORY_KEYS } from '../features/inventory/inventoryKeys';
import type { ApiItem, Challan } from '../types';

export function ChallanDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  const { can } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const challan = useQuery({
    queryKey: CHALLAN_KEYS.detail(id),
    queryFn: async () => (await api.get<ApiItem<Challan>>(`/challans/${id}`)).data.data,
    enabled: Boolean(id),
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CHALLAN_KEYS.all }),
      queryClient.invalidateQueries({ queryKey: CHALLAN_KEYS.detail(id) }),
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products }),
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };
  const confirm = useMutation({
    mutationFn: async () => (await api.post<ApiItem<Challan>>(`/challans/${id}/confirm`)).data,
    onSuccess: async (result) => {
      feedback.show(result.message ?? 'Challan confirmed');
      setConfirmOpen(false);
      await refresh();
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });
  const cancel = useMutation({
    mutationFn: async () => (await api.post<ApiItem<Challan>>(`/challans/${id}/cancel`, { reason: cancelReason })).data,
    onSuccess: async (result) => {
      feedback.show(result.message ?? 'Challan cancelled');
      setCancelOpen(false);
      setCancelReason('');
      await refresh();
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });

  if (challan.isPending) return <PageLoading />;
  if (challan.isError || !challan.data) {
    return <ErrorState message={getApiError(challan.error, 'Challan not found')} onRetry={() => void challan.refetch()} />;
  }

  const record = challan.data;
  const totalValue = record.items.reduce((total, item) => total + Number(item.snapshotUnitPrice) * item.quantity, 0);
  const summaryItems: Array<[string, string]> = [
    ['Customer mobile', record.customer.mobile],
    ['Created by', record.createdBy.name],
    ['Created date', new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date(record.createdAt))],
    ['Total quantity', String(record.totalQuantity)],
  ];

  return (
    <>
      <Link component={RouterLink} to="/challans" underline="hover" display="inline-flex" alignItems="center" gap={0.75} mb={2}>
        <ArrowBackOutlined fontSize="small" /> Sales challans
      </Link>
      <PageHeader
        title={record.challanNumber}
        description={`${record.customer.name} · ${record.customer.businessName}`}
        action={<StatusChip status={record.status} />}
      />
      {record.status === 'CANCELLED' && (
        <Alert severity="error" sx={{ mb: 3 }}>Cancelled: {record.cancellationReason}</Alert>
      )}
      <Stack spacing={3}>
        <Paper variant="outlined">
          <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }}>
            {summaryItems.map(([label, value]) => (
              <Box key={label} p={2.5}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography mt={0.5} fontWeight={650} className={label.includes('quantity') ? 'tabular' : undefined}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper variant="outlined">
          <Box p={2.5}>
            <Typography variant="h2">Product snapshot</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>These names, SKUs, and prices are preserved from the time this challan was created.</Typography>
          </Box>
          <Divider />
          <TableContainer aria-label="Challan product snapshot">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Snapshot price</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Line value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {record.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography fontWeight={650}>{item.snapshotProductName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.snapshotSku}</Typography>
                    </TableCell>
                    <TableCell align="right" className="tabular">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(item.snapshotUnitPrice))}
                    </TableCell>
                    <TableCell align="right" className="tabular">{item.quantity}</TableCell>
                    <TableCell align="right" className="tabular">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(item.snapshotUnitPrice) * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right"><Typography fontWeight={700}>Snapshot total</Typography></TableCell>
                  <TableCell align="right" className="tabular">
                    <Typography fontWeight={750}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalValue)}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {can('ADMIN', 'SALES') && record.status !== 'CANCELLED' && (
          <Paper variant="outlined">
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} p={2.5} spacing={2}>
              <Box>
                <Typography variant="h2">{record.status === 'DRAFT' ? 'Ready to dispatch?' : 'Need to reverse this dispatch?'}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {record.status === 'DRAFT'
                    ? 'Confirmation deducts stock for every product in one transaction.'
                    : 'Cancellation restores stock and writes compensating IN movements.'}
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
                <Button color="error" startIcon={<BlockOutlined />} onClick={() => setCancelOpen(true)}>
                  Cancel challan
                </Button>
                {record.status === 'DRAFT' && (
                  <Button variant="contained" startIcon={<TaskAltOutlined />} onClick={() => setConfirmOpen(true)}>
                    Confirm challan
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
      <ConfirmActionDialog
        open={confirmOpen}
        title="Confirm challan and deduct stock?"
        description={`This will deduct ${record.totalQuantity} units. If any product is short, no stock will change.`}
        confirmLabel="Confirm and deduct stock"
        loading={confirm.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => confirm.mutate()}
      />
      <ConfirmActionDialog
        open={cancelOpen}
        title="Cancel this challan?"
        description={record.status === 'CONFIRMED'
          ? 'The deducted quantities will be restored through compensating stock movements.'
          : 'The draft will be closed without changing stock.'}
        confirmLabel="Cancel challan"
        severity="error"
        reason={cancelReason}
        reasonLabel="Cancellation reason"
        onReasonChange={setCancelReason}
        loading={cancel.isPending}
        onClose={() => { setCancelOpen(false); setCancelReason(''); }}
        onConfirm={() => cancel.mutate()}
      />
    </>
  );
}
