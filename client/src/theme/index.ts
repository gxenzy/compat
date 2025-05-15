import { createTheme, responsiveFontSizes, Theme, Components } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import type { TypographyOptions } from '@mui/material/styles/createTypography';
import type { DesignToken } from './types';
import type { ButtonProps, CardProps, ChipProps } from '@mui/material';
import type { CSSObject } from '@emotion/styled';

// Design tokens
export const designTokens = {
  colors: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff'
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff'
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff'
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff'
    },
    backgrounds: {
      light: '#f5f5f5',
      main: '#ffffff',
      dark: '#1e1e1e',
      darkPaper: '#23272f'
    },
    text: {
      lightPrimary: '#212121',
      lightSecondary: '#555',
      darkPrimary: '#d4d4d4',
      darkSecondary: '#a0a0a0'
    }
  },
  spacing: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16
  },
  shadows: {
    xs: '0 2px 4px rgba(0, 0, 0, 0.05)',
    sm: '0 4px 8px rgba(0, 0, 0, 0.08)',
    md: '0 8px 16px rgba(0, 0, 0, 0.1)',
    lg: '0 12px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.14)',
    xxl: '0 20px 40px rgba(0, 0, 0, 0.16)',
  },
  fontFamily: {
    primary: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    code: [
      'SFMono-Regular', 
      'Consolas', 
      '"Liberation Mono"', 
      'Menlo', 
      'monospace'
    ].join(',')
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
    xxxl: '2.5rem',
    display: '3rem',
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    xs: 1,
    sm: 1.25,
    md: 1.5,
    lg: 1.75,
    xl: 2
  },
  transitions: {
    quick: '0.1s',
    standard: '0.2s',
    slow: '0.3s',
    entrance: '0.5s',
  }
};

const createTypography = (mode: 'light' | 'dark'): TypographyOptions => {
  const textColor = mode === 'light' 
    ? designTokens.colors.text.lightPrimary 
    : designTokens.colors.text.darkPrimary;
  
  const secondaryTextColor = mode === 'light'
    ? designTokens.colors.text.lightSecondary
    : designTokens.colors.text.darkSecondary;

  return {
    fontFamily: designTokens.fontFamily.primary,
    h1: {
      fontSize: designTokens.fontSize.xxxl,
      fontWeight: designTokens.fontWeight.bold,
      lineHeight: designTokens.lineHeight.sm,
      color: mode === 'dark' ? '#fff' : undefined,
      marginBottom: designTokens.spacing.md,
    },
    h2: {
      fontSize: designTokens.fontSize.xxl,
      fontWeight: designTokens.fontWeight.semibold,
      lineHeight: designTokens.lineHeight.sm,
      color: mode === 'dark' ? '#fff' : undefined,
      marginBottom: designTokens.spacing.sm,
    },
    h3: {
      fontSize: designTokens.fontSize.xl,
      fontWeight: designTokens.fontWeight.semibold,
      lineHeight: designTokens.lineHeight.sm,
      color: mode === 'dark' ? '#fff' : undefined,
      marginBottom: designTokens.spacing.sm,
    },
    h4: {
      fontSize: designTokens.fontSize.lg,
      fontWeight: designTokens.fontWeight.semibold,
      lineHeight: designTokens.lineHeight.md,
      color: mode === 'dark' ? '#fff' : undefined,
    },
    h5: {
      fontSize: designTokens.fontSize.md,
      fontWeight: designTokens.fontWeight.medium,
      lineHeight: designTokens.lineHeight.md,
      color: mode === 'dark' ? '#fff' : undefined,
    },
    h6: {
      fontSize: designTokens.fontSize.sm,
      fontWeight: designTokens.fontWeight.medium,
      lineHeight: designTokens.lineHeight.md,
      color: mode === 'dark' ? '#fff' : undefined,
    },
    subtitle1: {
      fontSize: designTokens.fontSize.md,
      lineHeight: designTokens.lineHeight.md,
      color: secondaryTextColor,
    },
    subtitle2: {
      fontSize: designTokens.fontSize.sm,
      fontWeight: designTokens.fontWeight.medium,
      lineHeight: designTokens.lineHeight.md,
      color: secondaryTextColor,
    },
    body1: {
      fontSize: designTokens.fontSize.md,
      lineHeight: designTokens.lineHeight.md,
      color: textColor,
    },
    body2: {
      fontSize: designTokens.fontSize.sm,
      lineHeight: designTokens.lineHeight.md,
      color: textColor,
    },
    button: {
      fontSize: designTokens.fontSize.sm,
      fontWeight: designTokens.fontWeight.medium,
      lineHeight: designTokens.lineHeight.md,
      textTransform: 'none',
    },
    caption: {
      fontSize: designTokens.fontSize.xs,
      lineHeight: designTokens.lineHeight.md,
      color: secondaryTextColor,
    },
    overline: {
      fontSize: designTokens.fontSize.xs,
      fontWeight: designTokens.fontWeight.medium,
      lineHeight: designTokens.lineHeight.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  };
};

const createBaseComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
  MuiCssBaseline: {
      styleOverrides: {
      body: {
        scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f5f5f5',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          width: 8,
          height: 8,
          backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f5f5f5',
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          borderRadius: 8,
          backgroundColor: mode === 'dark' ? '#6b6b6b' : '#959595',
          minHeight: 24,
        },
        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
          backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
        },
        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
          backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: mode === 'dark' ? '#959595' : '#6b6b6b',
        },
        '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
          backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f5f5f5',
        },
      },
    },
  },
  MuiButton: {
      styleOverrides: {
        root: {
        borderRadius: 8,
        textTransform: 'none',
        '&.MuiButton-contained': {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)',
          },
        },
      } as CSSObject,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: mode === 'dark' 
          ? '0 4px 6px rgba(0,0,0,0.2)' 
          : '0 4px 6px rgba(0,0,0,0.07)',
      } as CSSObject,
    },
  },
  MuiPaper: {
      styleOverrides: {
        root: {
        backgroundImage: 'none',
      } as CSSObject,
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        boxShadow: mode === 'dark'
          ? '0 1px 3px 0 rgba(0,0,0,0.3)'
          : '0 1px 3px 0 rgba(0,0,0,0.07)',
      } as CSSObject,
    },
  },
  MuiIconButton: {
      styleOverrides: {
        root: {
        borderRadius: 8,
      } as CSSObject,
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: 'none',
        backgroundImage: 'none',
      } as CSSObject,
    },
  },
  MuiTableCell: {
      styleOverrides: {
        root: {
        borderBottom: mode === 'dark'
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(0,0,0,0.1)',
      } as CSSObject,
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        backgroundColor: mode === 'dark'
          ? 'rgba(255,255,255,0.9)'
          : 'rgba(0,0,0,0.9)',
        color: mode === 'dark' ? '#000' : '#fff',
      } as CSSObject,
    },
  },
});

const createBaseTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: designTokens.colors.primary,
      secondary: designTokens.colors.secondary,
      error: designTokens.colors.error,
      warning: designTokens.colors.warning,
      info: designTokens.colors.info,
      success: designTokens.colors.success,
      background: {
        default: isDark ? designTokens.colors.backgrounds.dark : designTokens.colors.backgrounds.light,
        paper: isDark ? designTokens.colors.backgrounds.darkPaper : designTokens.colors.backgrounds.main,
      },
      text: {
        primary: isDark ? designTokens.colors.text.darkPrimary : designTokens.colors.text.lightPrimary,
        secondary: isDark ? designTokens.colors.text.darkSecondary : designTokens.colors.text.lightSecondary,
      },
      divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    typography: createTypography(mode),
    shape: {
      borderRadius: designTokens.borderRadius.md,
    },
    spacing: designTokens.spacing.sm,
    components: createBaseComponents(mode),
  };
};

// Create the responsive themes
export const lightTheme = responsiveFontSizes(createTheme(createBaseTheme('light')));

// Dark theme with improved contrast and color balance
export const darkTheme = responsiveFontSizes(createTheme({
  ...createBaseTheme('dark'),
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff',  // Bright cyan
      light: '#6effff',
      dark: '#00b2cc',
      contrastText: '#000000'
    },
    secondary: {
      main: '#ff1744',  // Bright red
      light: '#ff616f',
      dark: '#c4001d',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0a0a0a',  // Almost black
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.85)',  // Increased contrast
    },
    error: {
      main: '#ff3d00',
      light: '#ff7539',
      dark: '#c30000',
    },
    warning: {
      main: '#ffd600',
      light: '#ffff52',
      dark: '#c7a500',
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00b248',
    },
    info: {
      main: '#00e5ff',
      light: '#6effff',
      dark: '#00b2cc',
    },
    divider: 'rgba(0, 229, 255, 0.1)',
  },
  typography: {
    allVariants: {
      color: '#ffffff',  // Ensure all text is white by default
    },
    h1: {
      color: '#ffffff',
      textShadow: '0 0 20px rgba(0, 229, 255, 0.2)',
    },
    h2: {
      color: '#ffffff',
      textShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
    },
    h3: {
      color: '#ffffff',
      textShadow: '0 0 10px rgba(0, 229, 255, 0.2)',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    subtitle1: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    subtitle2: {
      color: 'rgba(255, 255, 255, 0.75)',
    },
  },
  components: {
    ...createBaseComponents('dark'),
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          '& .recharts-cartesian-grid-horizontal line, & .recharts-cartesian-grid-vertical line': {
            stroke: 'rgba(255, 255, 255, 0.1)',
          },
          '& .recharts-text': {
            fill: 'rgba(255, 255, 255, 0.85)',
          },
          '& .recharts-area': {
            fill: 'rgba(0, 229, 255, 0.15)',
          },
          '& .recharts-line': {
            stroke: '#00e5ff',
          },
          '& .recharts-tooltip': {
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 229, 255, 0.15)',
          },
          scrollbarColor: '#00e5ff #1a1a1a',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
            backgroundColor: '#1a1a1a',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 229, 255, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.5)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.03), rgba(0, 229, 255, 0.01))',
          borderRight: '1px solid rgba(0, 229, 255, 0.1)',
          '& .MuiListItem-root': {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(0, 229, 255, 0.2)',
              },
            },
          },
          '& .MuiListItemIcon-root': {
            color: 'rgba(0, 229, 255, 0.8)',
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(0, 229, 255, 0.1)',
          },
        } as CSSObject,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.05), rgba(0, 229, 255, 0.02))',
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 229, 255, 0.2)',
            transform: 'translateY(-2px)',
          },
          '& .MuiCardHeader-title': {
            color: '#ffffff',
          },
          '& .MuiCardHeader-subheader': {
            color: 'rgba(255, 255, 255, 0.85)',
          },
          '& .MuiCardContent-root': {
            color: '#ffffff',
          },
        } as CSSObject,
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'linear-gradient(45deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.1)',
          '& .MuiToolbar-root': {
            color: '#ffffff',
          },
        } as CSSObject,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          '&.MuiButton-contained': {
            background: 'linear-gradient(45deg, #00e5ff 30%, #2979ff 90%)',
            boxShadow: '0 3px 12px rgba(0, 229, 255, 0.3)',
            color: '#000000',
            fontWeight: 500,
          '&:hover': {
              boxShadow: '0 6px 16px rgba(0, 229, 255, 0.4)',
            },
          },
          '&.MuiButton-outlined': {
            borderColor: 'rgba(0, 229, 255, 0.5)',
            color: '#00e5ff',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              borderColor: '#00e5ff',
            },
          },
          '&.MuiButton-text': {
            color: '#00e5ff',
            '&:hover': {
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
            },
          },
        } as CSSObject,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.85)',
          '&:hover': {
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
        },
        } as CSSObject,
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 229, 255, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 229, 255, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00e5ff',
          },
        } as CSSObject,
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 229, 255, 0.1)',
          color: '#ffffff',
        } as CSSObject,
      },
    },
  },
}));

// Energy theme with vibrant energy-related colors
export const gradientTheme = responsiveFontSizes(createTheme({
  ...createBaseTheme('light'),
  palette: {
    mode: 'light',
    primary: {
      main: '#2dd36f',  // Vibrant energy green
      light: '#60ff9f',
      dark: '#00a040',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f7a600',  // Energy orange
      light: '#ffd740',
      dark: '#c17700',
      contrastText: '#000000'
    },
    background: {
      default: '#e8fff0',  // Very light green tint
      paper: '#ffffff',
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00b248',
    },
    warning: {
      main: '#ffd600',
      light: '#ffff52',
      dark: '#c7a500',
    },
    error: {
      main: '#ff3d00',
      light: '#ff7539',
      dark: '#c30000',
    },
  },
  components: {
    ...createBaseComponents('light'),
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(120deg, #2dd36f 0%, #f7a600 100%)',
          boxShadow: '0 4px 20px rgba(45, 211, 111, 0.2)',
        } as CSSObject,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(45, 211, 111, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(45, 211, 111, 0.2)',
            transform: 'translateY(-2px)',
          },
          transition: 'transform 0.2s ease-in-out',
        } as CSSObject,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          '&.MuiButton-contained': {
            background: 'linear-gradient(45deg, #2dd36f 30%, #f7a600 90%)',
            boxShadow: '0 3px 12px rgba(45, 211, 111, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(45, 211, 111, 0.4)',
            },
          },
        } as CSSObject,
      },
    },
  },
}));

// Blue theme with modern, professional look
export const blueTheme = responsiveFontSizes(createTheme({
  ...createBaseTheme('light'),
  palette: {
    mode: 'light',
    primary: { 
      main: '#0072f5',  // Modern blue
      light: '#3d95ff',
      dark: '#0052cc',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#7828c8',  // Purple accent
      light: '#9750dd',
      dark: '#5c1e9e',
      contrastText: '#ffffff' 
    },
    background: {
      default: '#f5f9ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#292929',
      secondary: '#555555'
    }
  },
  typography: {
    allVariants: {
      color: undefined,
    },
    body1: {
      color: '#292929',
    },
    body2: {
      color: '#292929',
    },
    subtitle1: {
      color: '#555555',
    },
    subtitle2: {
      color: '#555555',
    },
  },
  components: {
    ...createBaseComponents('light'),
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #0072f5 0%, #7828c8 100%)',
          boxShadow: '0 4px 20px rgba(0, 114, 245, 0.2)',
          "& .MuiTypography-root": {
            color: "#ffffff"
          },
          "& .MuiIconButton-root": {
            color: "#ffffff"
          }
        } as CSSObject,
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#292929',
          "&.Mui-selected": {
            color: '#0072f5',
          }
        } as CSSObject,
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#0072f5',
        } as CSSObject,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 114, 245, 0.12)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 114, 245, 0.16)',
            transform: 'translateY(-2px)',
          },
          transition: 'transform 0.2s ease-in-out',
          "& .MuiTypography-root": {
            color: "inherit"
          }
        } as CSSObject,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          "& .MuiTypography-root": {
            color: "#292929"
          }
        } as CSSObject,
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#292929"
        },
        secondary: {
          color: "#555555"
        }
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(0, 114, 245, 0.05)"
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(0, 114, 245, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(0, 114, 245, 0.15)"
            },
            "& .MuiListItemIcon-root": {
              color: "#0072f5"
            },
            "& .MuiListItemText-primary": {
              color: "#0072f5"
            }
          }
        } as CSSObject,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          '&.MuiButton-contained': {
            background: 'linear-gradient(45deg, #0072f5 30%, #7828c8 90%)',
            boxShadow: '0 3px 12px rgba(0, 114, 245, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0, 114, 245, 0.4)',
            },
          },
        } as CSSObject,
      },
    },
  },
}));

// Gray theme with elegant neutral palette
export const grayTheme = responsiveFontSizes(createTheme({
  ...createBaseTheme('light'),
  palette: {
    mode: 'light',
    primary: {
      main: '#374151',  // Refined gray
      light: '#4b5563',
      dark: '#1f2937',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#6b7280',  // Medium gray
      light: '#9ca3af',
      dark: '#4b5563',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563'
    }
  },
  typography: {
    allVariants: {
      color: undefined,
    },
    body1: {
      color: '#1f2937',
    },
    body2: {
      color: '#1f2937',
    },
    subtitle1: {
      color: '#4b5563',
    },
    subtitle2: {
      color: '#4b5563',
    },
  },
  components: {
    ...createBaseComponents('light'),
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #374151 0%, #6b7280 100%)',
          boxShadow: '0 4px 20px rgba(55, 65, 81, 0.2)',
          "& .MuiTypography-root": {
            color: "#ffffff"
          },
          "& .MuiIconButton-root": {
            color: "#ffffff"
          }
        } as CSSObject,
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#1f2937',
          "&.Mui-selected": {
            color: '#374151',
          }
        } as CSSObject,
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#374151',
        } as CSSObject,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(55, 65, 81, 0.12)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(55, 65, 81, 0.16)',
            transform: 'translateY(-2px)',
          },
          transition: 'transform 0.2s ease-in-out',
          "& .MuiTypography-root": {
            color: "inherit"
          }
        } as CSSObject,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          "& .MuiTypography-root": {
            color: "#1f2937"
          }
        } as CSSObject,
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#1f2937"
        },
        secondary: {
          color: "#4b5563"
        }
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(55, 65, 81, 0.05)"
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(55, 65, 81, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(55, 65, 81, 0.15)"
            },
            "& .MuiListItemIcon-root": {
              color: "#374151"
            },
            "& .MuiListItemText-primary": {
              color: "#374151"
            }
          }
        } as CSSObject,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          '&.MuiButton-contained': {
            background: 'linear-gradient(45deg, #374151 30%, #6b7280 90%)',
            boxShadow: '0 3px 12px rgba(55, 65, 81, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(55, 65, 81, 0.4)',
            },
          },
        } as CSSObject,
      },
    },
  },
}));

// Export theme aliases
export const tileTheme = blueTheme;
export const logoTheme = blueTheme;
