import React, { useState, useEffect } from 'react';
import { X, Search, ExternalLink, ShoppingCart, Tag } from 'lucide-react';
import { searchProducts } from '../../services/productScraper';
import type { Product } from '../../types';

type ProductDiscoveryProps = {
  onClose: () => void;
  onProductSelect: (product: Product) => void;
};

const ProductDiscovery = ({ onClose, onProductSelect }: ProductDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const sources = [
    { id: 'all', name: 'All Sources', icon: Search },
    { id: 'amazon', name: 'Amazon', icon: ShoppingCart },
    { id: 'etsy', name: 'Etsy', icon: Tag },
  ];

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    const results = await searchProducts('', 'all');
    setRecommendations(results);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await searchProducts(searchQuery, selectedSource);
      setProducts(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateTitle = (title: string) => {
    const maxLength = 50;
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1F2937] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Discover Products</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search products across multiple sources..."
                  className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedSource(id)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    selectedSource === id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Searching across platforms...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={() => onProductSelect(product)}
                  />
                ))}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={() => onProductSelect(product)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onSelect }: { product: Product; onSelect: () => void }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-48">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 px-2 py-1 rounded text-sm">
          {product.source}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold">${product.price}</span>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            <span>{product.rating}</span>
            <span className="text-gray-400">({product.reviews})</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 btn-primary"
          >
            Add to Wishlist
          </button>
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg"
            >
              <ExternalLink size={20} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDiscovery;
