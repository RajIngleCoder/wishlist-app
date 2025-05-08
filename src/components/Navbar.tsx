import React, { useState } from 'react';
import { Bell, Gift, Home, Heart, Star, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ProfileDropdown from './profile/ProfileDropdown';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';

type NavbarProps = {
  onViewChange: (view: 'lists' | 'wishes' | 'favorites') => void;
  currentView: string;
};

const Navbar = ({ onViewChange, currentView }: NavbarProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', icon: Home, view: 'lists' },
    { name: 'Featured', icon: Sparkles, view: 'featured' },
    { name: 'Trending', icon: Star, view: 'trending' },
    { name: 'Favorites', icon: Heart, view: 'favorites' },
  ];

  return (
    <nav className="bg-[#1F2937] border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">WishList</h1>
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onViewChange(item.view as 'lists' | 'wishes' | 'favorites')}
                    className={`relative px-4 py-2 group ${
                      currentView === item.view
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon size={18} />
                      {item.name}
                    </div>
                    {currentView === item.view && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transform origin-left transition-transform duration-200 ${
                      currentView === item.view ? 'scale-x-100' : 'scale-x-0'
                    } group-hover:scale-x-100`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button className="p-2 text-gray-400 hover:text-white rounded-lg">
                  <Bell size={20} />
                </button>
                <ProfileDropdown />
              </>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-gray-300 hover:text-white font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="btn-primary"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;