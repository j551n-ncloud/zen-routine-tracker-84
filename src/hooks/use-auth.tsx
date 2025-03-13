
import { useState, useEffect, createContext, useContext } from 'react';
import { getData, saveData, executeQuery } from '../services/db-service';
import { toast } from 'sonner';

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

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize database with a default admin user if none exists
const initializeUserTable = async () => {
  try {
    // Create the users table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0
      );
    `);
    
    // Check if any users exist
    const users = await executeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );
    
    // If no users exist, create a default admin user
    if (users[0].count === 0) {
      await executeQuery(
        "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
        ["admin", "admin", 1]
      );
      console.log("Created default admin user");
    }
  } catch (error) {
    console.error("Failed to initialize users table:", error);
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize user table with default admin if needed
        await initializeUserTable();
        
        // Try to get user from SQLite
        const savedUser = await getData<User>("auth-user");
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
      // Validate credentials
      const users = await executeQuery<{ username: string; is_admin: number }>(
        "SELECT username, is_admin FROM users WHERE username = ? AND password = ?",
        [username, password]
      );
      
      if (users.length === 0) {
        toast.error("Invalid username or password");
        return false;
      }
      
      // Set the authenticated user
      const authenticatedUser = {
        username: users[0].username,
        isAdmin: !!users[0].is_admin
      };
      
      setUser(authenticatedUser);
      
      // Save to SQLite for persistence
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
