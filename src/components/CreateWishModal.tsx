import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Wish } from '../types';
import { scrapeProductInfo } from '../services/productScraper';

type CreateWishModalProps = {
  onClose: () => void;
  onAdd: (wish: Omit<Wish, 'id'>) => void;
};

const CreateWishModal = ({ onClose, onAdd }: CreateWishModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priority: 'medium' as Wish['priority'],
    link: '',
    createdAt: new Date().toISOString(),
    userId: 'mock-user',
    status: 'active' as Wish['status'],
    source: 'manual' as Wish['source'],
    listId: '' // Add listId to the form data
  });
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#1F2937] rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Add New Wish</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
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
                  className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium mb-1">Link (Optional)</label>
              <input
                type="url"
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                onBlur={async (e) => {
                  const url = e.target.value;
                  if (url) {
                    setIsFetching(true);
                    setFetchError('');
                    const productData = await scrapeProductInfo(url);
                    setIsFetching(false);
                    if (productData) {
                      setFormData({
                        ...formData,
                        title: productData.title || '',
                        description: productData.description || '',
                        price: productData.price || '',
                      });
                    } else {
                      setFetchError('Failed to fetch product details. Please check the link or enter details manually.');
                    }
                  }
                }}
              />
              {isFetching && <p className="text-sm text-gray-400 mt-1">Fetching product details...</p>}
              {fetchError && <p className="text-sm text-red-500 mt-1">{fetchError}</p>}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button type="submit" className="flex-1 btn-primary">
              Add Wish
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-600 hover:border-gray-500 text-gray-300 font-semibold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWishModal;
