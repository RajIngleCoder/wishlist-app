import React, { useState } from 'react';
import { Gift, Edit, Trash2, X } from 'lucide-react';
import type { WishList } from '../../types';
import { useListStore } from '../../store/listStore';

type ListCardProps = {
  list: WishList;
  onSelect: (listId: string) => void;
  wishCount: number;
};

const ListCard = ({ list, onSelect, wishCount }: ListCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(list.name);
  const [editedDescription, setEditedDescription] = useState(list.description || '');
  const updateList = useListStore(state => state.updateList);
  const deleteList = useListStore(state => state.deleteList);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateList(list.id, {
      name: editedName,
      description: editedDescription
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="card p-4">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">List Name</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:outline-none">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div 
      className="group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
      onClick={() => onSelect(list.id)}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 z-10" />
      
      <img
        src={list.imageUrl || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80'}
        alt={list.name}
        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.src = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80';
        }}
      />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{list.name}</h3>
            <p className="text-gray-300 text-sm">{wishCount} wishes</p>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteList(list.id);
              }}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {list.description && (
          <p className="text-gray-300 text-sm mt-1">{list.description}</p>
        )}

        {list.tags && list.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {list.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-800 bg-opacity-60 rounded-full text-xs text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListCard;
