import React, { useState, useRef } from 'react';
import { LogOut, Settings, User as UserIcon, Camera, Edit2, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import type { User } from '../../types';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, updateUser } = useAuthStore();
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'USD',
    avatar: user?.avatar || ''
  });

  useOnClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setIsEditing(false);
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setEditForm(prev => ({ ...prev, avatar: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUser(editForm);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name.charAt(0)}
            </span>
          </div>
        )}
        <span className="text-sm font-medium">{user.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1F2937] rounded-lg shadow-lg py-4 z-50">
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Profile</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit2 size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="text-green-400 hover:text-green-300"
                >
                  <Save size={18} />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {isEditing ? (
                  <>
                    <img
                      src={editForm.avatar || user.avatar}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full hover:bg-blue-600"
                    >
                      <Camera size={14} />
                    </button>
                  </>
                ) : (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 w-full">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                  />
                  <select
                    value={editForm.currency}
                    onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                    className="input w-full"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              ) : (
                <div className="text-center">
                  <h4 className="font-medium">{user.name}</h4>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  <p className="text-gray-400 text-sm">Currency: {user.currency || 'USD'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-2 py-2">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700 w-full rounded-lg"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
