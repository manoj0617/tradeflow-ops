import { Link as RouterLink, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBackOutlined, CallOutlined, EventOutlined, NotesOutlined } from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { useFeedback } from '../app/FeedbackProvider';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { ErrorState, PageLoading } from '../components/TableStates';
import { useAuth } from '../features/auth/AuthProvider';
import { CUSTOMER_KEYS } from '../features/customers/customerKeys';
import type { ApiItem, Customer, FollowUp } from '../types';

interface FollowUpValues {
  note: string;
  followUpDate: string;
}

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const feedback = useFeedback();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowUpValues>({
    defaultValues: { note: '', followUpDate: '' },
  });
  const customer = useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: async () => (await api.get<ApiItem<Customer>>(`/customers/${id}`)).data.data,
    enabled: Boolean(id),
  });
  const addFollowUp = useMutation({
    mutationFn: async (values: FollowUpValues) =>
      (await api.post<ApiItem<FollowUp>>(`/customers/${id}/follow-ups`, values)).data,
    onSuccess: (result) => {
      feedback.show(result.message ?? 'Follow-up added');
      reset();
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
    onError: (error) => feedback.show(getApiError(error), 'error'),
  });

  if (customer.isPending) return <PageLoading />;
  if (customer.isError || !customer.data) {
    return <ErrorState message={getApiError(customer.error, 'Customer not found')} onRetry={() => void customer.refetch()} />;
  }

  const record = customer.data;
  return (
    <>
      <Link component={RouterLink} to="/customers" underline="hover" display="inline-flex" alignItems="center" gap={0.75} mb={2}>
        <ArrowBackOutlined fontSize="small" /> Customers
      </Link>
      <PageHeader
        title={record.name}
        description={record.businessName}
        action={<StatusChip status={record.status} />}
      />
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(320px, .8fr)' }} gap={3}>
        <Stack spacing={3}>
          <Paper variant="outlined">
            <Box p={2.5}>
              <Typography variant="h2">Customer details</Typography>
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2.5} mt={2.5}>
                {[
                  ['Mobile', record.mobile],
                  ['Email', record.email || 'Not provided'],
                  ['Customer type', record.type.toLowerCase().replace(/^./, (char) => char.toUpperCase())],
                  ['GST number', record.gstNumber || 'Not provided'],
                  ['Next follow-up', record.followUpDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date(record.followUpDate)) : 'Not scheduled'],
                  ['Address', record.address],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography mt={0.35}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              {record.notes && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Stack direction="row" spacing={1.25}>
                    <NotesOutlined color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">General notes</Typography>
                      <Typography mt={0.35}>{record.notes}</Typography>
                    </Box>
                  </Stack>
                </>
              )}
            </Box>
          </Paper>

          <Paper variant="outlined">
            <Box p={2.5}>
              <Typography variant="h2">Follow-up history</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>A chronological record of sales contact and next steps.</Typography>
            </Box>
            <Divider />
            {record.followUps?.length ? record.followUps.map((followUp, index) => (
              <Box key={followUp.id}>
                <Stack direction="row" spacing={2} p={2.5} alignItems="flex-start">
                  <Box
                    width={36}
                    height={36}
                    borderRadius="50%"
                    display="grid"
                    flexShrink={0}
                    sx={{ placeItems: 'center', bgcolor: 'oklch(0.93 0.035 160)', color: 'primary.dark' }}
                  >
                    <CallOutlined fontSize="small" />
                  </Box>
                  <Box>
                    <Typography>{followUp.note}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                      {followUp.createdBy.name} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(followUp.createdAt))}
                    </Typography>
                    {followUp.followUpDate && (
                      <Stack direction="row" spacing={0.75} alignItems="center" mt={1}>
                        <EventOutlined fontSize="small" color="action" />
                        <Typography variant="body2">Next: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(followUp.followUpDate))}</Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
                {index < (record.followUps?.length ?? 0) - 1 && <Divider />}
              </Box>
            )) : (
              <Box p={3}><Typography color="text.secondary">No follow-ups recorded yet.</Typography></Box>
            )}
          </Paper>
        </Stack>

        {can('ADMIN', 'SALES') && (
          <Paper variant="outlined" sx={{ alignSelf: 'start', position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <Box component="form" onSubmit={handleSubmit((values) => addFollowUp.mutate(values))} p={2.5}>
              <Typography variant="h2">Add follow-up</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5} mb={2.5}>
                Record what happened and schedule the next contact.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Follow-up note"
                  multiline
                  minRows={4}
                  required
                  error={Boolean(errors.note)}
                  helperText={errors.note?.message}
                  {...register('note', { required: 'Enter a follow-up note', minLength: { value: 3, message: 'Add a little more detail' } })}
                />
                <TextField label="Next follow-up" type="date" InputLabelProps={{ shrink: true }} {...register('followUpDate')} />
                <Button type="submit" variant="contained" disabled={addFollowUp.isPending}>
                  {addFollowUp.isPending ? 'Adding…' : 'Add follow-up'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
}

