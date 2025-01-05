import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axiosInstance from '../helpers/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // Login function to authenticate the user and set HTTP-only cookie
  const login = async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth', credentials, { withCredentials: true });
      setUser(response.data.user); // Set user data from server response
      localStorage.setItem('user', JSON.stringify(response.data.user)); 
      localStorage.setItem('accessToken', response.data.accessToken);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Logout function to clear the session
  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem('user'); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check for existing session on initial load
  const hasCheckedSession = useRef(false);

  useEffect(() => {  
    const checkSession = async () => {
      try {
        const response = await axiosInstance.get('/auth/session', { withCredentials: true });
        setUser(response.data.user); // Set user data if session exists
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
      } catch (error) {
        console.log('No active session:', error);
      } finally {
        setLoading(false); // Mark session check as complete
      }
    };
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      if (!hasCheckedSession.current) {
        checkSession();
        hasCheckedSession.current = true;
      }
    }    
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
  
};
