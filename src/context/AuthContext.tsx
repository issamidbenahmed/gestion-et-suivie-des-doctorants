'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user'; // Assuming User type exists
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface SignupCredentials {
    name: string;
    email: string;
    password?: string; // Optional for update, required for signup
    domaine?: string; // Required for student signup
}

// Define credentials type for login
interface LoginCredentials {
  email: string;
  password?: string;
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials, token?: string) => Promise<void>; // Update signature
  signup: (credentials: SignupCredentials) => Promise<void>; // Add signup method
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Temporary storage for mock users, including dynamically added ones
let mockUserStorage: User[] = [
     { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
     { id: '2', name: 'Student User', email: 'student@example.com', role: 'doctorant', domaine: 'Initial Domain' }, // Example initial student
     // Add initial students from admin/students mock data if needed
     { id: '2', name: 'Alice Smith', email: 'alice@example.com', role: 'doctorant', domaine: 'Computer Science' },
     { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'doctorant', domaine: 'Physics' },
     { id: '4', name: 'Charlie Brown', email: 'charlie@example.com', role: 'doctorant', domaine: 'Mathematics' },
];
// Add mock passwords (in real app, this is handled securely by backend)
const mockPasswords: { [email: string]: string } = {
    'admin@example.com': 'password',
    'student@example.com': 'password',
    'alice@example.com': 'password', // Assuming default password for mocked students
    'bob@example.com': 'password',
    'charlie@example.com': 'password',
};


// Mock API functions - replace with actual API calls
async function mockLoginApi(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = mockUserStorage.find(u => u.email === credentials.email);
  const storedPassword = mockPasswords[credentials.email];

   console.log("Attempting login for:", credentials.email);
   console.log("Found user:", user);
   console.log("Stored password:", storedPassword);
   console.log("Provided password:", credentials.password);


  if (user && credentials.password && storedPassword === credentials.password) {
     console.log("Login successful for:", user.email);
    // Return the found user and a fake token
    return {
      user: user,
      token: `fake-${user.role}-token-${user.id}`, // Generate a unique fake token
    };
  } else {
      console.log("Login failed for:", credentials.email);
    throw new Error('Invalid credentials');
  }
}

async function mockSignupApi(credentials: SignupCredentials): Promise<{ user: User; token: string }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Check if email already exists
    if (mockUserStorage.some(u => u.email === credentials.email)) {
        throw new Error('Email already in use.');
    }
    if (!credentials.password) {
        throw new Error('Password is required for signup.');
    }

    // Create new user (assuming 'doctorant' role for self-signup)
    const newUser: User = {
        id: `user-${Math.random().toString(36).substring(2, 9)}`, // Generate unique ID
        name: credentials.name,
        email: credentials.email,
        role: 'doctorant',
        domaine: credentials.domaine || 'Not Specified', // Default if not provided
    };

    // Add user to mock storage
    mockUserStorage.push(newUser);
    mockPasswords[newUser.email] = credentials.password; // Store mock password

    console.log('Mock User Storage Updated:', mockUserStorage);
    console.log('Mock Passwords Updated:', mockPasswords);


    // Return new user and a fake token
     return {
        user: newUser,
        token: `fake-doctorant-token-${newUser.id}`, // Generate a unique fake token
    };
}


async function mockVerifyTokenApi(token: string): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
   // Check against dynamically generated tokens or hardcoded ones
    const tokenParts = token.split('-'); // e.g., ['fake', 'admin', 'token', '1'] or ['fake', 'doctorant', 'token', 'user-xyz']
    if (tokenParts.length >= 4 && tokenParts[0] === 'fake' && tokenParts[2] === 'token') {
        const userId = tokenParts.slice(3).join('-'); // Handle IDs potentially containing '-'
        const user = mockUserStorage.find(u => u.id === userId);
        if (user && user.role === tokenParts[1]) { // Check role match too
            return user;
        }
    }
  return null;
}


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast(); // Get toast function

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
          // Redirect based on role only if on root or login/signup page initially
           const currentPath = window.location.pathname;
           if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
               if (userData.role === 'admin') {
                   router.replace('/admin/dashboard');
               } else if (userData.role === 'doctorant') {
                   router.replace('/student/dashboard');
               }
           }
        } else {
            // Don't auto-logout if token is invalid, let login/signup proceed
             // logout();
             console.log("Token verification failed, removing invalid token.");
            localStorage.removeItem('authToken'); // Clear invalid token
        }
      } catch (error) {
        console.error('Token verification failed:', error);
         localStorage.removeItem('authToken'); // Clear potentially problematic token
        // logout();
      }
    }
    setIsLoading(false);
  }, [router]); // Added router dependency


  useEffect(() => {
    verifyToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
        // Call the mock login API defined within this context
        const { user: userData, token: newToken } = await mockLoginApi(credentials);

        // Set state
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('authToken', newToken);

        // Show success toast
        toast({
            title: "Login Successful",
            description: `Welcome back, ${userData.name}!`,
        });


        // Redirect after successful login
        if (userData.role === 'admin') {
            router.push('/admin/dashboard');
        } else if (userData.role === 'doctorant') {
            router.push('/student/dashboard');
        }
    } catch (error) {
        // If mockLoginApi throws, re-throw to be caught by the calling component
        console.error("Error during login process in context:", error);
        throw error; // Propagate the error
    }
  }, [router, toast]);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    // Call the mock signup API
    const { user: newUser, token: newToken } = await mockSignupApi(credentials);
    // Note: We don't automatically log the user in after signup in this flow.
    // They will be redirected to the login page.
     console.log("Signup successful for:", newUser);
     // No need to set user/token state here as they need to login separately
  }, []);


  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    router.push('/login');
     toast({ title: "Logged Out", description: "You have been successfully logged out."});
  }, [router, toast]);

  const value = { user, token, login, signup, logout, isLoading };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
