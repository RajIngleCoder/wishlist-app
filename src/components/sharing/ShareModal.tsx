import React, { useState } from 'react';
import { X, Mail, Copy, Check, Users, Lock, Globe } from 'lucide-react';
import { useListStore } from '../../store/listStore';
import type { Collaborator } from '../../types';

type ShareModalProps = {
  listId: string;
  onClose: () => void;
  collaborators: Collaborator[];
};

const ShareModal = ({ listId, onClose, collaborators }: ShareModalProps) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'public' | 'shared'>('private');
  const updateList = useListStore(state => state.updateList);
  const list = useListStore(state => state.lists.find(l => l.id === listId));
  
  const shareUrl = `${window.location.origin}/lists/${listId}${list?.shareId ? `?share=${list.shareId}` : ''}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisibilityChange = (newVisibility: 'private' | 'public' | 'shared') => {
    setVisibility(newVisibility);
    updateList(listId, {
      visibility: newVisibility,
      shareId: newVisibility !== 'private' ? crypto.randomUUID() : undefined
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle invitation logic here
    if (email && list) {
      updateList(listId, {
        collaborators: [...(list.collaborators || []), email],
        visibility: 'shared'
      });
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1F2937] rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Share List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleVisibilityChange('private')}
                className={`p-3 rounded-lg flex flex-col items-center gap-2 ${
                  visibility === 'private'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Lock size={20} />
                <span className="text-sm">Private</span>
              </button>
              <button
                onClick={() => handleVisibilityChange('shared')}
                className={`p-3 rounded-lg flex flex-col items-center gap-2 ${
                  visibility === 'shared'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Users size={20} />
                <span className="text-sm">Shared</span>
              </button>
              <button
                onClick={() => handleVisibilityChange('public')}
                className={`p-3 rounded-lg flex flex-col items-center gap-2 ${
                  visibility === 'public'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Globe size={20} />
                <span className="text-sm">Public</span>
              </button>
            </div>
          </div>

          {visibility !== 'private' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input flex-1"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="btn-primary flex items-center gap-2"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {visibility === 'shared' && (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Invite Collaborators
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter email address"
                          className="input w-full pl-10"
                        />
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                      <button type="submit" className="btn-primary">
                        Send
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {collaborators.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Current Collaborators</h3>
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: collaborator.color }}
                          >
                            {collaborator.name.charAt(0)}
                          </div>
                          <span>{collaborator.name}</span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            collaborator.isActive
                              ? 'bg-green-900 text-green-300'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {collaborator.isActive ? 'Active' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;