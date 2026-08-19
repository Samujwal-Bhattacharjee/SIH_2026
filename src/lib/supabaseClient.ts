import { createClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Validates if valid Supabase credentials are configured in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Singleton Supabase client instance with auto-refresh and session detection
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb_gov_auth_token',
    },
  }
);

/**
 * Maps a Supabase Auth User object into the GOIP application User format.
 */
export const mapSupabaseUserToAppUser = (
  supabaseUser: SupabaseAuthUser,
  profileData?: Partial<User> | null
): User => {
  const metadata = supabaseUser.user_metadata || {};
  const email = supabaseUser.email || '';
  
  // Extract display name from metadata (Google OAuth provides full_name / name)
  const fullName =
    profileData?.name ||
    metadata.full_name ||
    metadata.name ||
    (email.split('@')[0] ? email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) : 'Officer User');

  const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  return {
    id: supabaseUser.id,
    email: email,
    name: fullName,
    role: profileData?.role || (metadata.role as User['role']) || 'OPERATIONS_OFFICER',
    department: profileData?.department || metadata.department || 'General Administration',
    designation: profileData?.designation || metadata.designation || 'Operations Officer',
    badgeNumber: profileData?.badgeNumber || metadata.badgeNumber || `GOI-${supabaseUser.id.substring(0, 8).toUpperCase()}`,
    sessionExpiry: profileData?.sessionExpiry || expiry,
  };
};
