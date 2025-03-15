
import { supabase } from '@/integrations/supabase/client';

export const userService = {
  // Get user data from the users table
  getUserData: async (userId: string) => {
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
  },

  // Get user by auth ID
  getUserByAuthId: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user by auth ID:', error);
      return null;
    }
  },

  // Ensure user exists in the database
  ensureUserInDatabase: async (user: any, password: string) => {
    const username = user.user_metadata?.username || user.email?.split('@')[0];
    
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: username,
          password: password,
          is_admin: username.toLowerCase() === 'admin'
        });
        
      if (insertError) {
        // If there's a duplicate username, try with a unique one
        if (insertError.code === '23505') {
          const uniqueUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
          const { error: retryError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              username: uniqueUsername,
              password: password,
              is_admin: uniqueUsername.toLowerCase() === 'admin'
            });
          
          if (retryError) throw retryError;
        } else {
          throw insertError;
        }
      }
    } catch (insertError) {
      console.error('Error adding user to users table:', insertError);
      // Continue with login even if insert fails - the auth is still valid
    }
  }
};
