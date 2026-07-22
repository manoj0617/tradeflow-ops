import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  DashboardOutlined,
  DescriptionOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LogoutOutlined,
  MenuOutlined,
  SwapVertOutlined,
} from '@mui/icons-material';
import { useAuth } from '../features/auth/AuthProvider';

const drawerWidth = 248;
const navItems = [
  { label: 'Overview', to: '/', icon: <DashboardOutlined /> },
  { label: 'Customers', to: '/customers', icon: <GroupsOutlined /> },
  { label: 'Products', to: '/products', icon: <Inventory2Outlined /> },
  { label: 'Stock movements', to: '/stock-movements', icon: <SwapVertOutlined /> },
  { label: 'Sales challans', to: '/challans', icon: <DescriptionOutlined /> },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="oklch(0.22 0.025 160)" color="oklch(1 0 0)">
      <Stack direction="row" alignItems="center" spacing={1.5} px={2.5} minHeight={72}>
        <Box
          width={34}
          height={34}
          borderRadius={1.25}
          display="grid"
          sx={{ placeItems: 'center', bgcolor: 'primary.main', fontWeight: 800 }}
          aria-hidden="true"
        >
          TF
        </Box>
        <Box>
          <Typography fontWeight={750} lineHeight={1.2}>TradeFlow Ops</Typography>
          <Typography variant="caption" sx={{ color: 'oklch(0.78 0.02 160)' }}>Distribution workspace</Typography>
        </Box>
      </Stack>
      <Divider sx={{ borderColor: 'oklch(0.32 0.025 160)' }} />
      <List component="nav" aria-label="Primary navigation" sx={{ p: 1.5 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            sx={{
              minHeight: 46,
              mb: 0.5,
              color: 'oklch(0.84 0.018 160)',
              borderRadius: 1,
              '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 38 },
              '&.active': { color: 'oklch(1 0 0)', bgcolor: 'oklch(0.34 0.07 160)' },
              '&:hover': { bgcolor: 'oklch(0.29 0.04 160)' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Box mt="auto" p={2}>
        <Divider sx={{ borderColor: 'oklch(0.32 0.025 160)', mb: 2 }} />
        <Stack direction="row" spacing={1.25} alignItems="center" mb={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'oklch(0.52 0.13 160)', fontSize: 14 }}>
            {user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={650} noWrap>{user?.name}</Typography>
            <Typography variant="caption" sx={{ color: 'oklch(0.76 0.02 160)' }}>
              {user?.role.toLowerCase().replace(/^./, (character) => character.toUpperCase())}
            </Typography>
          </Box>
        </Stack>
        <Button
          fullWidth
          color="inherit"
          startIcon={<LogoutOutlined />}
          onClick={logout}
          sx={{ justifyContent: 'flex-start', color: 'oklch(0.84 0.018 160)' }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

export function AppLayout() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box minHeight="100dvh" bgcolor="background.default">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {!desktop && (
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
              <MenuOutlined />
            </IconButton>
            <Typography fontWeight={750} ml={1}>TradeFlow Ops</Typography>
          </Toolbar>
        </AppBar>
      )}
      {desktop ? (
        <Drawer
          variant="permanent"
          sx={{ width: drawerWidth, '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}
        >
          <Navigation />
        </Drawer>
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}
        >
          <Navigation onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}
      <Box component="main" id="main-content" ml={{ lg: `${drawerWidth}px` }} tabIndex={-1}>
        <Box maxWidth={1440} mx="auto" px={{ xs: 2, sm: 3, lg: 4 }} py={{ xs: 2.5, sm: 3, lg: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

