import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { supabase, isSupabaseConfigured, mapSupabaseUserToAppUser } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name?: string,
    department?: string,
    designation?: string,
    role?: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseActive] = useState<boolean>(isSupabaseConfigured());

  const restoreSession = useCallback(async () => {
    try {
      // 1. Check direct Supabase Auth session first if configured
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          localStorage.setItem('gov_session_token', session.access_token);
          const mappedUser = mapSupabaseUserToAppUser(session.user);
          setUser(mappedUser);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to authService (handles mock mode / backend REST / localStorage)
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Setup Supabase live OAuth & token state listener
    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
          localStorage.setItem('gov_session_token', session.access_token);
          const mappedUser = mapSupabaseUserToAppUser(session.user);
          setUser(mappedUser);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('gov_session_token');
          localStorage.removeItem('gov_session_user');
          setUser(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [restoreSession]);

  const signIn = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      if (result && result.user) {
        setUser(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    department?: string,
    designation?: string,
    role?: string
  ) => {
    setLoading(true);
    try {
      const result = await authService.signUp(email, password, name, department, designation, role);
      if (result && result.user) {
        setUser(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      // If mock mode, result is returned directly
      if (result && 'user' in result && result.user) {
        setUser(result.user);
      }
      // If real Supabase OAuth, browser is redirected to Google OAuth
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (err) {
      console.warn('Sign out warning:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
        isSupabaseActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
