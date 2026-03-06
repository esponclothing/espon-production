import { supabase } from './supabase';
import { useState, useEffect } from 'react';

// Auth service object
export const authService = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user?.id)
        .single();

      if (profileError) throw profileError;

      return { user: profile, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return profile;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user?.role === 'admin';
    } catch {
      return false;
    }
  },

  onAuthStateChange(callback: (event: string, user: any) => void) {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        callback(_event, profile);
      } else {
        callback(_event, null);
      }
    });

    return data?.subscription;
  },

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },
};

// useAuth hook
export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      setUser(user);
      setLoading(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const unsubscribe = authService.onAuthStateChange((_event, user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return { user, session, loading };
};
