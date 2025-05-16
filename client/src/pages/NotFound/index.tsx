import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  const history = useHistory();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h1"
            color="primary"
            sx={{
              fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            404
          </Typography>
          
          <Typography
            variant="h4"
            color="textPrimary"
            sx={{ mb: 3, fontWeight: 'medium' }}
          >
            Page Not Found
          </Typography>
          
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => history.push('/')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;
