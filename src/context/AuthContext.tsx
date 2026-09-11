import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { getValidAuthToken } from '../services/api/realApi';
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
      // 1. Authoritative check: Validate stored session token against backend /api/v1/auth/me
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
        return;
      }

      // 2. Fallback: Check direct Supabase Auth session ONLY when there is
      //    genuinely no backend token stored at all. If getCurrentUser()
      //    returned null because the backend rejected a stale token, that
      //    token was already cleared from gov_session_token by realApi.
      //    Blindly restoring a Supabase session here would re-introduce a
      //    stale/invalid token and cause 401s on subsequent API calls.
      setUser(null);
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
        // Only handle explicit SIGNED_IN or TOKEN_REFRESHED; never let INITIAL_SESSION clobber backend JWT.
        // CRITICAL: Do NOT overwrite gov_session_token if a valid backend-issued
        // JWT already exists. Supabase may fire these events with stale/invalid
        // tokens from sb_gov_auth_token localStorage which would clobber the
        // working backend token and cause 401 errors.
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Keep Supabase session distinct from FastAPI JWT
          if (event === 'SIGNED_IN') {
            const mappedUser = mapSupabaseUserToAppUser(session.user);
            setUser(mappedUser);
            setLoading(false);
          }
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
        // Clear any stale Supabase session to prevent onAuthStateChange from
        // firing later and overwriting the fresh backend-issued token.
        localStorage.removeItem('sb_gov_auth_token');
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
        // Clear any stale Supabase session to prevent token clobbering
        localStorage.removeItem('sb_gov_auth_token');
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
        isAuthenticated: !!user && !!getValidAuthToken(),
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
