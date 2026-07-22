import { Chip } from '@mui/material';
import {
  CheckCircleOutline,
  DoNotDisturbOnOutlined,
  EditNoteOutlined,
  PendingOutlined,
  PersonOutline,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';

const statusMap: Record<string, {
  label: string;
  color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactElement;
}> = {
  LEAD: { label: 'Lead', color: 'info', icon: <PersonOutline /> },
  ACTIVE: { label: 'Active', color: 'success', icon: <CheckCircleOutline /> },
  INACTIVE: { label: 'Inactive', color: 'default', icon: <DoNotDisturbOnOutlined /> },
  DRAFT: { label: 'Draft', color: 'warning', icon: <EditNoteOutlined /> },
  CONFIRMED: { label: 'Confirmed', color: 'success', icon: <CheckCircleOutline /> },
  CANCELLED: { label: 'Cancelled', color: 'error', icon: <DoNotDisturbOnOutlined /> },
  IN: { label: 'Stock in', color: 'success', icon: <TrendingUp /> },
  OUT: { label: 'Stock out', color: 'error', icon: <TrendingDown /> },
  PENDING: { label: 'Pending', color: 'warning', icon: <PendingOutlined /> },
};

export function StatusChip({ status }: { status: string }) {
  const config = statusMap[status] ?? { label: status, color: 'default' as const };
  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      icon={config.icon}
      variant={config.color === 'default' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 650, '& .MuiChip-icon': { fontSize: 16 } }}
    />
  );
}

