import React, { useState } from 'react';
import { X, Tag as TagIcon, Upload, Camera } from 'lucide-react';
import { useListStore } from '../../store/listStore';
import type { WishList } from '../../types';

const defaultImages = {
  electronics: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&q=80',
  books: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80',
  home: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80'
};

type CreateListModalProps = {
  onClose: () => void;
  onSuccess?: (listId: string) => void;
};

const CreateListModal = ({ onClose, onSuccess }: CreateListModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'personal' as WishList['type'],
    visibility: 'private' as WishList['visibility'],
    category: 'other',
    tags: [] as string[],
    imageUrl: defaultImages.other
  });

  const [tagInput, setTagInput] = useState('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const addList = useListStore(state => state.addList);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category,
      imageUrl: customImage || defaultImages[category as keyof typeof defaultImages]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setCustomImage(imageUrl);
        setFormData(prev => ({ ...prev, imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newList = addList(formData);
    if (onSuccess) {
      onSuccess(newList.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1F2937] rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 sticky top-0 bg-[#1F2937]">
          <h2 className="text-xl font-semibold">Create New List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="relative">
            <div className="h-48 rounded-lg overflow-hidden mb-4">
              <img
                src={formData.imageUrl}
                alt="List cover"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="cover-upload"
            />
            <label
              htmlFor="cover-upload"
              className="absolute bottom-6 right-2 p-2 bg-blue-500 rounded-full hover:bg-blue-600 cursor-pointer"
            >
              <Camera size={16} className="text-white" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">List Name</label>
            <input
              type="text"
              className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ paddingLeft: '1rem' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              style={{ paddingLeft: '1rem' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.keys(defaultImages).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                  className={`p-2 rounded-lg text-sm capitalize ${
                    formData.category === category
                      ? 'bg-blue-500 text-white border-2 border-blue-500'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as WishList['visibility'] })}
              >
                <option value="personal">Personal</option>
                <option value="group">Group</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Visibility</label>
              <select
                className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as WishList['visibility'] })}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="relative">
              <input
                type="text"
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags (press Enter)"
              />
              <TagIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-700 rounded-full text-sm text-gray-300 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" style={{ backgroundColor: 'rgb(30, 64, 175)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} className="flex-1 hover:bg-blue-600">
              Create List
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ border: '1px solid rgb(107, 114, 128)', color: 'rgb(209, 213, 219)', fontWeight: '600', padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'border-color 0.2s' }} className="flex-1 hover:border-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListModal;
