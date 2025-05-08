import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wish } from '../types';
import { supabase } from '../lib/supabaseClient'; // Import supabase client
import { useAuthStore } from './authStore'; // Import useAuthStore

interface WishState {
  wishes: Wish[];
  addWish: (wish: Omit<Wish, 'id' | 'createdAt'>) => Promise<Wish>;
  updateWish: (id: string, wish: Partial<Wish>) => void;
  deleteWish: (id: string) => void;
  getWishesByList: (listId: string) => Promise<Wish[]>;
  getFavoriteWishes: () => Wish[];
  moveWish: (wishId: string, fromListId: string, toListId: string) => void;
  toggleFavorite: (id: string) => void;
}

export const useWishStore = create<WishState>()(
  persist(
    (set, get) => ({
      wishes: [],
      addWish: async (wish) => {
        const { user, isGuestMode } = useAuthStore.getState();
        if (!user && !isGuestMode) {
          const error = new Error("User must be logged in or in guest mode to create a wish.");
          console.error(error.message);
          throw error;
        }
    
        try {
          const newWishData = {
            id: isGuestMode ? `guest-wish-${Date.now()}` : undefined,
            title: wish.title,
            description: wish.description || '',
            price: wish.price || '0',
            priority: wish.priority || 'medium',
            link: wish.link || '',
            imageUrl: wish.imageUrl || '',
            userId: user?.id || 'guest',
            listId: wish.listId || null,
            isFavorite: false,
            status: 'active',
            createdAt: new Date().toISOString()
          };

          let data;
          if (isGuestMode) {
            console.log('[wishStore] addWish: Guest mode, using local data:', newWishData);
            data = newWishData;
          } else {
            console.log('[wishStore] addWish: Logged-in user. Auth User details:', JSON.stringify(user), 'Attempting to insert into Supabase. User ID for wish:', user?.id, 'Data to insert:', JSON.stringify(newWishData));
            const { data: dbDataArray, error } = await supabase
              .from('wishes')
              .insert([newWishData])
              .select(); // Removed .single()

            console.log('[wishStore] addWish: Supabase insert response. Error:', error, 'Data Array:', dbDataArray);

            if (error) {
              console.error("Error adding wish to Supabase:", error);
              // Log the full error object if it has more details
              console.error("Full Supabase error object:", JSON.stringify(error, null, 2));
              let errorMessage = `Failed to create wish: ${error.message}`;
              if (error.code) errorMessage += ` Code: ${error.code}`;
              if (error.details) errorMessage += ` Details: ${error.details}`;
              if (error.hint) errorMessage += ` Hint: ${error.hint}`;
              throw new Error(errorMessage);
            }

            if (!dbDataArray || dbDataArray.length === 0) {
              console.warn('[wishStore] addWish: No data returned or empty array from Supabase after insert/select, but no error was thrown. This strongly suggests an RLS SELECT policy issue or that the row was not committed/found. Please verify RLS settings for the "wishes" table. Is RLS truly disabled for SELECT operations, or if enabled, does the policy (auth.uid() = user_id) allow reading the new row?');
              console.log('[wishStore] addWish: Data that was attempted to be inserted:', JSON.stringify(newWishData));
              throw new Error("No data returned after creating wish. Check RLS SELECT policies or if the insert was successful.");
            }
            // Assuming the first element is the one we want if dbDataArray is not empty
            data = dbDataArray[0];
            console.log('[wishStore] addWish: Successfully inserted and retrieved wish:', JSON.stringify(data));
          }
    
          set((state) => ({
            wishes: [...state.wishes, data]
          }));

          // If not in guest mode and the wish has a listId, refresh the wishes for that list
          if (!isGuestMode && user && data.listId) {
            await get().getWishesByList(data.listId);
          }
    
          return data;
        } catch (error: any) {
          console.error('!!!!!!!!!! [wishStore] addWish CATCH BLOCK ENTERED !!!!!!!!!!');
          console.error('Error creating wish:', error);
          throw error;
        }
      },
      updateWish: async (id, updatedWish) => {
        const { isGuestMode } = useAuthStore.getState();
        
        if (!isGuestMode) {
          // Update wish in Supabase only if not in guest mode
          const { error } = await supabase
            .from('wishes')
            .update(updatedWish)
            .eq('id', id);

          if (error) {
            console.error("Error updating wish in Supabase:", error);
            return; // Exit if there's an error
          }
        }

        // Always update local state
        set((state) => ({
          wishes: state.wishes.map((wish) =>
            wish.id === id ? { ...wish, ...updatedWish } : wish
          ),
        }));
      },
      deleteWish: async (id) => {
        const { isGuestMode } = useAuthStore.getState();
        
        if (!isGuestMode) {
          // Delete wish from Supabase only if not in guest mode
          const { error } = await supabase
            .from('wishes')
            .delete()
            .eq('id', id);

          if (error) {
            console.error("Error deleting wish from Supabase:", error);
            return; // Exit if there's an error
          }
        }

        // Always update local state
        set((state) => ({
          wishes: state.wishes.filter((wish) => wish.id !== id),
        }));
      },
      getWishesByList: async (listId) => {
        const { isGuestMode } = useAuthStore.getState();
        const allWishes = get().wishes;

        if (isGuestMode) {
          const guestWishes = allWishes.filter(wish => wish.listId === listId);
          // No need to call set() here as we are just reading from existing state for guest mode
          return guestWishes;
        } else {
          // Fetch wishes from Supabase for logged-in users
          const { data: wishes, error } = await supabase
            .from('wishes')
            .select('*')
            .eq('listId', listId);

          if (error) {
            console.error("Error fetching wishes from Supabase:", error);
            return []; // Return empty array in case of error
          }

          // Update local state with fetched wishes, preserving wishes from other lists
          set((state) => ({
            wishes: [
              ...state.wishes.filter(w => w.listId !== listId), // Keep wishes from other lists
              ...(wishes || []) // Add/update wishes for current list
            ]
          }));
          
          return wishes || []; // Return fetched wishes
        }
      },
      getFavoriteWishes: () =>
        get().wishes.filter((wish) => wish.isFavorite),
      moveWish: async (wishId, fromListId, toListId) => {
        // Update wish's listId in Supabase
        const { error } = await supabase
          .from('wishes')
          .update({ listId: toListId })
          .eq('id', wishId);

        if (error) {
          console.error("Error moving wish in Supabase:", error);
          return; // Exit if there's an error
        }

        set((state) => ({
          wishes: state.wishes.map((wish) =>
            wish.id === wishId ? { ...wish, listId: toListId } : wish
          ),
        }));
      },
      toggleFavorite: (id) =>
        set((state) => ({
          wishes: state.wishes.map((wish) =>
            wish.id === id ? { ...wish, isFavorite: !wish.isFavorite } : wish
          ),
        })),
    }),
    {
      name: 'wish-storage',
    }
  )
);
