import React, { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Share2, Users, ArrowLeft } from 'lucide-react';
import { useWishStore } from '../../store/wishStore';
import { useListStore } from '../../store/listStore';
import { useCollaboration } from '../../hooks/useCollaboration';
import SortableWishCard from './SortableWishCard';
import CollaboratorsList from '../collaboration/CollaboratorsList';
import ShareModal from '../sharing/ShareModal';
import type { Wish } from '../../types';

type WishListProps = {
  listId: string;
  onEditWish: (wish: Wish) => void;
  onDeleteWish: (id: string) => void;
  onBack: () => void;
};

const WishList = ({ listId, onEditWish, onDeleteWish, onBack }: WishListProps) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const getWishesByList = useWishStore(state => state.getWishesByList);
  const moveWish = useWishStore(state => state.moveWish);
  const list = useListStore(state => state.lists.find(l => l.id === listId));

  useCollaboration(listId);

  React.useEffect(() => {
    const loadWishes = async () => {
      setIsLoading(true);
      try {
        const fetchedWishes = await getWishesByList(listId);
        setWishes(fetchedWishes);
      } catch (error) {
        console.error('Error loading wishes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWishes();
  }, [listId, getWishesByList]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      moveWish(active.id as string, listId, listId);
    }
  };

  if (!list) return null;
  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  const mockCollaborators = [
    { id: '1', name: 'John Doe', color: '#4F46E5', isActive: true },
    { id: '2', name: 'Jane Smith', color: '#10B981', isActive: true },
    { id: '3', name: 'Mike Johnson', color: '#F59E0B', isActive: false },
  ];

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft size={20} />
        Back to Lists
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{list.name}</h2>
          <p className="text-gray-400">{list.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <CollaboratorsList collaborators={mockCollaborators} />
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {list.tags?.map(tag => (
          <span 
            key={tag}
            className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={wishes.map(wish => wish.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {wishes.map((wish) => (
              <SortableWishCard
                key={wish.id}
                wish={wish}
                onEdit={() => onEditWish(wish)}
                onDelete={() => onDeleteWish(wish.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {wishes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No wishes in this list yet</p>
        </div>
      )}

      {isShareModalOpen && (
        <ShareModal
          listId={listId}
          onClose={() => setIsShareModalOpen(false)}
          collaborators={mockCollaborators}
        />
      )}
    </div>
  );
};

export default WishList;