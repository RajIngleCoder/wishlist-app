import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuthStore } from '../store/authStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.')
}

const STORAGE_KEY = 'supabase-auth-v2'

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_KEY,
    storage: window.localStorage
  },
  persistSession: true,
  detectSessionInUrl: true,
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
}

let supabaseInstance: SupabaseClient | null = null

const createSupabaseClient = () => {
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, options)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      throw new Error('Failed to initialize authentication service')
    }
  }
  return supabaseInstance
}

export const supabase = createSupabaseClient()

// Enhanced error handling for network connectivity and auth state changes
supabase.auth.onAuthStateChange(async (event, session) => { // Added async here
  console.log(`[supabaseClient] onAuthStateChange: Event - ${event}`, { session });

  const { fetchUser, logout, user } = useAuthStore.getState();

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    if (session && session.user) {
      console.log('[supabaseClient] onAuthStateChange: SIGNED_IN, TOKEN_REFRESHED, or USER_UPDATED with session.user. Triggering fetchUser.');
      await fetchUser(); // This will handle profile creation/update
    } else {
      console.warn('[supabaseClient] onAuthStateChange: SIGNED_IN, TOKEN_REFRESHED, or USER_UPDATED event but no session.user. Logging out.');
      // If there's no session or user, but we got a SIGNED_IN event, something is wrong.
      // It's safer to ensure the user is logged out from the app state.
      if (user) logout();
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('[supabaseClient] onAuthStateChange: SIGNED_OUT. Clearing user state.');
    if (user) logout(); // Clear user state in the store
    // Optionally, redirect to login page or home page
    // window.location.href = '/login';
  } else if (event === 'INITIAL_SESSION') {
    if (session && session.user) {
      console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION with session.user. Triggering fetchUser.');
      await fetchUser();
    } else {
      console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - No session.user detected.');
      // if (user) logout(); // Ensure consistency if local state had a user
    }
  }

  // Ensure we have a valid session before proceeding (original check, can be refined based on above logic)
  if (!session && event !== 'SIGNED_OUT') {
    console.warn('[supabaseClient] onAuthStateChange: No valid session found after processing auth event (and event is not SIGNED_OUT). Event:', event);
    // It might be redundant now given the specific event handling above
    // return;
  }

  if (event === 'SIGNED_OUT') {
    console.log('[supabaseClient] onAuthStateChange: SIGNED_OUT event - cleaning up...');
    useAuthStore.getState().logout(); // Update authStore on logout
    try {
      // Clear all auth-related storage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}-token`);
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('last_login');
      localStorage.removeItem('user_data'); // Also clear user_data from authStore login
      sessionStorage.clear();
      
      // Clear any cached API data
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
      
      // Only redirect if not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      console.log('[supabaseClient] onAuthStateChange: SIGNED_IN or TOKEN_REFRESHED with session.user. User authenticated:', session.user.email, '. Triggering fetchUser from useAuthStore.');
      await useAuthStore.getState().fetchUser(); // Fetch user data and update store

      // The Supabase client library handles session persistence automatically when persistSession is true.
      // Redirection logic can be handled by the component observing authStore state or here if preferred.
      const currentPath = window.location.pathname;
      // Ensure redirection only happens if not already on a protected route or if coming from a public one
      if (currentPath !== '/dashboard' && (currentPath === '/login' || currentPath === '/auth/verify-email' || currentPath === '/')) {
        console.log(`[supabaseClient] onAuthStateChange: Redirecting to /dashboard from ${currentPath}`);
        window.location.href = '/dashboard';
      }
    } else if (event === 'SIGNED_IN' && !session?.user) {
      // This case might indicate an issue with the sign-in process if a user object is expected but not received.
      console.warn('[supabaseClient] onAuthStateChange: SIGNED_IN event occurred, but no user session data found. Redirecting to login.');
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    // TOKEN_REFRESHED typically means the session is still valid and has been updated.
    // The 'session' object passed to this callback will contain the new token.
    // The library handles updating the persisted session.
    if (event === 'TOKEN_REFRESHED') {
        console.log('[supabaseClient] onAuthStateChange: Token refreshed successfully. Session:', session);
    }
  } else if (event === 'USER_UPDATED') {
    console.log('[supabaseClient] onAuthStateChange: USER_UPDATED event.');
    if (session?.user) {
      console.log('[supabaseClient] onAuthStateChange: USER_UPDATED with session.user. Triggering fetchUser from useAuthStore.');
      await useAuthStore.getState().fetchUser(); // Re-fetch user data on update
    }
  } else if (event === 'INITIAL_SESSION') {
    console.log('[supabaseClient] onAuthStateChange: Initial session check complete.');
    if (session?.user) {
      console.log('[supabaseClient] onAuthStateChange: Initial session - User found, fetching user data. Triggering fetchUser from useAuthStore.');
      await useAuthStore.getState().fetchUser();
    } else {
      console.log('[supabaseClient] onAuthStateChange: Initial session - No user found. Checking guest mode.');
      const { isGuestMode, enableGuestMode } = useAuthStore.getState();
      if (!isGuestMode) {
        // Only enable guest mode if not already in it. 
        // This prevents unnecessary state updates if guest mode was set by other means.
        console.log('[supabaseClient] onAuthStateChange: Enabling guest mode as no authenticated user was found on initial load.');
        enableGuestMode();
      } else {
        console.log('[supabaseClient] onAuthStateChange: Guest mode is already active.');
      }
    }
  }
})

// Add network connectivity check
let isOnline = true
window.addEventListener('online', () => {
  console.log('Network connection restored')
  isOnline = true
})

window.addEventListener('offline', () => {
  console.log('Network connection lost')
  isOnline = false
})

// Export network status checker
export const checkNetworkStatus = () => isOnline
