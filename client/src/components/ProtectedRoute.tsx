import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuthContext();
  const isAuthenticated = !!currentUser;
  
  return isAuthenticated ? <>{children}</> : <Redirect to="/login" />;
};

export default ProtectedRoute; 