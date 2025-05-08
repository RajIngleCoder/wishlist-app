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

const publicPaths = ['/', '/login', '/register', '/auth/callback', '/auth/verify-email', '/about', '/contact']; // Define public paths
// STORAGE_KEY is already defined globally at the top of the file

// Helper function to handle session logic for authenticated states
const handleAuthenticatedSession = async (currentEvent: string, currentSession: import('@supabase/supabase-js').Session | null) => {
  const { fetchUser, logout, user: storeUser } = useAuthStore.getState();

  if (currentSession && currentSession.user) {
    console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} with session.user. Triggering fetchUser.`);
    await fetchUser(); // This updates authStore, including isAuthenticated

    const { isAuthenticated: updatedIsAuthenticated, user: updatedUser } = useAuthStore.getState();
    const currentPath = window.location.pathname;

    if (updatedIsAuthenticated && updatedUser) { // User is fully authenticated (email confirmed)
      console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} - User is authenticated. Path: ${currentPath}`);
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/auth/verify-email' || currentPath === '/' || currentPath === '/auth/callback') {
        console.log(`[supabaseClient] handleAuthenticatedSession: Redirecting to /dashboard from ${currentPath}`);
        window.location.href = '/dashboard';
      }
    } else { // User session exists but not fully authenticated OR fetchUser failed
      console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} - User session exists but not fully authenticated/fetch failed. isAuthenticated: ${updatedIsAuthenticated}, User: ${!!updatedUser}. Path: ${currentPath}`);

      // Specific handling for SIGNED_IN with unconfirmed email
      if (currentEvent === 'SIGNED_IN' && currentSession.user && !currentSession.user.email_confirmed_at) {
          if (currentPath !== '/auth/verify-email') {
              console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} - Email not confirmed. Redirecting to /auth/verify-email from ${currentPath}.`);
              window.location.href = '/auth/verify-email';
              return; // Redirect initiated, exit handler
          } else {
              console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} - Email not confirmed. Already on /auth/verify-email.`);
              // Allow staying on /auth/verify-email, UI should prompt
          }
      }
      // General handling for not authenticated on protected routes (if not redirected above)
      else if (!updatedIsAuthenticated && !publicPaths.includes(currentPath)) {
          console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} - User not authenticated (e.g. email confirmed but fetchUser failed, or other events) and on protected route ${currentPath}. Logging out and redirecting to /login.`);
          logout();
          window.location.href = '/login';
          return; // Redirect initiated
      }
      // If user is not authenticated, but on a public path, or on /auth/verify-email (and email not confirmed), no redirect here.
    }
  } else {
    // No session.user for these events (e.g. SIGNED_IN but session is null, which is anomalous)
    console.warn(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} event but no valid session.user. Logging out.`);
    logout(); // Clear user state in the store
    const currentPath = window.location.pathname;
    if (!publicPaths.includes(currentPath)) {
        console.log(`[supabaseClient] handleAuthenticatedSession: ${currentEvent} - No session, on protected route ${currentPath}. Redirecting to /login.`);
        window.location.href = '/login';
    }
  }
};

// Enhanced error handling for network connectivity and auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(`[supabaseClient] onAuthStateChange: Event - ${event}`, { session });
  const { logout, enableGuestMode, isGuestMode: currentIsGuestMode, isAuthenticated: initialIsAuthenticated, user: initialUser } = useAuthStore.getState();

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    await handleAuthenticatedSession(event, session);
  } else if (event === 'SIGNED_OUT') {
    console.log('[supabaseClient] onAuthStateChange: SIGNED_OUT. Clearing user state and redirecting.');
    logout();
    // Clear all auth-related storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-token`); // Common pattern for Supabase tokens
    localStorage.removeItem('auth-storage'); // Assuming this is your Zustand persist key for authStore
    localStorage.removeItem('last_login');
    localStorage.removeItem('user_data');
    sessionStorage.clear(); // Clear session storage as well
    try {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    } catch(e) {
      console.error('[supabaseClient] Error clearing caches:', e);
    }

    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') { // Allow staying on /register
      console.log(`[supabaseClient] onAuthStateChange: SIGNED_OUT - Redirecting to /login from ${currentPath}`);
      window.location.href = '/login';
    }
  } else if (event === 'INITIAL_SESSION') {
    console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION.');
    if (session && session.user) {
      console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION with session.user.');
      await handleAuthenticatedSession(event, session);
    } else {
      // No session on initial load
      console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - No session.user detected.');
      const currentPath = window.location.pathname;
      const storeState = useAuthStore.getState(); // Get fresh state

      if (!publicPaths.includes(currentPath) && !storeState.isGuestMode && !storeState.isAuthenticated) {
        // If on a protected path, and not in guest mode, and not authenticated from persisted store, redirect to login.
        console.log(`[supabaseClient] onAuthStateChange: INITIAL_SESSION - No user, on protected route ${currentPath}, not guest/authenticated. Redirecting to /login.`);
        window.location.href = '/login';
      } else if (publicPaths.includes(currentPath) && !storeState.isGuestMode && !storeState.isAuthenticated) {
        // If on a public path, not guest, not authenticated, can enable guest mode.
        console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - No user, on public path, not guest/authenticated. Enabling guest mode.');
        enableGuestMode();
      } else if (storeState.isGuestMode) {
         console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - Guest mode is already active.');
      } else if (storeState.isAuthenticated) { // True if authStore has user, but Supabase has no session
         console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - User was authenticated in store, but no active Supabase session. Logging out to sync state.');
         logout(); // Clear the potentially stale auth state from store
         
         const currentPathAfterLogout = window.location.pathname;
         const newStoreState = useAuthStore.getState(); // Get fresh state after logout

         if (!publicPaths.includes(currentPathAfterLogout) && !newStoreState.isGuestMode) { // isAuthenticated is now false
             console.log(`[supabaseClient] onAuthStateChange: INITIAL_SESSION - Stale auth cleared. On protected route ${currentPathAfterLogout}, not guest. Redirecting to /login.`);
             window.location.href = '/login';
         } else if (publicPaths.includes(currentPathAfterLogout) && !newStoreState.isGuestMode) {
             console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - Stale auth cleared. On public path, not guest. Enabling guest mode.');
             enableGuestMode();
         } else if (newStoreState.isGuestMode) {
             console.log('[supabaseClient] onAuthStateChange: INITIAL_SESSION - Stale auth cleared. Guest mode is active or became active.');
         }
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
