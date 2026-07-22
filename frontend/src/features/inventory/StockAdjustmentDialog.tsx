import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { MovementType, Product } from '../../types';

export interface StockAdjustmentValues {
  type: MovementType;
  quantity: number;
  reason: string;
}

export function StockAdjustmentDialog({
  open,
  product,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  product: Product | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: StockAdjustmentValues) => Promise<void>;
}) {
  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<StockAdjustmentValues>({
    defaultValues: { type: 'IN', quantity: 1, reason: '' },
  });
  const type = watch('type');

  const close = () => {
    reset({ type: 'IN', quantity: 1, reason: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : close} maxWidth="xs" aria-labelledby="stock-dialog-title">
      <DialogTitle id="stock-dialog-title">Record stock movement</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" id="stock-form" onSubmit={handleSubmit(onSubmit)} spacing={2}>
          <BoxSummary product={product} />
          {type === 'OUT' && (
            <Alert severity="warning">Stock out cannot exceed the current available balance.</Alert>
          )}
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <FormControl error={Boolean(errors.type)}>
                <InputLabel id="movement-type-label">Movement type</InputLabel>
                <Select {...field} labelId="movement-type-label" label="Movement type">
                  <MenuItem value="IN">IN · Add stock</MenuItem>
                  <MenuItem value="OUT">OUT · Remove stock</MenuItem>
                </Select>
                {errors.type && <FormHelperText>Select a movement type</FormHelperText>}
              </FormControl>
            )}
          />
          <TextField
            label="Quantity"
            type="number"
            required
            inputProps={{ min: 1, step: 1 }}
            error={Boolean(errors.quantity)}
            helperText={errors.quantity?.message}
            {...register('quantity', {
              valueAsNumber: true,
              required: 'Enter the quantity',
              min: { value: 1, message: 'Quantity must be at least one' },
            })}
          />
          <TextField
            label="Reason"
            required
            multiline
            minRows={3}
            error={Boolean(errors.reason)}
            helperText={errors.reason?.message ?? 'Examples: supplier receipt, damaged goods, stock correction.'}
            {...register('reason', {
              required: 'Explain why stock is changing',
              minLength: { value: 3, message: 'Add a little more detail' },
            })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={loading}>Cancel</Button>
        <Button type="submit" form="stock-form" variant="contained" disabled={loading}>
          {loading ? 'Recording…' : 'Record movement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BoxSummary({ product }: { product: Product | null }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
      <div>
        <Typography fontWeight={650}>{product?.name}</Typography>
        <Typography variant="caption" color="text.secondary">{product?.sku}</Typography>
      </div>
      <div>
        <Typography variant="caption" color="text.secondary">Available</Typography>
        <Typography className="tabular" fontWeight={730} textAlign="right">{product?.currentStock ?? 0}</Typography>
      </div>
    </Stack>
  );
}

