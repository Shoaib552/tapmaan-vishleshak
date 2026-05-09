import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token) {
      setUser({ token, email }); 
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/login`, formData);
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('email', email);
      setUser({ email, token: access_token });
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      return false;
    }
  };

  const register = async (email, full_name, location, phone, password) => {
    setError(null);
    try {
      await axios.post(`${API_URL}/register`, {
        email,
        full_name,
        location,
        phone,
        password
      });
      // Automatically login after registration
      return await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      register,
      logout,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
