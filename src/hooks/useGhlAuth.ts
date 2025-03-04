import { useState, useEffect } from 'react';
import { getAuthUrl } from '@/lib/ghlAuth';

export function useGhlAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a valid token
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    window.location.href = getAuthUrl();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
}