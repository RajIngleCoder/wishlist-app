import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishList } from '../types';
import { useAuthStore } from './authStore'; // Import useAuthStore
import { supabase } from '../lib/supabaseClient'; // Import supabase client

interface ListState {
  lists: WishList[];
  addList: (list: Omit<WishList, 'id' | 'createdAt' | 'userId'>) => Promise<WishList>;
  updateList: (id: string, list: Partial<WishList>) => void;
  deleteList: (id: string) => void;
  getUserLists: (userId: string) => Promise<WishList[]>;
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: [],
      addList: async (list) => {
        const { user, isGuestMode } = useAuthStore.getState();
        
        if (!user && !isGuestMode) {
          const error = new Error("User must be logged in or in guest mode to create a list.");
          console.error(error.message);
          throw error;
        }

        const isDummyUser = user?.id?.startsWith('dummy-');
        const currentUserId = user?.id || 'guest'; // Fallback to guest if no user
      
        try {
          let newWishlistData: Omit<WishList, 'id' | 'createdAt' | 'userId'> = list; // Input type
          let createdList: WishList;

          if (isGuestMode || isDummyUser) {
            const localId = `${isGuestMode ? 'guest' : 'dummy'}-list-${Date.now()}`;
            createdList = {
              ...newWishlistData,
              id: localId,
              userId: currentUserId,
              createdAt: new Date().toISOString(),
              // Ensure defaults for optional fields if not provided by newWishlistData
              description: newWishlistData.description || '',
              type: newWishlistData.type || 'personal',
              visibility: newWishlistData.visibility || 'private',
              collaborators: newWishlistData.collaborators || [],
              tags: newWishlistData.tags || [],
              category: newWishlistData.category || 'general',
              imageUrl: newWishlistData.imageUrl || '',
            };
            console.log(`[listStore] addList: ${isGuestMode ? 'Guest' : 'Dummy user'} mode, using local data:`, createdList);
          } else {
            // Real user, save to Supabase
            const payloadForSupabase: Omit<WishList, 'id' | 'createdAt'> & { userId: string } = {
                ...newWishlistData,
                userId: currentUserId,
                // Ensure defaults for optional fields if not provided by newWishlistData for Supabase insert
                description: newWishlistData.description || '',
                type: newWishlistData.type || 'personal',
                visibility: newWishlistData.visibility || 'private',
                collaborators: newWishlistData.collaborators || [],
                tags: newWishlistData.tags || [],
                category: newWishlistData.category || 'general',
                imageUrl: newWishlistData.imageUrl || '',
            };
            console.log('[listStore] addList: Real user. Attempting to insert into Supabase:', payloadForSupabase);
            const { data: dbData, error } = await supabase
              .from('lists')
              .insert(payloadForSupabase) // Supabase generates id and createdAt
              .select()
              .single();

            if (error) {
              console.error("Error adding list to Supabase:", error);
              throw new Error(`Failed to create list: ${error.message}`);
            }
            if (!dbData) {
              console.warn('[listStore] addList: No data returned from Supabase. Check RLS policies.');
              throw new Error("No data returned after creating list.");
            }
            createdList = dbData as WishList; // Cast because Supabase returns the full object
            console.log('[listStore] addList: Successfully inserted list:', createdList);
          }
      
          set((state) => ({
            lists: [...state.lists, createdList],
          }));
      
          if (user && !isGuestMode && !isDummyUser) {
            await get().getUserLists(user.id);
          }
      
          return createdList;
        } catch (error: any) {
          console.error('!!!!!!!!!! [listStore] addList CATCH BLOCK ENTERED !!!!!!!!!!');
          console.error('Error creating list:', error);
          throw error;
        }
      },
      updateList: async (id, updatedList) => {
        const { isGuestMode } = useAuthStore.getState();
        
        if (!isGuestMode) {
          // Update list in Supabase only if not in guest mode
          const { error } = await supabase
            .from('lists')
            .update(updatedList)
            .eq('id', id);

          if (error) {
            console.error("Error updating list in Supabase:", error);
            return; // Exit if there's an error
          }
        }

        // Always update local state
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === id ? { ...list, ...updatedList } : list
          ),
        }));
      },
      deleteList: async (id) => {
        const { isGuestMode } = useAuthStore.getState();
        
        if (!isGuestMode) {
          // Delete list from Supabase only if not in guest mode
          const { error } = await supabase
            .from('lists')
            .delete()
            .eq('id', id);

          if (error) {
            console.error("Error deleting list from Supabase:", error);
            return; // Exit if there's an error
          }
        }

        // Always update local state
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== id),
        }));
      },
      getUserLists: async (userId) => {
        const { user, isGuestMode } = useAuthStore.getState();
        const allLists = get().lists;
        const isDummyUser = user?.id?.startsWith('dummy-');

        // If the provided userId corresponds to the current dummy user or if in guest mode (and userId might be 'guest')
        if ((isDummyUser && userId === user?.id) || (isGuestMode && userId === 'guest')) {
          console.log(`[listStore] getUserLists: ${isGuestMode ? 'Guest' : 'Dummy user'} mode. Filtering locally for userId:`, userId);
          const localLists = allLists.filter(list => list.userId === userId);
          set({ lists: localLists }); // Update state with the filtered local lists
          return localLists;
        } else if (isDummyUser && userId !== user?.id) {
          // This case handles if getUserLists is somehow called with a different ID when a dummy user is active.
          // We should probably return an empty list or only lists for the *active* dummy user.
          // For now, returning empty to prevent showing other users' data if this scenario is hit.
          console.warn(`[listStore] getUserLists: Dummy user active, but requested for different userId (${userId}). Returning empty.`);
          set({ lists: [] }); 
          return [];
        } else {
          // Fetch lists from Supabase for real, non-dummy users
          console.log('[listStore] getUserLists: Real user mode. Fetching from Supabase for userId:', userId);
          const { data: lists, error } = await supabase
            .from('lists')
            .select('*')
            .eq('userId', userId);

          if (error) {
            console.error("Error fetching lists:", error);
            return []; // Return empty array in case of error
          }
          set({ lists: lists || [] }); // Update lists state with fetched data
          return lists || []; // Return fetched lists
        }
      },
    }),
    {
      name: 'list-storage',
    }
  )
);
