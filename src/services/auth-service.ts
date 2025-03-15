
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authDataService } from './auth-data-service';
import { userService } from './user-service';

// Login user - modified to only allow specific user
export const signIn = async (email: string, password: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) throw error;

    // Check if user is the allowed user
    const ALLOWED_USER_ID = '9dada97d-4d28-4d25-a7fb-83f463f4dba1';
    
    if (data.user.id !== ALLOWED_USER_ID) {
      throw { code: 'unauthorized', message: 'This user is not authorized to access the system.' };
    }

    // Check if user exists in users table
    const userData = await userService.getUserByAuthId(data.user.id);
    
    // If user doesn't exist in users table but exists in auth, add them
    if (!userData && data.user) {
      await userService.ensureUserInDatabase(data.user, password);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.code === 'unauthorized') {
      toast.error('You are not authorized to access this system.');
    } else {
      toast.error('Invalid login credentials.');
    }
    
    throw error;
  }
};

// Sign out user
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Logout error:', error);
    toast.error('Failed to log out.');
    throw error;
  }
};

// Get current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

// Export utility functions from other modules
export const getUserData = userService.getUserData;
export const createDefaultAdminUser = authDataService.createDefaultAdminUser;
