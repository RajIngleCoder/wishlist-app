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

        const isDummyUser = user?.id?.startsWith('dummy-');
        const currentUserId = user?.id || 'guest';
    
        try {
          let newWishDataFromInput: Omit<Wish, 'id' | 'createdAt'> = wish;
          let createdWish: Wish;

          if (isGuestMode || isDummyUser) {
            const localId = `${isGuestMode ? 'guest' : 'dummy'}-wish-${Date.now()}`;
            createdWish = {
              ...newWishDataFromInput,
              id: localId,
              userId: currentUserId,
              createdAt: new Date().toISOString(),
              // Ensure defaults for optional/required fields if not in newWishDataFromInput
              description: newWishDataFromInput.description || '',
              price: newWishDataFromInput.price || '0',
              priority: newWishDataFromInput.priority || 'medium',
              status: newWishDataFromInput.status || 'active',
              isFavorite: newWishDataFromInput.isFavorite === undefined ? false : newWishDataFromInput.isFavorite,
              // listId can be undefined/null if not provided, so no specific default needed unless logic requires one
            };
            console.log(`[wishStore] addWish: ${isGuestMode ? 'Guest' : 'Dummy user'} mode, using local data:`, createdWish);
          } else {
            // Real user, save to Supabase
            const payloadForSupabase: Omit<Wish, 'id' | 'createdAt'> & { userId: string } = {
              ...newWishDataFromInput,
              userId: currentUserId,
              description: newWishDataFromInput.description || '',
              price: newWishDataFromInput.price || '0',
              priority: newWishDataFromInput.priority || 'medium',
              status: newWishDataFromInput.status || 'active',
              isFavorite: newWishDataFromInput.isFavorite === undefined ? false : newWishDataFromInput.isFavorite,
            };
            console.log('[wishStore] addWish: Real user. Attempting to insert into Supabase:', payloadForSupabase);
            const { data: dbData, error } = await supabase
              .from('wishes')
              .insert(payloadForSupabase) // Supabase generates id and createdAt
              .select()
              .single();

            if (error) {
              console.error("Error adding wish to Supabase:", error);
              throw new Error(`Failed to create wish: ${error.message}`);
            }
            if (!dbData) {
              console.warn('[wishStore] addWish: No data returned from Supabase. Check RLS policies.');
              throw new Error("No data returned after creating wish.");
            }
            createdWish = dbData as Wish;
            console.log('[wishStore] addWish: Successfully inserted wish:', createdWish);
          }
    
          set((state) => ({
            wishes: [...state.wishes, createdWish]
          }));

          if (user && !isGuestMode && !isDummyUser && createdWish.listId) {
            await get().getWishesByList(createdWish.listId);
          }
    
          return createdWish;
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
        const { user, isGuestMode } = useAuthStore.getState(); // Get user as well
        const allWishes = get().wishes;
        const isDummyUser = user?.id?.startsWith('dummy-');

        if (isGuestMode || isDummyUser) {
          console.log(`[wishStore] getWishesByList: ${isGuestMode ? 'Guest' : 'Dummy user'} mode. Filtering locally for listId:`, listId);
          const localWishes = allWishes.filter(wish => wish.listId === listId);
          return localWishes;
        } else {
          // Fetch wishes from Supabase for logged-in, non-dummy users
          console.log('[wishStore] getWishesByList: Real user mode. Fetching from Supabase for listId:', listId);
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
