import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D4AF37', // Luxurious Gold
      light: '#F3E5AB', // Soft/Champagne Gold
      dark: '#AA7C11', // Deep/Bronze Gold
      contrastText: '#0D0D0C', // Deep Rich Black for high contrast on gold
    },
    secondary: {
      main: '#E5D595', // Muted Gold Accent
      light: '#FFFDF0',
      dark: '#9A8230',
      contrastText: '#0D0D0C',
    },
    background: {
      default: '#0D0D0C', // Deep matte black background
      paper: '#141413', // Slightly lighter slate/black for premium cards
    },
    text: {
      primary: '#F5F5F0', // Slightly off-white for softer contrast
      secondary: '#B8B8B2', // Elegant muted metallic gray-gold
    },
    divider: 'rgba(212, 175, 55, 0.2)', // Gold-infused dividers
    success: {
      main: '#4E9F3D',
    },
    warning: {
      main: '#D8A31A',
    },
    error: {
      main: '#D32F2F',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
      fontWeight: 600,
      letterSpacing: '0.1em',
    },
    h2: {
      fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
      fontWeight: 500,
      letterSpacing: '0.08em',
    },
    h3: {
      fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
      fontWeight: 500,
      letterSpacing: '0.06em',
    },
    h4: {
      fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
      fontWeight: 500,
      letterSpacing: '0.05em',
    },
    h5: {
      fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
      fontWeight: 500,
      letterSpacing: '0.04em',
    },
    h6: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      letterSpacing: '0.02em',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          padding: '8px 20px',
          transition: 'all 0.3s ease-in-out',
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
            color: '#0D0D0C',
            fontWeight: 700,
            border: '1px solid #D4AF37',
            '&:hover': {
              background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 100%)',
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
            },
          },
          '&.MuiButton-outlinedPrimary': {
            borderColor: '#D4AF37',
            color: '#D4AF37',
            borderWidth: '1px',
            '&:hover': {
              borderColor: '#F3E5AB',
              background: 'rgba(212, 175, 55, 0.05)',
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.2)',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          background: '#141413',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid rgba(212, 175, 55, 0.3)',
          background: '#141413',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
          borderRadius: '8px',
          '@media (max-width: 600px)': {
            margin: '12px',
            width: 'calc(100% - 24px)',
            maxHeight: 'calc(100% - 24px)',
          }
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0D0D0C',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0D0D0C',
          borderRight: '1px solid rgba(212, 175, 55, 0.2)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(212, 175, 55, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(212, 175, 55, 0.6)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D4AF37',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#B8B8B2',
          '&.Mui-focused': {
            color: '#D4AF37',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
        },
        head: {
          color: '#D4AF37',
          fontWeight: 600,
        },
      },
    },
  },
});
