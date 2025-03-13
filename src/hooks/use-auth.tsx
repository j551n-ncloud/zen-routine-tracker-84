
import { useState, useEffect, createContext, useContext } from 'react';
import { getData, saveData, executeQuery, isMockMode } from '../services/db-service';
import { toast } from 'sonner';
import { RowDataPacket } from 'mysql2';

// Define types
export interface User {
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Define row data interface for user query
interface UserRow extends RowDataPacket {
  username: string;
  is_admin: number;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Try to get user from database
        const savedUser = await getData("auth-user");
        if (savedUser) {
          setUser(savedUser);
          console.log("User loaded from storage:", savedUser.username);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Mock mode login
      if (isMockMode()) {
        console.log("Mock mode login for:", username);
        
        // In mock mode, accept any credentials, but recognize "admin" specifically
        const isAdmin = username.toLowerCase() === 'admin';
        
        const authenticatedUser = {
          username: username,
          isAdmin: isAdmin
        };
        
        setUser(authenticatedUser);
        await saveData("auth-user", authenticatedUser);
        
        toast.success(`Welcome back, ${authenticatedUser.username}!`);
        return true;
      }
      
      // Real database login
      const users = await executeQuery<UserRow[]>(
        "SELECT username, is_admin FROM users WHERE username = ? AND password = ?",
        [username, password]
      );
      
      if (!users || users.length === 0) {
        toast.error("Invalid username or password");
        return false;
      }
      
      // Set the authenticated user
      const authenticatedUser = {
        username: users[0].username,
        isAdmin: !!users[0].is_admin
      };
      
      setUser(authenticatedUser);
      
      // Save to database for persistence
      await saveData("auth-user", authenticatedUser);
      
      toast.success(`Welcome back, ${authenticatedUser.username}!`);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
      return false;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setUser(null);
      await saveData("auth-user", null);
      toast.success("You've been logged out");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
