import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';
import './theme/theme.css';
import { SocketProvider } from './contexts/SocketContext';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserProvider } from './contexts/UserContext';
import { EnergyAuditProvider } from './pages/Energy Audit/EnergyAuditContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <CssBaseline />
          <HashRouter>
            <AuthProvider>
              <UserProvider>
                <NotificationProvider>
                  <SocketProvider>
                    <EnergyAuditProvider>
                      <App />
                    </EnergyAuditProvider>
                  </SocketProvider>
                </NotificationProvider>
              </UserProvider>
            </AuthProvider>
          </HashRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
