import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { AddOutlined, EditOutlined, SwapVertOutlined } from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { useDebouncedValue } from '../app/useDebouncedValue';
import { useFeedback } from '../app/FeedbackProvider';
import { PageHeader } from '../components/PageHeader';
import { ListToolbar } from '../components/ListToolbar';
import { EmptyState, ErrorState, TableLoading } from '../components/TableStates';
import { TablePaginationBar } from '../components/TablePaginationBar';
import { useAuth } from '../features/auth/AuthProvider';
import { INVENTORY_KEYS } from '../features/inventory/inventoryKeys';
import { ProductDialog, type ProductFormValues } from '../features/inventory/ProductDialog';
import {
  StockAdjustmentDialog,
  type StockAdjustmentValues,
} from '../features/inventory/StockAdjustmentDialog';
import type { ApiItem, ApiList, Product, Warehouse } from '../types';

export function ProductsPage() {
  const [urlParams] = useSearchParams();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(urlParams.get('lowStock') === 'true');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [productDialog, setProductDialog] = useState(false);
  const [stockDialog, setStockDialog] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const params = { page, limit, search: debouncedSearch, lowStock: lowStock || undefined };

  const products = useQuery({
    queryKey: INVENTORY_KEYS.productList(params),
    queryFn: async () => (await api.get<ApiList<Product>>('/products', { params })).data,
  });
  const warehouses = useQuery({
    queryKey: INVENTORY_KEYS.warehouses,
    queryFn: async () => (await api.get<ApiItem<Warehouse[]>>('/warehouses')).data.data,
  });
  const saveProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (selected) {
        const { openingStock: _openingStock, ...update } = values;
        return (await api.patch<ApiItem<Product>>(`/products/${selected.id}`, update)).data;
      }
      return (await api.post<ApiItem<Product>>('/products', values)).data;
    },
    onSuccess: (result) => {
      feedback.show(result.message ?? 'Product saved');
      setProductDialog(false);
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products });
      void queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });
  const adjustStock = useMutation({
    mutationFn: async (values: StockAdjustmentValues) =>
      (await api.post<ApiItem<unknown>>(`/products/${selected!.id}/stock-adjustments`, values)).data,
    onSuccess: (result) => {
      feedback.show(result.message ?? 'Stock movement recorded');
      setStockDialog(false);
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products });
      void queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });

  return (
    <>
      <PageHeader
        title="Products & stock"
        description="Maintain product masters, warehouse balances, and minimum-stock thresholds."
        action={can('ADMIN', 'WAREHOUSE') ? (
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setSelected(null); setProductDialog(true); }}>
            Add product
          </Button>
        ) : undefined}
      />
      <Paper variant="outlined">
        <ListToolbar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search product, SKU, or category"
          filters={(
            <FormControlLabel
              control={<Switch checked={lowStock} onChange={(event) => { setLowStock(event.target.checked); setPage(1); }} />}
              label="Low stock only"
              sx={{ ml: { md: 'auto' } }}
            />
          )}
        />
        {products.isPending ? <TableLoading /> : products.isError ? (
          <ErrorState message={getApiError(products.error)} onRetry={() => void products.refetch()} />
        ) : products.data.data.length === 0 ? (
          <EmptyState
            title="No products found"
            description={search || lowStock ? 'Adjust your search or turn off the low-stock filter.' : 'Add the first product and its opening stock to begin the inventory ledger.'}
          />
        ) : (
          <>
            <TableContainer aria-label="Product inventory">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell>Stock state</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.data.data.map((product) => {
                    const isLow = product.currentStock <= product.minimumStock;
                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Typography fontWeight={650}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.sku}</Typography>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{product.warehouse.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{product.warehouse.location}</Typography>
                        </TableCell>
                        <TableCell align="right" className="tabular">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(product.unitPrice))}
                        </TableCell>
                        <TableCell align="right" className="tabular">
                          <Typography fontWeight={700} color={isLow ? 'error.main' : 'text.primary'}>{product.currentStock}</Typography>
                          <Typography variant="caption" color="text.secondary">Minimum {product.minimumStock}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={isLow ? 'Reorder needed' : 'In range'}
                            color={isLow ? 'error' : 'success'}
                            variant={isLow ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {can('ADMIN', 'WAREHOUSE') && (
                            <>
                              <Tooltip title="Record stock movement">
                                <IconButton
                                  onClick={() => { setSelected(product); setStockDialog(true); }}
                                  aria-label={`Record stock movement for ${product.name}`}
                                >
                                  <SwapVertOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit product">
                                <IconButton
                                  onClick={() => { setSelected(product); setProductDialog(true); }}
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePaginationBar
              total={products.data.meta.total}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(next) => { setLimit(next); setPage(1); }}
            />
          </>
        )}
      </Paper>
      {warehouses.isError && <Alert severity="error" sx={{ mt: 2 }}>Warehouses could not be loaded. Product editing is unavailable.</Alert>}
      <ProductDialog
        open={productDialog}
        product={selected}
        warehouses={warehouses.data ?? []}
        loading={saveProduct.isPending}
        onClose={() => { setProductDialog(false); setSelected(null); }}
        onSubmit={async (values) => { await saveProduct.mutateAsync(values); }}
      />
      <StockAdjustmentDialog
        open={stockDialog}
        product={selected}
        loading={adjustStock.isPending}
        onClose={() => { setStockDialog(false); setSelected(null); }}
        onSubmit={async (values) => { await adjustStock.mutateAsync(values); }}
      />
    </>
  );
}

