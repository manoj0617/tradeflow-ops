import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  severity?: 'warning' | 'error' | 'info';
  reason?: string;
  reasonLabel?: string;
  onReasonChange?: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  severity = 'warning',
  reason,
  reasonLabel,
  onReasonChange,
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" aria-labelledby="confirm-action-title">
      <DialogTitle id="confirm-action-title">{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity={severity}>{description}</Alert>
          {reasonLabel && (
            <TextField
              label={reasonLabel}
              value={reason ?? ''}
              onChange={(event) => onReasonChange?.(event.target.value)}
              multiline
              minRows={3}
              required
              autoFocus
            />
          )}
          <Typography variant="body2" color="text.secondary">
            Review the record before continuing. This action is recorded in the audit trail.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Go back</Button>
        <Button
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={loading || Boolean(reasonLabel && (reason?.trim().length ?? 0) < 3)}
        >
          {loading ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

