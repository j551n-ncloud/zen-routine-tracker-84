
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../services/supabase-service';
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

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize auth state on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is already logged in with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user details from Supabase
          const { data, error } = await supabase
            .from('users')
            .select('username, is_admin')
            .eq('user_id', session.user.id)
            .single();
            
          if (!error && data) {
            setUser({
              username: data.username,
              isAdmin: !!data.is_admin
            });
            console.log("User loaded from Supabase session:", data.username);
          }
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
      // Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@example.com`, // For demo purposes
        password: password
      });
      
      if (error || !data.user) {
        toast.error("Invalid username or password");
        return false;
      }
      
      // Get user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, is_admin')
        .eq('user_id', data.user.id)
        .single();
        
      if (userError || !userData) {
        // If user record not found, create one
        const newUser = {
          user_id: data.user.id,
          username: username,
          is_admin: username.toLowerCase() === 'admin' ? true : false
        };
        
        await supabase.from('users').insert(newUser);
        
        const authenticatedUser = {
          username: username,
          isAdmin: username.toLowerCase() === 'admin'
        };
        
        setUser(authenticatedUser);
        toast.success(`Welcome, ${authenticatedUser.username}!`);
        return true;
      }
      
      // Set authenticated user from database
      const authenticatedUser = {
        username: userData.username,
        isAdmin: !!userData.is_admin
      };
      
      setUser(authenticatedUser);
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
      await supabase.auth.signOut();
      setUser(null);
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
