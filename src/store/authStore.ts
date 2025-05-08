import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string; // Changed from avatar to avatarUrl
  currency?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuestMode: boolean; // Add new property for guest mode
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  fetchUser: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  enableGuestMode: () => void; // Add new function for guest mode
  disableGuestMode: () => void; // Add function to exit guest mode
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuestMode: false, // Initialize guest mode as false
      login: async (email: string, password: string) => {
        console.log('[authStore] login: Creating dummy account UI state immediately.');
        const dummyUserData = {
          id: 'dummy-' + email.replace(/[@.]/g, '-') + '-' + Date.now(), // Create a somewhat unique ID from email
          name: email.split('@')[0] || 'User',
          email: email,
          avatarUrl: '', // Default avatar
          currency: 'USD' // Default currency, adjust if needed
        };
        set({
          user: dummyUserData,
          isAuthenticated: true,
          isGuestMode: false,
        });
        // Persist crucial parts of the dummy user for quick UI updates on reload
        localStorage.setItem('user_data', JSON.stringify(dummyUserData)); 
        localStorage.setItem('last_login', new Date().toISOString());

        // Attempt real Supabase login in the background
        // This will not block UI, and its failure will not log the user out of the dummy session.
        supabase.auth.signInWithPassword({ email, password })
          .then(({ data: supabaseData, error: supabaseError }) => {
            if (supabaseError) {
              console.warn('[authStore] login: Background Supabase sign-in failed:', supabaseError.message);
              // NOTE: We do NOT revert isAuthenticated or clear dummyUser here.
              // The user explicitly wants the UI to remain as if logged in.
              // If credentials were truly invalid, Supabase couldn't provide a real session anyway.
            } else if (supabaseData && supabaseData.user) {
              console.log('[authStore] login: Background Supabase sign-in successful. Updating stored user with real details.');
              const realUserData = {
                id: supabaseData.user.id,
                name: supabaseData.user.user_metadata?.name || email.split('@')[0] || 'User',
                email: supabaseData.user.email || email,
                avatarUrl: supabaseData.user.user_metadata?.avatar_url || supabaseData.user.user_metadata?.avatar || '',
                currency: supabaseData.user.user_metadata?.currency || dummyUserData.currency // Retain dummy currency if not in metadata
              };
              set({ user: realUserData, isAuthenticated: true, isGuestMode: false }); // Update with real data but keep isAuthenticated true
              localStorage.setItem('user_data', JSON.stringify(realUserData)); // Persist real user data
            }
          })
          .catch(backgroundError => {
            console.warn('[authStore] login: Background Supabase sign-in threw an unhandled error:', backgroundError.message);
            // Still, do not revert isAuthenticated state for the dummy session.
          });
        // The function now effectively guarantees isAuthenticated becomes true for the UI,
        // errors from Supabase are for background processing/logging.
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      register: async (email: string, password: string, name?: string): Promise<void> => {
        try {
          // Validate inputs
          if (!email || !password) {
            throw new Error('Email and password are required');
          }

          // Check network connectivity
          if (!navigator.onLine) {
            throw new Error('No internet connection. Please check your network and try again.');
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          }).catch(err => {
            console.error('Registration error:', err);
            if (err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed to fetch')) {
              throw new Error('Network error. Please check your connection and try again.');
            }
            throw new Error('Registration failed. Please try again later.');
          });

          if (error) {
            console.error('Supabase auth error:', error);
            if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
              throw new Error('This email is already registered. Please try logging in instead.');
            }
            if (error.message?.includes('password') || error.message?.toLowerCase().includes('weak')) {
              throw new Error('Password is too weak. Please use a stronger password.');
            }
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
              throw new Error('Network error. Please check your connection and try again.');
            }
            throw new Error('Registration failed. Please try again later.');
          }

          if (!data?.user) {
            console.error('No user data received during registration');
            throw new Error('Registration failed - please try again');
          }

          // Show success message and redirect
          set({ user: null, isAuthenticated: false });
          // Redirection to /auth/verify-email is now handled by onAuthStateChange or UI logic after successful registration signal
          return;
        } catch (error: any) {
          set({ user: null, isAuthenticated: false });
          throw new Error(error.message || 'Failed to register');
        }
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      fetchUser: async () => {
        console.log('[authStore] fetchUser: Called');
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
        console.log('[authStore] fetchUser: authUser from supabase.auth.getUser()', { authUser, authUserError });

        if (authUserError) {
          // Check if the error is the expected "Auth session missing"
          if (authUserError.message && authUserError.message.includes('Auth session missing')) {
            // This is an expected scenario when the user is not logged in.
            // Logging for this specific case has been removed to reduce verbosity as requested.
          } else {
            // Log other, unexpected errors encountered while trying to get the auth user
            console.error('[authStore] fetchUser: Unexpected error getting auth user:', authUserError.message, authUserError);
          }
          set({ user: null, isAuthenticated: false, isGuestMode: true }); // Ensure guest mode on error
          return;
        }
        if (authUser) {
          console.log('[authStore] fetchUser: authUser found, proceeding to fetch/update profile for ID:', authUser.id);
          // Check if a profile exists for this user
          console.log('[authStore] fetchUser: Checking for existing profile for user ID:', authUser.id);
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          console.log('[authStore] fetchUser: Profile check result', { userProfile, profileError });

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'No rows found'
            console.error('[authStore] fetchUser: Error fetching user profile (and not PGRST116):', profileError);
            // Optionally, handle this error more gracefully, e.g., by setting an error state
            // Consider setting user as authenticated but with an error flag or partial data
            set({ user: null, isAuthenticated: false, isGuestMode: get().isGuestMode });
            return;
          }

          let finalUserData;

          if (!userProfile) {
            // Profile doesn't exist, create it
            console.log(`[authStore] fetchUser: No profile found for user ${authUser.id}, creating one.`);
            const newUserProfile = {
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'New User',
              avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.avatar, // Added fallback to avatar
              updated_at: new Date().toISOString(),
              // Add any other default fields for your profiles table here
            };
            console.log('[authStore] fetchUser: New profile data to insert:', newUserProfile);
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newUserProfile)
              .select()
              .single();
            console.log('[authStore] fetchUser: New profile creation result', { createdProfile, createError });

            if (createError) {
              console.error('[authStore] fetchUser: Error creating user profile:', createError);
              // Fallback to auth user data if profile creation fails
              finalUserData = {
                id: authUser.id,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
                email: authUser.email || '',
                avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.avatar || '', // Use avatarUrl and fallback
              };
              console.log('[authStore] fetchUser: Profile creation failed, falling back to auth data:', finalUserData);
            } else if (createdProfile) {
              console.log('[authStore] fetchUser: User profile created successfully:', createdProfile);
              finalUserData = {
                id: createdProfile.id,
                name: createdProfile.name,
                email: createdProfile.email,
                avatarUrl: createdProfile.avatar_url, // Use avatar_url from profile
                currency: createdProfile.currency,
              };
            } else {
              // Should not happen if no error, but as a fallback
              console.warn('[authStore] fetchUser: Profile creation returned no data and no error, falling back to auth data.');
              finalUserData = {
                id: authUser.id,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
                email: authUser.email || '',
                avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.avatar || '', // Use avatarUrl and fallback
              };
            }
          } else {
            // Profile exists, potentially update it with latest auth data
            console.log('[authStore] fetchUser: User profile found:', userProfile);
            if (userProfile) {
              console.log('[authStore] fetchUser: Profile found. Updating existing profile in DB with current timestamp.');
              // Profile exists, update it. Explicitly set updated_at to refresh the timestamp.
              // Other fields like name or avatar_url could also be synced here if necessary,
              // taking care to merge appropriately with existing profile data or authUser metadata.
              
              const profileUpdatePayload = {
                updated_at: new Date().toISOString(),
                // Example: Sync name if provided in authUser metadata, otherwise keep existing profile name
                name: authUser.user_metadata?.name || userProfile.name,
                // Example: Sync avatar_url if provided in authUser metadata, otherwise keep existing profile avatar_url
                avatar_url: authUser.user_metadata?.avatar_url || userProfile.avatar_url,
                // Example: Ensure email is consistent with authUser's email
                email: authUser.email,
              };

              const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update(profileUpdatePayload) // Use the explicitly defined payload
                .eq('id', authUser.id)
                .select()
                .single();

              if (updateError) {
                console.error('[authStore] fetchUser: Error updating user profile:', updateError);
                // Use existing profile data or authUser data as fallback, ensuring email is from authUser
                finalUserData = {
                  id: userProfile.id,
                  name: userProfile.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
                  email: authUser.email || userProfile.email || '', // Prioritize authUser.email
                  avatarUrl: userProfile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.avatar || '',
                  currency: userProfile.currency,
                };
                console.log('[authStore] fetchUser: Profile update failed, falling back to combined data:', finalUserData);
              } else if (updatedProfile) {
                console.log('[authStore] fetchUser: User profile updated successfully:', updatedProfile);
                finalUserData = {
                  id: updatedProfile.id,
                  name: updatedProfile.name,
                  email: updatedProfile.email,
                  avatarUrl: updatedProfile.avatar_url,
                  currency: updatedProfile.currency,
                };
              } else {
                 // Fallback if updatedProfile is unexpectedly null
                console.warn('[authStore] fetchUser: Profile update returned no data and no error, using combined data.');
                finalUserData = {
                  id: userProfile.id, // or authUser.id
                  name: authUser.user_metadata?.name || userProfile.name || '',
                  email: authUser.email || userProfile.email || '', // Prioritize authUser.email
                  avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.avatar || userProfile.avatar_url || '',
                  currency: userProfile.currency, // Keep existing currency if not updated
                };
              }
            } else {
              // No updates needed, use existing profile data but ensure email is from authUser
              console.log('[authStore] fetchUser: No profile updates needed. Using existing profile data, ensuring email sync.');
              finalUserData = {
                id: userProfile.id,
                name: userProfile.name,
                email: authUser.email || userProfile.email, // Prefer authUser.email
                avatarUrl: userProfile.avatar_url,
                currency: userProfile.currency,
              };
            }
          }

          console.log('[authStore] fetchUser: Final user data to set in store:', finalUserData);
          set({
            user: finalUserData,
            isAuthenticated: !!authUser?.email_confirmed_at, // authUser is from supabase.auth.getUser()
            isGuestMode: false, // Ensure guest mode is off when a user is fetched
          });
          console.log('[authStore] fetchUser: Zustand store updated.');
          // Persist user data to localStorage for faster loads
          localStorage.setItem('user_data', JSON.stringify(finalUserData));
          console.log('[authStore] fetchUser: User data persisted to localStorage.');
        } else {
          console.log('[authStore] fetchUser: No authUser found after initial check. Setting user to null.');
          set({ user: null, isAuthenticated: false, isGuestMode: get().isGuestMode }); // Preserve guest mode if active
          console.log('[authStore] fetchUser: Zustand store updated, user is null.');
        }
      },
      enableGuestMode: () => {
        // Create a guest user session without authentication
        set({
          isGuestMode: true,
          user: {
            id: 'guest-' + Date.now(),
            name: 'Guest',
            email: 'guest@example.com',
          },
          isAuthenticated: false
        });
        sessionStorage.setItem('guest_session', 'true');
      },
      disableGuestMode: () => {
        // Remove guest session
        set({
          isGuestMode: false,
          user: null,
          isAuthenticated: false
        });
        sessionStorage.removeItem('guest_session');
        sessionStorage.removeItem('from_landing');
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
