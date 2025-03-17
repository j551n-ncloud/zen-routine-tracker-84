
import { useState, useEffect, createContext, useContext } from 'react';
import { toast } from 'sonner';

// Types
interface User {
  userId: string;
  username: string;
  role: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Calculate the API base URL - prefer environment variables, fallback to current origin, then try localhost ports
const getApiBaseUrl = () => {
  // If we have an environment variable, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production, try to use the same origin
  if (process.env.NODE_ENV === 'production') {
    // If we're not in a browser, return a default localhost URL
    if (typeof window === 'undefined') {
      return 'http://localhost:3001';
    }
    
    // Check if we're on a different port than API (common in some deployments)
    const currentPort = window.location.port;
    if (currentPort === '8080' || currentPort === '5173') {
      // Likely a dev server, API probably on 3001
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }
    
    // Same origin
    return window.location.origin;
  }
  
  // In development, try localhost:3001
  return 'http://localhost:3001';
};

// API base URL
const API_BASE_URL = getApiBaseUrl();

// Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`Checking auth at ${API_BASE_URL}/api/auth/user`);
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server did not return JSON');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          // Clear invalid token
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Error checking authentication status');
        // Clear potentially invalid token
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Logging in at ${API_BASE_URL}/api/auth/login`);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server did not return JSON');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        toast.success('Login successful');
        return true;
      } else {
        setError(data.error || 'Login failed');
        toast.error(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
