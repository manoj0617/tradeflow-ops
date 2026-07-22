import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: { nativeColor: true },
  palette: {
    mode: 'light',
    primary: {
      main: 'oklch(0.52 0.13 160)',
      light: 'oklch(0.72 0.10 160)',
      dark: 'oklch(0.42 0.12 160)',
      contrastText: 'oklch(1 0 0)',
    },
    secondary: {
      main: 'oklch(0.55 0.15 250)',
      contrastText: 'oklch(1 0 0)',
    },
    background: {
      default: 'oklch(0.975 0.006 160)',
      paper: 'oklch(1 0 0)',
    },
    text: {
      primary: 'oklch(0.22 0.025 160)',
      secondary: 'oklch(0.45 0.025 160)',
    },
    divider: 'oklch(0.89 0.012 160)',
    success: { main: 'oklch(0.48 0.12 155)', contrastText: 'oklch(1 0 0)' },
    warning: { main: 'oklch(0.68 0.14 75)', contrastText: 'oklch(0.22 0.025 75)' },
    error: { main: 'oklch(0.55 0.18 25)', contrastText: 'oklch(1 0 0)' },
    info: { main: 'oklch(0.55 0.15 250)', contrastText: 'oklch(1 0 0)' },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    h1: { fontSize: '1.5rem', lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.125rem', lineHeight: 1.35, fontWeight: 650 },
    h3: { fontSize: '1rem', lineHeight: 1.4, fontWeight: 650 },
    body1: { fontSize: '1rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 650 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 8, paddingInline: 16 },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiFormControl: { defaultProps: { size: 'small', fullWidth: true } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiDialog: {
      defaultProps: { fullWidth: true },
      styleOverrides: { paper: { borderRadius: 12 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: 'oklch(0.34 0.025 160)', background: 'oklch(0.975 0.006 160)' },
        root: { borderColor: 'oklch(0.91 0.01 160)' },
      },
    },
  },
});

