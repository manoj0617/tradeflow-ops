import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
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
import { ArrowForwardOutlined, DescriptionOutlined, Inventory2Outlined } from '@mui/icons-material';
import { api, getApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { ErrorState, TableLoading } from '../components/TableStates';
import { StatusChip } from '../components/StatusChip';
import type { ApiItem, StockMovement } from '../types';

interface DashboardSummary {
  activeCustomers: number;
  upcomingFollowUps: number;
  lowStockProducts: number;
  draftChallans: number;
  recentMovements: StockMovement[];
}

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await api.get<ApiItem<DashboardSummary>>('/dashboard/summary')).data.data,
  });

  return (
    <>
      <PageHeader title="Operations overview" description="The records that need attention before today’s customer and dispatch work moves forward." />
      {summary.isPending ? <TableLoading rows={6} /> : summary.isError ? (
        <ErrorState message={getApiError(summary.error)} onRetry={() => void summary.refetch()} />
      ) : (
        <Stack spacing={3}>
          <Paper variant="outlined" aria-label="Operations summary">
            <Box
              display="grid"
              gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }}
              sx={{ '& > div': { p: { xs: 2, sm: 2.5 } } }}
            >
              {[
                ['Active customers', summary.data.activeCustomers, '/customers'],
                ['Follow-ups this week', summary.data.upcomingFollowUps, '/customers'],
                ['Low-stock products', summary.data.lowStockProducts, '/products?lowStock=true'],
                ['Draft challans', summary.data.draftChallans, '/challans?status=DRAFT'],
              ].map(([label, value, href], index) => (
                <Box
                  key={String(label)}
                  sx={{
                    borderRight: { md: index < 3 ? 1 : 0 },
                    borderBottom: { xs: index < 2 ? 1 : 0, md: 0 },
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Stack direction="row" alignItems="baseline" justifyContent="space-between" mt={0.75}>
                    <Typography className="tabular" sx={{ fontSize: 28, fontWeight: 730 }}>{value}</Typography>
                    <Link component={RouterLink} to={String(href)} aria-label={`View ${label}`}>
                      <ArrowForwardOutlined fontSize="small" />
                    </Link>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Paper>

          <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, .75fr)' }} gap={3}>
            <Paper variant="outlined">
              <Stack direction="row" justifyContent="space-between" alignItems="center" p={2.5}>
                <Box>
                  <Typography variant="h2">Recent stock movement</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>Latest inward and outward inventory events.</Typography>
                </Box>
                <Button component={RouterLink} to="/stock-movements" size="small">View ledger</Button>
              </Stack>
              <Divider />
              <TableContainer aria-label="Recent stock movements">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.data.recentMovements.map((movement) => (
                      <TableRow key={movement.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={650}>{movement.product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{movement.product.sku}</Typography>
                        </TableCell>
                        <TableCell><StatusChip status={movement.type} /></TableCell>
                        <TableCell align="right" className="tabular">{movement.quantity}</TableCell>
                        <TableCell>{movement.reason}</TableCell>
                      </TableRow>
                    ))}
                    {!summary.data.recentMovements.length && (
                      <TableRow><TableCell colSpan={4} align="center">No stock movements yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <Paper variant="outlined" sx={{ alignSelf: 'start' }}>
              <Box p={2.5}>
                <Typography variant="h2">Start a dispatch</Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Select an active customer, add available products, and save a draft or confirm stock deduction.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/challans/new"
                  variant="contained"
                  fullWidth
                  startIcon={<DescriptionOutlined />}
                  sx={{ mt: 2.5 }}
                >
                  Create sales challan
                </Button>
              </Box>
              <Divider />
              <Box p={2.5}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Inventory2Outlined color="primary" />
                  <Box>
                    <Typography fontWeight={650}>Stock stays auditable</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Confirmations and cancellations create linked ledger entries automatically.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Box>
        </Stack>
      )}
    </>
  );
}

