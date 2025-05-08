import React from 'react';
import { ExternalLink, Heart, Share2, Edit, Trash2 } from 'lucide-react';
import type { Wish } from '../types';
import { useWishStore } from '../store/wishStore';

type WishCardProps = {
  wish: Wish;
  onEdit: () => void;
  onDelete: () => void;
};

const priorityColors = {
  low: 'bg-gray-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500'
};

const defaultImage = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80';

const WishCard = ({ wish, onEdit, onDelete }: WishCardProps) => {
  const toggleFavorite = useWishStore(state => state.toggleFavorite);

  const truncateTitle = (title: string) => {
    const maxLength = 50;
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="card group hover:scale-[1.02] transition-all duration-300">
      <div className="relative h-48 -mx-6 -mt-6 mb-4 rounded-t-lg overflow-hidden">
        <img 
          src={wish.imageUrl || defaultImage}
          alt={wish.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2937] to-transparent opacity-60" />
      </div>

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{truncateTitle(wish.title)}</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${priorityColors[wish.priority]}`} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(wish.id);
            }}
            className={`p-1 rounded-full transition-colors duration-200 ${
              wish.isFavorite
                ? 'text-red-500 hover:text-red-400'
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart size={16} fill={wish.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      
      <p className="text-gray-400 mb-4 line-clamp-2">{wish.description}</p>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold">${wish.price}</span>
        {wish.link && (
          <a
            href={wish.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View <ExternalLink size={16} />
          </a>
        )}
      </div>

      {wish.tags && wish.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {wish.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 btn-primary flex items-center justify-center gap-2">
          <Heart size={18} />
          I'll Gift This
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg"
        >
          <Edit size={18} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default WishCard;