import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
}

interface NeonAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const NeonAuthContext = createContext<NeonAuthContextType | undefined>(undefined);

// Neon Auth configuration
const projectId = import.meta.env.VITE_STACK_PROJECT_ID || '';
const publishableKey = import.meta.env.VITE_STACK_PUBLISHABLE_KEY || '';

if (!projectId || !publishableKey) {
  console.warn('Neon Auth not configured. Please set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_KEY environment variables.');
}

export function NeonAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated by calling our backend
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.authenticated && userData.user) {
            setUser(userData.user);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // For now, use demo mode since Neon Auth requires Next.js SDK or production domain
    // TODO: Implement proper Neon Auth when deploying to production
    console.log('Using demo login - configure Neon Auth properly for production');
    window.location.href = '/auth/callback?demo=true';
  };

  const logout = async () => {
    try {
      setUser(null);
      
      // Call backend logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout by clearing user and redirecting
      setUser(null);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <NeonAuthContext.Provider value={value}>
      {children}
    </NeonAuthContext.Provider>
  );
}

export function useNeonAuth() {
  const context = useContext(NeonAuthContext);
  if (context === undefined) {
    throw new Error('useNeonAuth must be used within a NeonAuthProvider');
  }
  return context;
}