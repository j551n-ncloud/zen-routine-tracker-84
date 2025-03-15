
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Create a user (signup)
export const signUp = async (email: string, password: string, username: string): Promise<boolean> => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username
        }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) return false;
    
    // 2. Insert into users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: username,
        password: password, // Adding the password field back
        is_admin: username.toLowerCase() === 'admin'
      });
      
    if (userError) throw userError;
    
    return true;
  } catch (error) {
    console.error('Signup error:', error);
    toast.error('Failed to create account. Please try again.');
    return false;
  }
};

// Login user - modified to only allow sign in (no sign up)
export const signIn = async (email: string, password: string): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) throw error;

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    if (userError) throw userError;

    // If user doesn't exist in users table but exists in auth, add them
    if (!userData && data.user) {
      const username = data.user.user_metadata?.username || email.split('@')[0];
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username: username,
          password: password,
          is_admin: username.toLowerCase() === 'admin'
        });
        
      if (insertError) throw insertError;
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    toast.error('Invalid login credentials.');
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

// Get user data from the users table
export const getUserData = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, is_admin')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Get user data error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
};

// Create default admin user if needed
export const createDefaultAdminUser = async (): Promise<boolean> => {
  try {
    // Check if any users exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (checkError) throw checkError;
    
    // If users exist, no need to create an admin
    if (existingUsers && existingUsers.length > 0) {
      return false;
    }
    
    // Create admin user
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    // First try to sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword
    });
    
    if (authError) throw authError;
    
    if (authData.user) {
      // Then insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: 'admin',
          password: adminPassword, // Adding the password field back
          is_admin: true
        });
        
      if (userError) throw userError;
      
      console.log('Default admin user created successfully:', adminEmail);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating default admin user:', error);
    return false;
  }
};
