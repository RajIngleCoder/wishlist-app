import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Loader2, Tag as TagIcon, Camera } from 'lucide-react';
import { scrapeProductInfo } from '../services/productScraper';
import { useListStore } from '../store/listStore';
import { useAuthStore } from '../store/authStore'; // Added import
import type { Wish } from '../types';

type WishModalProps = {
  onClose: () => void;
  onSubmit: (wish: Wish | Omit<Wish, 'id'>) => void;
  wish?: Wish | null;
  listId?: string | null;
  productData?: any;
};

const defaultImage = 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80';

const WishModal = ({ onClose, onSubmit, wish, listId, productData }: WishModalProps) => {
  const lists = useListStore(state => state.lists);
  const user = useAuthStore(state => state.user); // Modified: get user object
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: wish?.title || productData?.title || '',
    description: wish?.description || productData?.description || '',
    price: wish?.price || productData?.price || '',
    priority: wish?.priority || 'medium' as Wish['priority'],
    link: wish?.link || productData?.url || '',
    imageUrl: wish?.imageUrl || productData?.imageUrl || defaultImage,
    listId: wish?.listId || listId || '',
    category: wish?.category || '',
    tags: wish?.tags || [],
    source: wish?.source || productData?.source || 'manual' as Wish['source'],
    metadata: wish?.metadata || productData?.metadata || {},
    isFavorite: wish?.isFavorite || false,
    createdAt: new Date().toISOString(),
    userId: user?.id || '', // Modified: use user?.id with default value
    status: 'active' as Wish['status'], // Modified: status to 'active'
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFormData(prev => ({ ...prev, imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleLinkChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, link: url }));

    if (url.startsWith('http')) {
      setIsLoading(true);
      try {
        const productInfo = await scrapeProductInfo(url);
        if (productInfo) {
          setFormData(prev => ({
            ...prev,
            title: productInfo.title || prev.title,
            description: productInfo.description || prev.description,
            price: productInfo.price || prev.price,
            imageUrl: productInfo.imageUrl || prev.imageUrl,
            source: productInfo.source || 'manual',
            metadata: {
              ...prev.metadata,
              ...productInfo.metadata,
            },
          }));
        }
      } catch (error) {
        console.error('Failed to fetch product info:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(wish ? { ...formData, id: wish.id } : formData);
    onClose();
  };

  const [tagInput, setTagInput] = useState('');

  const renderMetadataValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1F2937] rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">{wish ? 'Edit Wish' : 'Add New Wish'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="relative">
            <div className="h-48 rounded-lg rounded-lg overflow-hidden mb-4 bg-gray-800">
              <img
                src={formData.imageUrl}
                alt="Wish"
                className="w-full h-full object-cover"
                onError={() => setFormData(prev => ({ ...prev, imageUrl: defaultImage }))}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product URL</label>
            <div className="relative">
              <input
                type="url"
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.link}
                onChange={handleLinkChange}
                placeholder="Paste product URL to auto-fill details"
              />
              <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {isLoading && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="bg-gray-800 text-white w-full h-24 resize-none rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Wish['priority'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">List (Optional)</label>
            <select
              className="bg-gray-800 text-white w-full rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.listId}
              onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
            >
              <option value="">No List</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
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
                placeholder="Press Enter to add tags"
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

          {formData.metadata && Object.keys(formData.metadata).length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Product Details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(formData.metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-gray-400">{key}</dt>
                    <dd className="font-medium">{renderMetadataValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button type="submit" style={{ backgroundColor: 'rgb(30, 64, 175)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} className="flex-1 hover:bg-blue-600">
              {wish ? 'Save Changes' : 'Add Wish'}
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

export default WishModal;
