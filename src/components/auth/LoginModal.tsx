import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

type LoginModalProps = {
  onClose: () => void;
  onSwitchToRegister: () => void;
};

const LoginModal = ({ onClose, onSwitchToRegister }: LoginModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    console.log('Starting login form submission...');

    try {
      const email = ((e.target as HTMLFormElement).elements[0] as HTMLInputElement).value;
      const password = ((e.target as HTMLFormElement).elements[1] as HTMLInputElement).value;
      console.log('Attempting login with email:', email);
      await login(email, password);
      console.log('Login successful');
      onClose();
      // Navigate to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Login error in component:', err);
      setError(err.message || 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Log In</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter your email"
              />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                className="bg-gray-800 text-white w-full pl-10 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Enter your password"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100/10 rounded-md border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={cn(
              "inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              "w-full h-12 px-8 py-3 flex items-center justify-center gap-2"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>

          <p className="text-center text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-400 hover:text-blue-300"
            >
              Register
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
