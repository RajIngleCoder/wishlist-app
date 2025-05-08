import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WishCard from '../WishCard';
import type { Wish } from '../../types';

type SortableWishCardProps = {
  wish: Wish;
  onEdit: () => void;
  onDelete: () => void;
};

const SortableWishCard = ({ wish, onEdit, onDelete }: SortableWishCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wish.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none h-full"
    >
      <div className="h-full">
        <WishCard
          wish={wish}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default SortableWishCard;