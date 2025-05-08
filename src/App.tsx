import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LandingPage } from './components/LandingPage';
import Dashboard from './components/Dashboard';

function App() {
  const { isAuthenticated, fetchUser, enableGuestMode, isGuestMode } = useAuthStore();
  const [showDashboard, setShowDashboard] = useState(false);

  // Check if we're coming from the landing page
  useEffect(() => {
    const fromLanding = sessionStorage.getItem('from_landing');
    if (fromLanding === 'true') {
      setShowDashboard(true);
      // Enable guest mode if user is not authenticated
      if (!isAuthenticated) {
        enableGuestMode();
      }
    }
  }, [isAuthenticated, enableGuestMode]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen">
      {isAuthenticated || isGuestMode || showDashboard ? <Dashboard /> : <LandingPage />}
    </div>
  );
}

export default App;
