
import { supabase } from '@/integrations/supabase/client';

export const authDataService = {
  // Create default admin user if needed
  createDefaultAdminUser: async (): Promise<boolean> => {
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
        try {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              username: 'admin',
              password: adminPassword,
              is_admin: true
            });
            
          if (userError) throw userError;
        } catch (error) {
          // If the admin user already exists in the users table, that's fine
          if (error.code === '23505') {
            console.log('Admin user already exists in users table');
          } else {
            throw error;
          }
        }
        
        console.log('Default admin user created successfully:', adminEmail);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating default admin user:', error);
      return false;
    }
  }
};
