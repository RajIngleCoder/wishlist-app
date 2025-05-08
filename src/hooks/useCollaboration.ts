import { useEffect, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '../store/authStore';
import { useListStore } from '../store/listStore';
import { useWishStore } from '../store/wishStore';
import type { Wish, WishList } from '../types';

const WEBSOCKET_URL = 'wss://your-websocket-server.com';

export function useCollaboration(listId: string) {
  const { user } = useAuthStore();
  const updateList = useListStore(state => state.updateList);
  const { addWish, updateWish, deleteWish } = useWishStore();

  const handleDocumentUpdate = useCallback((update: any, origin: any) => {
    if (origin === 'remote') {
      const wishData = update.wishes?.toJSON();
      if (wishData) {
        Object.entries(wishData).forEach(([id, wish]: [string, any]) => {
          if (wish._deleted) {
            deleteWish(id);
          } else {
            updateWish(id, wish as Wish);
          }
        });
      }

      const listData = update.list?.toJSON();
      if (listData) {
        updateList(listId, listData as WishList);
      }
    }
  }, [listId, updateList, updateWish, deleteWish]);

  useEffect(() => {
    if (!user || !listId) return;

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WEBSOCKET_URL, `list-${listId}`, ydoc);
    const awareness = provider.awareness;

    awareness.setLocalState({
      user: {
        name: user.name,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        id: user.id
      }
    });

    const yWishes = ydoc.getMap('wishes');
    const yList = ydoc.getMap('list');

    yWishes.observe(handleDocumentUpdate);
    yList.observe(handleDocumentUpdate);

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  }, [user, listId, handleDocumentUpdate]);
}