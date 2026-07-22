import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddOutlined,
  ArrowBackOutlined,
  DeleteOutline,
  Inventory2Outlined,
  SaveOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { useFeedback } from '../app/FeedbackProvider';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { PageLoading } from '../components/TableStates';
import { CUSTOMER_KEYS } from '../features/customers/customerKeys';
import { INVENTORY_KEYS } from '../features/inventory/inventoryKeys';
import type { ApiItem, ApiList, Challan, Customer, Product } from '../types';

const challanFormSchema = z.object({
  customerId: z.string().uuid('Select a customer'),
  items: z.array(z.object({
    productId: z.string().uuid('Select a product'),
    quantity: z.number().int().positive('Quantity must be at least one'),
  })).min(1, 'Add at least one product'),
});
type ChallanFormValues = z.infer<typeof challanFormSchema>;

export function ChallanCreatePage() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<ChallanFormValues | null>(null);
  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<ChallanFormValues>({
    resolver: zodResolver(challanFormSchema),
    defaultValues: { customerId: '', items: [{ productId: '', quantity: 1 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const customers = useQuery({
    queryKey: CUSTOMER_KEYS.list({ page: 1, limit: 100, status: 'ACTIVE' }),
    queryFn: async () => (await api.get<ApiList<Customer>>('/customers', { params: { page: 1, limit: 100, status: 'ACTIVE' } })).data.data,
  });
  const products = useQuery({
    queryKey: INVENTORY_KEYS.productList({ page: 1, limit: 100 }),
    queryFn: async () => (await api.get<ApiList<Product>>('/products', { params: { page: 1, limit: 100 } })).data.data,
  });
  const create = useMutation({
    mutationFn: async ({ values, status }: { values: ChallanFormValues; status: 'DRAFT' | 'CONFIRMED' }) =>
      (await api.post<ApiItem<Challan>>('/challans', { ...values, status })).data,
    onSuccess: (result) => {
      feedback.show(result.message ?? 'Challan created');
      navigate(`/challans/${result.data.id}`, { replace: true });
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });

  const selectedProductIds = watchedItems.map((item) => item.productId).filter(Boolean);
  const totals = useMemo(() => watchedItems.reduce((result, item) => {
    const product = products.data?.find((candidate) => candidate.id === item.productId);
    const quantity = Number(item.quantity) || 0;
    return {
      quantity: result.quantity + quantity,
      value: result.value + (product ? Number(product.unitPrice) * quantity : 0),
    };
  }, { quantity: 0, value: 0 }), [products.data, watchedItems]);

  const saveDraft = handleSubmit((values) => create.mutate({ values, status: 'DRAFT' }));
  const prepareConfirm = handleSubmit((values) => {
    setPendingValues(values);
    setConfirmOpen(true);
  });

  if (customers.isPending || products.isPending) return <PageLoading />;

  return (
    <>
      <Link component={RouterLink} to="/challans" underline="hover" display="inline-flex" alignItems="center" gap={0.75} mb={2}>
        <ArrowBackOutlined fontSize="small" /> Sales challans
      </Link>
      <PageHeader title="Create sales challan" description="Build the dispatch record, verify availability, then save a draft or confirm the stock deduction." />
      {(customers.isError || products.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>Customers or products could not be loaded. Refresh the page before continuing.</Alert>
      )}
      <Box component="form" noValidate>
        <Stack spacing={3}>
          <Paper variant="outlined">
            <Box p={2.5}>
              <Typography variant="h2">Customer</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5} mb={2}>Only active customers can receive a challan.</Typography>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <FormControl error={Boolean(errors.customerId)} sx={{ maxWidth: 560 }}>
                    <InputLabel id="challan-customer-label">Customer</InputLabel>
                    <Select {...field} labelId="challan-customer-label" label="Customer">
                      {(customers.data ?? []).map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>{customer.name} · {customer.businessName}</MenuItem>
                      ))}
                    </Select>
                    {errors.customerId && <FormHelperText>{errors.customerId.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Box>
          </Paper>

          <Paper variant="outlined">
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} p={2.5} spacing={1.5}>
              <Box>
                <Typography variant="h2">Products</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>Product name, SKU, and price are snapshotted when the challan is saved.</Typography>
              </Box>
              <Button startIcon={<AddOutlined />} onClick={() => append({ productId: '', quantity: 1 })}>Add line</Button>
            </Stack>
            <Divider />
            <Stack divider={<Divider flexItem />}>
              {fields.map((field, index) => {
                const product = products.data?.find((candidate) => candidate.id === watchedItems[index]?.productId);
                const quantity = Number(watchedItems[index]?.quantity) || 0;
                const insufficient = Boolean(product && quantity > product.currentStock);
                return (
                  <Box key={field.id} p={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
                      <Controller
                        name={`items.${index}.productId`}
                        control={control}
                        render={({ field: selectField }) => (
                          <FormControl error={Boolean(errors.items?.[index]?.productId)} sx={{ flex: 1 }}>
                            <InputLabel id={`product-line-${index}`}>Product</InputLabel>
                            <Select {...selectField} labelId={`product-line-${index}`} label="Product">
                              {(products.data ?? []).map((candidate) => (
                                <MenuItem
                                  key={candidate.id}
                                  value={candidate.id}
                                  disabled={candidate.id !== selectField.value && selectedProductIds.includes(candidate.id)}
                                >
                                  {candidate.name} · {candidate.sku} · {candidate.currentStock} available
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.items?.[index]?.productId && <FormHelperText>{errors.items[index]?.productId?.message}</FormHelperText>}
                          </FormControl>
                        )}
                      />
                      <TextField
                        label="Quantity"
                        type="number"
                        sx={{ width: { md: 150 } }}
                        inputProps={{ min: 1, step: 1 }}
                        error={Boolean(errors.items?.[index]?.quantity) || insufficient}
                        helperText={insufficient ? `Only ${product?.currentStock} available` : errors.items?.[index]?.quantity?.message}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                      <Box minWidth={{ md: 150 }} pt={{ md: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Line value</Typography>
                        <Typography className="tabular" fontWeight={700}>
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product ? Number(product.unitPrice) * quantity : 0)}
                        </Typography>
                      </Box>
                      <IconButton onClick={() => remove(index)} disabled={fields.length === 1} aria-label={`Remove product line ${index + 1}`}>
                        <DeleteOutline />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
            {errors.items?.root?.message && <Alert severity="error" sx={{ m: 2 }}>{errors.items.root.message}</Alert>}
          </Paper>

          <Paper variant="outlined">
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} p={2.5} spacing={2}>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total quantity</Typography>
                  <Typography className="tabular" sx={{ fontSize: 22, fontWeight: 730 }}>{totals.quantity}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Snapshot value</Typography>
                  <Typography className="tabular" sx={{ fontSize: 22, fontWeight: 730 }}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totals.value)}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5}>
                <Button startIcon={<SaveOutlined />} onClick={saveDraft} disabled={create.isPending}>Save draft</Button>
                <Button variant="contained" startIcon={<TaskAltOutlined />} onClick={prepareConfirm} disabled={create.isPending}>
                  Confirm challan
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Box>
      <ConfirmActionDialog
        open={confirmOpen}
        title="Confirm challan and deduct stock?"
        description={`This will deduct ${totals.quantity} units across ${watchedItems.length} product lines. Confirmed challans cannot be edited.`}
        confirmLabel="Confirm and deduct stock"
        loading={create.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (pendingValues) create.mutate({ values: pendingValues, status: 'CONFIRMED' });
        }}
      />
    </>
  );
}
