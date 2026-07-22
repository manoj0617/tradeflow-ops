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
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { Customer } from '../../types';

const customerFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter the customer name'),
  mobile: z.string().trim().min(8, 'Enter a valid mobile number'),
  email: z.union([z.string().email('Enter a valid email'), z.literal('')]),
  businessName: z.string().trim().min(2, 'Enter the business name'),
  gstNumber: z.string().trim(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().trim().min(5, 'Enter the business address'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  followUpDate: z.string(),
  notes: z.string().max(1000),
});
export type CustomerFormValues = z.infer<typeof customerFormSchema>;

const defaults: CustomerFormValues = {
  name: '',
  mobile: '',
  email: '',
  businessName: '',
  gstNumber: '',
  type: 'RETAIL',
  address: '',
  status: 'LEAD',
  followUpDate: '',
  notes: '',
};

export function CustomerDialog({
  open,
  customer,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  customer?: Customer | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
}) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    reset(customer ? {
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email ?? '',
      businessName: customer.businessName,
      gstNumber: customer.gstNumber ?? '',
      type: customer.type,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate?.slice(0, 10) ?? '',
      notes: customer.notes ?? '',
    } : defaults);
  }, [customer, open, reset]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" aria-labelledby="customer-dialog-title">
      <DialogTitle id="customer-dialog-title">{customer ? 'Edit customer' : 'Add customer'}</DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="customer-form"
          onSubmit={handleSubmit(onSubmit)}
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
          gap={2}
          pt={0.5}
        >
          <TextField label="Customer name" required error={Boolean(errors.name)} helperText={errors.name?.message} {...register('name')} />
          <TextField label="Business name" required error={Boolean(errors.businessName)} helperText={errors.businessName?.message} {...register('businessName')} />
          <TextField label="Mobile number" type="tel" required error={Boolean(errors.mobile)} helperText={errors.mobile?.message} {...register('mobile')} />
          <TextField label="Email" type="email" error={Boolean(errors.email)} helperText={errors.email?.message} {...register('email')} />
          <TextField label="GST number" helperText="Optional; stored exactly as provided after validation." {...register('gstNumber')} />
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormControl>
                <InputLabel id="customer-type-label">Customer type</InputLabel>
                <Select {...field} labelId="customer-type-label" label="Customer type">
                  <MenuItem value="RETAIL">Retail</MenuItem>
                  <MenuItem value="WHOLESALE">Wholesale</MenuItem>
                  <MenuItem value="DISTRIBUTOR">Distributor</MenuItem>
                </Select>
              </FormControl>
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl error={Boolean(errors.status)}>
                <InputLabel id="customer-status-label">Status</InputLabel>
                <Select {...field} labelId="customer-status-label" label="Status">
                  <MenuItem value="LEAD">Lead</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>
            )}
          />
          <TextField
            label="Next follow-up"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register('followUpDate')}
          />
          <TextField
            label="Address"
            required
            multiline
            minRows={3}
            error={Boolean(errors.address)}
            helperText={errors.address?.message}
            sx={{ gridColumn: { md: '1 / -1' } }}
            {...register('address')}
          />
          <TextField
            label="Notes"
            multiline
            minRows={3}
            error={Boolean(errors.notes)}
            helperText={errors.notes?.message}
            sx={{ gridColumn: { md: '1 / -1' } }}
            {...register('notes')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" form="customer-form" variant="contained" disabled={loading}>
          {loading ? 'Saving…' : customer ? 'Save changes' : 'Add customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

