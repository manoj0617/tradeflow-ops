import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FormControl,
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
  Typography,
} from '@mui/material';
import { api, getApiError } from '../api/client';
import { useDebouncedValue } from '../app/useDebouncedValue';
import { PageHeader } from '../components/PageHeader';
import { ListToolbar } from '../components/ListToolbar';
import { StatusChip } from '../components/StatusChip';
import { EmptyState, ErrorState, TableLoading } from '../components/TableStates';
import { TablePaginationBar } from '../components/TablePaginationBar';
import { INVENTORY_KEYS } from '../features/inventory/inventoryKeys';
import type { ApiList, StockMovement } from '../types';

export function StockMovementsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const debouncedSearch = useDebouncedValue(search);
  const params = { page, limit, search: debouncedSearch, type };
  const movements = useQuery({
    queryKey: INVENTORY_KEYS.movementList(params),
    queryFn: async () => (await api.get<ApiList<StockMovement>>('/stock-movements', { params })).data,
  });

  return (
    <>
      <PageHeader title="Stock movement ledger" description="An immutable view of quantities moving in and out, with balance, reason, operator, and source record." />
      <Paper variant="outlined">
        <ListToolbar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search product, SKU, reason, or reference"
          filters={(
            <FormControl sx={{ minWidth: 170 }}>
              <InputLabel id="movement-type-filter">Movement</InputLabel>
              <Select
                labelId="movement-type-filter"
                label="Movement"
                value={type}
                onChange={(event) => { setType(event.target.value); setPage(1); }}
              >
                <MenuItem value="">All movements</MenuItem>
                <MenuItem value="IN">Stock in</MenuItem>
                <MenuItem value="OUT">Stock out</MenuItem>
              </Select>
            </FormControl>
          )}
        />
        {movements.isPending ? <TableLoading /> : movements.isError ? (
          <ErrorState message={getApiError(movements.error)} onRetry={() => void movements.refetch()} />
        ) : movements.data.data.length === 0 ? (
          <EmptyState title="No movements found" description="Stock movements will appear here after opening stock, manual adjustments, or challan confirmation." />
        ) : (
          <>
            <TableContainer aria-label="Stock movement ledger">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Movement</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Balance after</TableCell>
                    <TableCell>Reason / reference</TableCell>
                    <TableCell>Created by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.data.data.map((movement) => (
                    <TableRow key={movement.id} hover>
                      <TableCell className="tabular">
                        {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(movement.createdAt))}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={650}>{movement.product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{movement.product.sku}</Typography>
                      </TableCell>
                      <TableCell><StatusChip status={movement.type} /></TableCell>
                      <TableCell align="right" className="tabular">{movement.quantity}</TableCell>
                      <TableCell align="right" className="tabular">{movement.balanceAfter}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{movement.reason}</Typography>
                        {movement.referenceNumber && <Typography variant="caption" color="text.secondary">{movement.referenceNumber}</Typography>}
                      </TableCell>
                      <TableCell>{movement.createdBy.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePaginationBar
              total={movements.data.meta.total}
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

