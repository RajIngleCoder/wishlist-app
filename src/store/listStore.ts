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
      
        try {
          const newList = {
            id: isGuestMode ? `guest-list-${Date.now()}` : undefined,
            name: list.name,
            description: list.description,
            userId: user?.id || 'guest',
            isPublic: list.isPublic || false,
            category: list.category,
            imageUrl: list.imageUrl,
            tags: list.tags,
            type: list.type || 'personal',
            visibility: list.visibility || 'private',
            createdAt: new Date().toISOString()
          };

          let data;
          if (isGuestMode) {
            console.log('[listStore] addList: Guest mode, using local data:', newList);
            data = newList;
          } else {
            console.log('[listStore] addList: Logged-in user. Auth User details:', JSON.stringify(user), 'Attempting to insert into Supabase. User ID for list:', user?.id, 'Data to insert:', JSON.stringify(newList));
            const { data: dbDataArray, error } = await supabase
              .from('lists')
              .insert([newList])
              .select(); // Removed .single()

            console.log('[listStore] addList: Supabase insert response. Error:', error, 'Data Array:', dbDataArray);

            if (error) {
              console.error("Error adding list to Supabase:", error);
              // Log the full error object if it has more details
              console.error("Full Supabase error object:", JSON.stringify(error, null, 2));
              let errorMessage = `Failed to create list: ${error.message}`;
              if (error.code) errorMessage += ` Code: ${error.code}`;
              if (error.details) errorMessage += ` Details: ${error.details}`;
              if (error.hint) errorMessage += ` Hint: ${error.hint}`;
              throw new Error(errorMessage);
            }

            if (!dbDataArray || dbDataArray.length === 0) {
              console.warn('[listStore] addList: No data returned or empty array from Supabase after insert/select, but no error was thrown. This strongly suggests an RLS SELECT policy issue or that the row was not committed/found. Please verify RLS settings for the "lists" table. Is RLS truly disabled for SELECT operations, or if enabled, does the policy (auth.uid() = user_id) allow reading the new row?');
              console.log('[listStore] addList: Data that was attempted to be inserted:', JSON.stringify(newList));
              throw new Error("No data returned after creating list. Check RLS SELECT policies or if the insert was successful.");
            }
            // Assuming the first element is the one we want if dbDataArray is not empty
            data = dbDataArray[0];
            console.log('[listStore] addList: Successfully inserted and retrieved list:', JSON.stringify(data));
          }
      
          // Update local state with the new list
          set((state) => ({
            lists: [...state.lists, data],
          }));
      
          // Fetch updated lists for the current user if not in guest mode
          if (user && !isGuestMode) {
            await get().getUserLists(user.id);
          }
      
          return data;
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
        // Fetch lists from Supabase
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
      },
    }),
    {
      name: 'list-storage',
    }
  )
);
