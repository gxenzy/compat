import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Snackbar,
  Alert,
  Fab,
  Button,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircle,
  ExitToApp,
  Brightness4,
  Brightness7,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import NotificationCenter from './MainLayoutNotificationCenter';
import { styled } from '@mui/material/styles';
import { useNotificationContext } from '../../contexts/NotificationContext';
import NotificationListener from '../../components/NotificationListener';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import { useThemeMode } from '../../contexts/ThemeContext';
import { designTokens } from '../../theme';
import { alpha } from '@mui/material/styles';
import AccessibilitySettingsButton from '../../components/UI/AccessibilitySettingsButton';

const drawerWidth = 190;

const Main = styled('main')<{
  sidebarwidth: number;
}>(({ theme, sidebarwidth }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: sidebarwidth,
}));

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const { notifications, markAsRead } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<typeof notifications[0] | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { mode, isDarkMode } = useThemeMode();

  const sidebarWidth = sidebarCollapsed ? 64 : drawerWidth;

  // Calculate the needed space after the sidebar based on the theme
  const mainContentSpacing = () => {
    // Energy theme should have no extra padding
    if (mode === 'energy') {
      return {
        p: { xs: 1, sm: 1 },
        ml: 0,
        marginLeft: 0
      };
    }
    return {
      p: { xs: 1, sm: 2 },
      ml: 0,
      marginLeft: 0
    };
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    
    // Remove token and user from localStorage immediately
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    console.log('Logging out - localStorage tokens removed');
    
    // Don't attempt server communication - just redirect to login
    history.push('/login');
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    history.push('/profile');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    history.push('/settings');
  };

  useEffect(() => {
    if (notifications.length > 0) {
      setCurrent(notifications.find(n => !n.read) || notifications[0]);
      setOpen(true);
    }
  }, [notifications]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (current) markAsRead(current.id);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get user's profile picture if available
  const userProfileImage = user && ('profileImage' in user ? user.profileImage : 
                          ('avatar' in user ? user.avatar : null));
  
  const userImageSrc = userProfileImage ? String(userProfileImage) : '';

  // Handle navigation in v5 style
  const handleNavigation = (path: string) => {
    history.push(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <NotificationListener />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          ml: { sm: `${sidebarWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: mode === 'energy' 
            ? 'transparent'
            : mode === 'blue' || mode === 'gray'
              ? theme.palette.primary.main
              : isDarkMode 
                ? alpha(theme.palette.background.paper, 0.8)
                : 'rgba(255,255,255,0.8)',
          color: mode === 'energy' || mode === 'blue' || mode === 'gray'
            ? '#ffffff'
            : theme.palette.text.primary,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundImage: mode === 'energy' 
            ? 'linear-gradient(135deg, #059669 0%, #0284c7 100%)'
            : mode === 'blue'
              ? 'linear-gradient(to right, #0284c7, #0369a1)'
              : mode === 'gray'
                ? 'linear-gradient(to right, #4b5563, #374151)'
                : 'none',
          boxShadow: isDarkMode 
            ? '0 4px 16px rgba(0,0,0,0.2)'
            : mode === 'blue' || mode === 'gray'
              ? '0 2px 16px rgba(0,0,0,0.15)'
              : '0 2px 16px rgba(0,0,0,0.05)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          transition: theme => theme.transitions.create(['width', 'margin-left', 'box-shadow'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mr: 2,
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              
            </Box>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: { xs: 0, md: 0 },
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 600,
                background: ['energy', 'blue', 'gray'].includes(mode)
                  ? 'linear-gradient(45deg, #ffffff 30%, #e0e0e0 90%)'
                  : theme.palette.mode === 'dark' 
                    ? 'linear-gradient(45deg, #e0e0e0 30%, #ffffff 90%)'
                    : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: ['energy', 'blue', 'gray'].includes(mode) 
                  ? 'transparent' 
                  : theme.palette.mode === 'dark' 
                    ? 'transparent' 
                    : undefined,
                mr: 4
              }}
            >
              CompAT
            </Typography>
            
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={() => handleNavigation('/dashboard')}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderRadius: '20px',
                    color: location.pathname === '/dashboard' 
                      ? ['energy', 'blue', 'gray'].includes(mode) ? '#ffffff' : theme.palette.primary.main 
                      : ['energy', 'blue', 'gray'].includes(mode) ? 'rgba(255, 255, 255, 0.8)' : theme.palette.text.secondary,
                    bgcolor: location.pathname === '/dashboard' 
                      ? ['energy', 'blue', 'gray'].includes(mode) ? 'rgba(255, 255, 255, 0.15)' : alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    '&:hover': {
                      bgcolor: ['energy', 'blue', 'gray'].includes(mode) 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : alpha(theme.palette.primary.main, 0.1)
                    },
                    textTransform: 'none',
                    fontWeight: ['blue', 'gray'].includes(mode) ? 600 : 500,
                    textShadow: ['blue', 'gray'].includes(mode) ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  Dashboard
                </Button>
                
                <Button 
                  size="small"
                  onClick={() => handleNavigation('/energy-audit')}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderRadius: '20px',
                    color: location.pathname.includes('/energy-audit') 
                      ? ['energy', 'blue', 'gray'].includes(mode) ? '#ffffff' : theme.palette.primary.main 
                      : ['energy', 'blue', 'gray'].includes(mode) ? 'rgba(255, 255, 255, 0.8)' : theme.palette.text.secondary,
                    bgcolor: location.pathname.includes('/energy-audit') 
                      ? ['energy', 'blue', 'gray'].includes(mode) ? 'rgba(255, 255, 255, 0.15)' : alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    '&:hover': {
                      bgcolor: ['energy', 'blue', 'gray'].includes(mode) 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : alpha(theme.palette.primary.main, 0.1)
                    },
                    textTransform: 'none',
                    fontWeight: ['blue', 'gray'].includes(mode) ? 600 : 500,
                    textShadow: ['blue', 'gray'].includes(mode) ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  Energy Audit
                </Button>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Switcher */}
            <ThemeSwitcher />
            
            {/* Accessibility Settings Button */}
            <Box sx={{ mx: 1 }}>
              <AccessibilitySettingsButton size="medium" tooltip="Accessibility Settings (Alt+A)" />
            </Box>
            
            {/* Notifications */}
            <NotificationCenter onNavigate={handleNavigation} />
            
            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Account">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                  sx={{ 
                    p: 0,
                    ml: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.background.paper, 0.1)
                    }
                  }}
                >
                  {userImageSrc && userImageSrc !== '' ? (
                    <Avatar 
                      src={userImageSrc} 
                      alt={user?.name || 'User Profile'}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        border: '2px solid',
                        borderColor: alpha(theme.palette.background.paper, 0.3)
                      }} 
                    />
                  ) : (
                    <Avatar 
                      alt={user?.name || 'User Profile'}
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.secondary.main,
                        color: theme.palette.secondary.contrastText,
                        border: '2px solid',
                        borderColor: alpha(theme.palette.background.paper, 0.3)
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={mobileOpen || !sidebarCollapsed}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.sidebar,
            color: ['dark', 'darkBlue', 'energy', 'blue', 'gray'].includes(mode) ? '#ffffff' : theme.palette.text.primary,
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            boxShadow: sidebarCollapsed 
              ? `4px 0 8px ${alpha(theme.palette.common.black, 0.08)}`
              : 'none',
            transition: theme.transitions.create(
              ['width', 'background-color', 'border-color', 'box-shadow'],
              {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }
            ),
            '& .MuiListItemIcon-root': {
              color: 'inherit',
              minWidth: sidebarCollapsed ? 'auto' : 36,
              marginRight: sidebarCollapsed ? 0 : 2,
              opacity: 0.9,
            },
            '& .MuiListItemText-root': {
              opacity: sidebarCollapsed ? 0 : 0.9,
              transition: theme.transitions.create(['opacity', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
              color: 'inherit',
            },
            '& .MuiListItemButton-root': {
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              px: sidebarCollapsed ? 2 : 1.5,
              '&:hover': {
                backgroundColor: ['dark', 'darkBlue', 'energy', 'blue', 'gray'].includes(mode) 
                  ? alpha('#ffffff', 0.08) 
                  : alpha(theme.palette.primary.main, 0.08),
              },
              '&.Mui-selected': {
                backgroundColor: ['dark', 'darkBlue', 'energy', 'blue', 'gray'].includes(mode) 
                  ? alpha('#ffffff', 0.12) 
                  : alpha(theme.palette.primary.main, 0.12),
                '&:hover': {
                  backgroundColor: ['dark', 'darkBlue', 'energy', 'blue', 'gray'].includes(mode) 
                    ? alpha('#ffffff', 0.18) 
                    : alpha(theme.palette.primary.main, 0.18),
                },
              },
            },
          },
          width: sidebarWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <Toolbar />
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </Drawer>

      <Main 
        sidebarwidth={sidebarWidth} 
        sx={{ 
          flexGrow: 1,
          ...mainContentSpacing(),
          width: { sm: `calc(100% - ${sidebarWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          maxWidth: '100%',
          gap: mode === 'energy' ? 1 : 2, // Smaller gaps in energy theme
          pl: 0,
          pr: 0
        }}>
          {children}
        </Box>
      </Main>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* NotificationsMenu has been replaced by the new NotificationCenter component */}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      )}

      <Snackbar 
        open={open && !!current} 
        autoHideDuration={4000} 
        onClose={handleClose} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        {current ? (
          <Alert 
            onClose={handleClose} 
            severity={current.type} 
            sx={{ 
              width: '100%',
              boxShadow: 3,
            }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default MainLayout;
