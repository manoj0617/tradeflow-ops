import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { Product, Warehouse } from '../../types';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Enter the product name'),
  sku: z.string().trim().min(2, 'Enter the SKU').regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens, or underscores'),
  category: z.string().trim().min(2, 'Enter the category'),
  unitPrice: z.number().positive('Price must be greater than zero'),
  minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative'),
  openingStock: z.number().int().min(0, 'Opening stock cannot be negative'),
  warehouseId: z.string().uuid('Select a warehouse'),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export function ProductDialog({
  open,
  product,
  warehouses,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product?: Product | null;
  warehouses: Warehouse[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', sku: '', category: '', unitPrice: 0, minimumStock: 0, openingStock: 0, warehouseId: '',
    },
  });

  useEffect(() => {
    reset(product ? {
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: Number(product.unitPrice),
      minimumStock: product.minimumStock,
      openingStock: 0,
      warehouseId: product.warehouseId,
    } : {
      name: '', sku: '', category: '', unitPrice: 0, minimumStock: 0, openingStock: 0,
      warehouseId: warehouses[0]?.id ?? '',
    });
  }, [open, product, reset, warehouses]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" aria-labelledby="product-dialog-title">
      <DialogTitle id="product-dialog-title">{product ? 'Edit product' : 'Add product'}</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" id="product-form" onSubmit={handleSubmit(onSubmit)} spacing={2} pt={0.5}>
          <TextField label="Product name" required error={Boolean(errors.name)} helperText={errors.name?.message} {...register('name')} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="SKU / code" required error={Boolean(errors.sku)} helperText={errors.sku?.message} {...register('sku')} />
            <TextField label="Category" required error={Boolean(errors.category)} helperText={errors.category?.message} {...register('category')} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Unit price"
              type="number"
              required
              inputProps={{ min: 0, step: '0.01' }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              error={Boolean(errors.unitPrice)}
              helperText={errors.unitPrice?.message}
              {...register('unitPrice', { valueAsNumber: true })}
            />
            <TextField
              label="Minimum stock"
              type="number"
              required
              inputProps={{ min: 0, step: 1 }}
              error={Boolean(errors.minimumStock)}
              helperText={errors.minimumStock?.message}
              {...register('minimumStock', { valueAsNumber: true })}
            />
          </Stack>
          {!product && (
            <TextField
              label="Opening stock"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              helperText={errors.openingStock?.message ?? 'Creates the first auditable stock movement.'}
              error={Boolean(errors.openingStock)}
              {...register('openingStock', { valueAsNumber: true })}
            />
          )}
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <FormControl error={Boolean(errors.warehouseId)}>
                <InputLabel id="warehouse-label">Warehouse</InputLabel>
                <Select {...field} labelId="warehouse-label" label="Warehouse">
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name} · {warehouse.location}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" form="product-form" variant="contained" disabled={loading}>
          {loading ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
