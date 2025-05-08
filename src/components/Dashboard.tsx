import React, { useState, useEffect } from 'react';
import { Gift, Plus, Share2, Star, Grid, List, Search } from 'lucide-react';
import Navbar from './Navbar';
import WishModal from './WishModal';
import WishList from './lists/WishList';
import CreateListModal from './lists/CreateListModal';
import ListCard from './lists/ListCard';
import WishCard from './WishCard';
import ProductDiscovery from './discovery/ProductDiscovery';
import { useListStore } from '../store/listStore';
import { useWishStore } from '../store/wishStore';
import { useAuthStore } from '../store/authStore';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import type { Wish, Product } from '../types';
import { Glow } from './ui/glow';

function Dashboard() {
  const { user, isAuthenticated, isGuestMode, disableGuestMode } = useAuthStore(); // Get user, auth status and guest mode
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'lists' | 'wishes' | 'favorites'>('lists');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const lists = useListStore(state => state.lists);
  const wishes = useWishStore(state => state.wishes);
  const favoriteWishes = useWishStore(state => state.getFavoriteWishes());
  const addWish = useWishStore(state => state.addWish);
  const updateWish = useWishStore(state => state.updateWish);
  const deleteWish = useWishStore(state => state.deleteWish);

  // Check if user is coming from landing page
  useEffect(() => {
    const fromLanding = sessionStorage.getItem('from_landing');
    const guestSession = sessionStorage.getItem('guest_session');
    if ((fromLanding === 'true' || guestSession === 'true') && !isAuthenticated) {
      setIsGuestUser(true);
    }
  }, [isAuthenticated]);
  const handleAddWish = (wish: Omit<Wish, 'id'>) => {
    addWish(wish);
    setIsWishModalOpen(false);
    setSelectedProduct(null);
  };

  const handleEditWish = (updatedWish: Wish | Omit<Wish, 'id'>) => {
    updateWish((updatedWish as Wish).id, updatedWish as Wish);
    setEditingWish(null);
    setIsWishModalOpen(false);
  };

  const handleDeleteWish = (id: string) => {
    deleteWish(id);
  };

  const openEditModal = (wish: Wish) => {
    setEditingWish(wish);
    setIsWishModalOpen(true);
  };

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
    setViewMode('wishes');
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsWishModalOpen(true);
    setIsDiscoveryOpen(false);
  };

  const getDisplayedWishes = () => {
    if (viewMode === 'favorites') return favoriteWishes;
    if (selectedListId) return wishes.filter(w => w.listId === selectedListId);
    return wishes;
  };

  return (
    <div className="min-h-screen relative">
      <Glow variant="bottom" />
      <Navbar onViewChange={setViewMode} currentView={viewMode} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {viewMode === 'favorites' 
                ? 'Favorite Wishes' 
                : `Dashboard - ${isGuestMode || isGuestUser ? 'Guest' : (user?.name || 'User')}`}
            </h1>
            <p className="text-gray-400">
              {viewMode === 'favorites' 
                ? 'Your favorite items from all lists'
                : 'Manage your wishes and collections'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {(isGuestUser || isGuestMode) && (
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    // Remove guest session and show login modal
                    disableGuestMode();
                    setIsGuestUser(false);
                    setShowLoginModal(true);
                  }}
                  className="btn-secondary flex items-center gap-2"
                >
                  Sign in to save your lists
                </button>
              </div>
            )}
            <button
              onClick={() => setIsDiscoveryOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Search size={20} />
              Discover Products
            </button>
            {viewMode !== 'favorites' && (
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('lists')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'lists' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('wishes')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'wishes' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setEditingWish(null);
                setSelectedProduct(null);
                setIsWishModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Wish
            </button>
            {viewMode !== 'favorites' && (
            <button
              onClick={() => setIsListModalOpen(true)}
              style={{ backgroundColor: 'rgb(30, 64, 175)', color: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }} className="flex items-center gap-2 hover:bg-blue-600"
            >
              <Plus size={20} />
              New List
            </button>
            )}
          </div>
        </div>

        {viewMode === 'lists' && !selectedListId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map(list => (
              <ListCard
                key={list.id}
                list={list}
                onSelect={handleListSelect}
                wishCount={wishes.filter(w => w.listId === list.id).length}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {selectedListId ? (
              <WishList
                listId={selectedListId}
                onEditWish={openEditModal}
                onDeleteWish={handleDeleteWish}
                onBack={() => {
                  setSelectedListId(null);
                  setViewMode('lists');
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getDisplayedWishes().map(wish => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    onEdit={() => openEditModal(wish)}
                    onDelete={() => handleDeleteWish(wish.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {lists.length === 0 && viewMode === 'lists' && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No wish lists yet</p>
            <button
              onClick={() => setIsListModalOpen(true)}
              className="btn-primary"
            >
              Create your first list
            </button>
          </div>
        )}

        {isWishModalOpen && (
          <WishModal 
            onClose={() => {
              setIsWishModalOpen(false);
              setEditingWish(null);
              setSelectedProduct(null);
            }}
            onSubmit={editingWish ? handleEditWish : handleAddWish}
            wish={editingWish}
            listId={selectedListId}
            productData={selectedProduct}
          />
        )}

        {isListModalOpen && (
          <CreateListModal 
            onClose={() => setIsListModalOpen(false)}
            onSuccess={(listId) => {
              setSelectedListId(listId);
              setViewMode('wishes');
            }}
          />
        )}

        {isDiscoveryOpen && (
          <ProductDiscovery
            onClose={() => setIsDiscoveryOpen(false)}
            onProductSelect={handleProductSelect}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
