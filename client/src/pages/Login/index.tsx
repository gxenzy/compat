import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
  useTheme
} from '@mui/material';
import { Visibility, VisibilityOff, Warning } from '@mui/icons-material';

const Login: React.FC = () => {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isSpecialTheme = ['#082f49', '#1f2937', '#042f2e', '#0f172a'].includes(theme.palette.background.default);
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('User already has a token, redirecting to dashboard...');
      history.push('/dashboard');
    }
  }, [history]);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Direct login without using context
  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('Attempting direct login with:', { username });
    
    // Try the primary endpoint first
    const endpoint = '/api/auth/login';
    
    try {
      console.log(`Trying login endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        // Don't include credentials to avoid CORS issues
      });
      
      console.log(`Endpoint ${endpoint} responded with:`, response.status);
      
      // Handle specific status codes
      if (response.status === 401) {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.token) {
        // Store authentication data
        localStorage.setItem('token', data.token);
        
        if (data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        
        console.log('Login successful! Redirecting to dashboard...');
        history.push('/dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err: any) {
      console.error(`Login attempt failed for ${endpoint}:`, err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    }
    
    setLoading(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
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

          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              icon={<Warning fontSize="inherit" />}
            >
              {error}
            </Alert>
          )}

          <Box 
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username or Student ID"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
