'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user'; // Assuming User type exists

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API functions - replace with actual API calls
async function mockLoginApi(credentials: { email: string; password?: string }): Promise<{ user: User; token: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real app, you'd send credentials to your backend (e.g., Laravel)
  // The backend would verify credentials and return user data and a token
  if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
    return {
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
      token: 'fake-admin-token',
    };
  } else if (credentials.email === 'student@example.com' && credentials.password === 'password') {
     return {
      user: { id: '2', name: 'Student User', email: 'student@example.com', role: 'doctorant' },
      token: 'fake-student-token',
    };
  } else {
    throw new Error('Invalid credentials');
  }
}

async function mockVerifyTokenApi(token: string): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (token === 'fake-admin-token') {
    return { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' };
  } else if (token === 'fake-student-token') {
     return { id: '2', name: 'Student User', email: 'student@example.com', role: 'doctorant' };
  }
  return null;
}


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        // Replace with actual API call to verify token
        const userData = await mockVerifyTokenApi(storedToken);
        if (userData) {
          setUser(userData);
          setToken(storedToken);
          // Redirect based on role if not already on the correct dashboard
          const currentPath = window.location.pathname;
          if (userData.role === 'admin' && !currentPath.startsWith('/admin')) {
            router.push('/admin/dashboard');
          } else if (userData.role === 'doctorant' && !currentPath.startsWith('/student')) {
            router.push('/student/dashboard');
          }
        } else {
          logout(); // Invalid token
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        logout();
      }
    }
    setIsLoading(false);
  }, [router]); // Added router dependency


  useEffect(() => {
    verifyToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const login = useCallback(async (userData: User, newToken: string) => {
    setUser(userData);
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    // Redirect after login
    if (userData.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (userData.role === 'doctorant') {
      router.push('/student/dashboard');
    }
  }, [router]);


  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/login');
  }, [router]);

  const value = { user, token, login, logout, isLoading };

  // Show loading state or children based on isLoading
  // Or simply return children if initial loading state handling is done elsewhere
  // if (isLoading) {
  //   return <div>Loading authentication...</div>; // Or a proper loading spinner
  // }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
