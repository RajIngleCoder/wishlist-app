import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

interface NotificationPreferences {
  browser: boolean;
  email: boolean;
  push: boolean;
  listChanges: boolean;
  wishUpdates: boolean;
  collaboratorActivity: boolean;
}

interface NotificationState {
  preferences: NotificationPreferences;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  requestPermission: () => Promise<void>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      preferences: {
        browser: true,
        email: true,
        push: false,
        listChanges: true,
        wishUpdates: true,
        collaboratorActivity: true,
      },
      permission: 'default',
      subscription: null,

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      requestPermission: async () => {
        try {
          const permission = await Notification.requestPermission();
          set({ permission });

          if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY,
            });
            set({ subscription });
          }
        } catch (error) {
          console.error('Failed to request notification permission:', error);
        }
      },

      sendNotification: (title, options = {}) => {
        const { preferences, permission } = get();
        
        if (preferences.browser && permission === 'granted') {
          const notification = new Notification(title, {
            icon: '/logo.png',
            badge: '/badge.png',
            ...options,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        // Always show toast for in-app notifications
        get().showToast(title, options.type as 'success' | 'error' | 'info');
      },

      showToast: (message, type = 'info') => {
        switch (type) {
          case 'success':
            toast.success(message);
            break;
          case 'error':
            toast.error(message);
            break;
          default:
            toast(message);
        }
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        permission: state.permission,
      }),
    }
  )
);