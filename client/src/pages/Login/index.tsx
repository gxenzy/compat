import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, Warning } from '@mui/icons-material';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error: authError, isAuthenticated } = useAuthContext();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isSpecialTheme = ['#082f49', '#1f2937', '#042f2e', '#0f172a'].includes(theme.palette.background.default);
  
  // Check for redirect params in URL
  useEffect(() => {
    // Auto-redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    
    // Check if there's a 'from' param in the location state (redirect after login)
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    
    // Check for specific error messages in URL params
    const params = new URLSearchParams(location.search);
    const sessionExpired = params.get('sessionExpired');
    const unauthorized = params.get('unauthorized');
    
    if (sessionExpired === 'true') {
      setFormError('Your session has expired. Please log in again.');
    } else if (unauthorized === 'true') {
      setFormError('You need to log in to access that page.');
    }
  }, [isAuthenticated, location, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic validation
    if (!formData.username.trim()) {
      setFormError('Please enter your username');
      return;
    }
    
    if (!formData.password.trim()) {
      setFormError('Please enter your password');
      return;
    }

    try {
      const success = await login(formData.username, formData.password);
      if (success) {
        // Get the redirect path from location state or default to dashboard
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setFormError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please check your credentials and try again.'
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isSpecialTheme 
          ? theme.palette.background.default
          : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: isSpecialTheme ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, width: '70%', maxWidth: 180 }}>
            <img 
              src={isDarkMode || isSpecialTheme ? "/logo-white.png" : "/logo-black.png"} 
              alt="Company Logo" 
              style={{ width: '100%', height: 'auto' }}
            />
          </Box>

          <Typography 
            component="h1" 
            variant="h5" 
            gutterBottom
            sx={{ 
              color: isSpecialTheme ? '#ffffff' : 'inherit'
            }}
          >
            Sign In
          </Typography>

          {(formError || authError) && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              icon={<Warning fontSize="inherit" />}
            >
              {formError || authError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username or Student ID"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              error={!!formError && formError.toLowerCase().includes('username')}
              InputProps={{
                spellCheck: false,
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : undefined
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isSpecialTheme ? 'rgba(255, 255, 255, 0.3)' : undefined
                  },
                  '&:hover fieldset': {
                    borderColor: isSpecialTheme ? 'rgba(255, 255, 255, 0.5)' : undefined
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isSpecialTheme ? theme.palette.primary.light : undefined
                  },
                  '& input': {
                    color: isSpecialTheme ? '#ffffff' : undefined
                  }
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              error={!!formError && formError.toLowerCase().includes('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      sx={{ color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : undefined }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : undefined
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: isSpecialTheme ? 'rgba(255, 255, 255, 0.3)' : undefined
                  },
                  '&:hover fieldset': {
                    borderColor: isSpecialTheme ? 'rgba(255, 255, 255, 0.5)' : undefined
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: isSpecialTheme ? theme.palette.primary.light : undefined
                  },
                  '& input': {
                    color: isSpecialTheme ? '#ffffff' : undefined
                  }
                }
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link 
                component="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{ 
                  textDecoration: 'none',
                  color: isSpecialTheme ? 'rgba(255, 255, 255, 0.7)' : undefined,
                  '&:hover': {
                    color: isSpecialTheme ? '#ffffff' : undefined
                  }
                }}
              >
                Forgot password?
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
