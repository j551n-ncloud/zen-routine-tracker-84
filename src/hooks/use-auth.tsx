
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as authService from '@/services/auth-service';

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
        const session = await authService.getCurrentSession();
        
        if (session?.user) {
          // Get user details from Supabase
          const userData = await authService.getUserData(session.user.id);
            
          if (userData) {
            setUser({
              username: userData.username,
              isAdmin: !!userData.is_admin
            });
            console.log("User loaded from Supabase session:", userData.username);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up Supabase auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const userData = await authService.getUserData(session.user.id);
          if (userData) {
            setUser({
              username: userData.username,
              isAdmin: !!userData.is_admin
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    initialize();
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Login function - now handles both sign up and login
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const email = `${username}@example.com`; // For demo purposes
      
      // First, try to sign in
      try {
        const authData = await authService.signIn(email, password);
        
        if (authData.user) {
          const userData = await authService.getUserData(authData.user.id);
          
          if (userData) {
            setUser({
              username: userData.username,
              isAdmin: !!userData.is_admin
            });
            toast.success(`Welcome back, ${userData.username}!`);
            return true;
          }
        }
      } catch (error) {
        // If login fails, try to sign up
        console.log("Login failed, attempting signup");
        const signUpSuccess = await authService.signUp(email, password, username);
        
        if (signUpSuccess) {
          // After signup, sign in
          const authData = await authService.signIn(email, password);
          
          if (authData.user) {
            // New user is created, set user state
            setUser({
              username: username,
              isAdmin: username.toLowerCase() === 'admin'
            });
            toast.success(`Welcome, ${username}!`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication failed. Please try again.");
      return false;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await authService.signOut();
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
