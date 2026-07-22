import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutline,
  Inventory2Outlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { getApiError } from '../api/client';
import { useAuth } from '../features/auth/AuthProvider';

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@tradeflow.local', password: 'TradeFlow@123' },
  });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    try {
      await login(values);
      const target = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(target, { replace: true });
    } catch (error) {
      setSubmitError(getApiError(error, 'Sign-in failed. Check your credentials and try again.'));
    }
  });

  return (
    <Box minHeight="100dvh" display="grid" sx={{ placeItems: 'center', bgcolor: 'oklch(0.22 0.025 160)' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper
          sx={{
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(420px, .95fr)' },
            borderRadius: 1.5,
          }}
        >
          <Box
            component="section"
            p={{ xs: 3, sm: 5, lg: 7 }}
            color="oklch(1 0 0)"
            bgcolor="oklch(0.28 0.045 160)"
            display={{ xs: 'none', md: 'block' }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} mb={8}>
              <Box
                width={42}
                height={42}
                borderRadius={1.25}
                display="grid"
                sx={{ placeItems: 'center', bgcolor: 'primary.main' }}
              >
                <Inventory2Outlined />
              </Box>
              <Box>
                <Typography fontWeight={750}>TradeFlow Ops</Typography>
                <Typography variant="caption" sx={{ color: 'oklch(0.8 0.02 160)' }}>Distribution workspace</Typography>
              </Box>
            </Stack>
            <Typography component="h1" sx={{ fontSize: 36, fontWeight: 730, lineHeight: 1.15, letterSpacing: '-0.03em', maxWidth: '14ch' }}>
              Move from customer intent to dispatch with confidence.
            </Typography>
            <Typography mt={2} sx={{ color: 'oklch(0.83 0.02 160)', maxWidth: '52ch', lineHeight: 1.7 }}>
              One operational record for follow-ups, availability, stock movements, and sales challans.
            </Typography>
            <Stack mt={7} spacing={2.5}>
              {[
                'Role-aware workflows for sales, warehouse, and accounts',
                'Stock consequences shown before confirmation',
                'Every movement linked to a person, reason, and record',
              ].map((item) => (
                <Stack direction="row" spacing={1.5} alignItems="flex-start" key={item}>
                  <CheckCircleOutline sx={{ color: 'oklch(0.72 0.12 160)', mt: 0.2 }} />
                  <Typography>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box component="section" p={{ xs: 3, sm: 6, lg: 7 }} display="flex" alignItems="center">
            <Box width="100%" maxWidth={440} mx="auto">
              <Typography component="h1" sx={{ fontSize: 32, lineHeight: 1.2, fontWeight: 730, letterSpacing: '-0.025em' }}>
                Welcome back
              </Typography>
              <Typography color="text.secondary" mt={1} mb={4}>
                Sign in with your TradeFlow work account.
              </Typography>
              {submitError && <Alert severity="error" sx={{ mb: 2 }} role="alert">{submitError}</Alert>}
              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2.25}>
                  <TextField
                    label="Work email"
                    type="email"
                    autoComplete="username"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    {...register('email')}
                  />
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    {...register('password')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </Stack>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" mt={3}>
                Demo credentials are pre-filled. Accounts are limited to this case-study environment.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

