
import React, { useState, useEffect, useCallback } from 'react';
import { Role, AuthState, UniversityUser } from './types';
import { db } from './database';
import LandingPage from './views/LandingPage';
import Dashboards from './views/Dashboards';
import AdminPanel from './views/AdminPanel';
import AdminLogin from './views/AdminLogin';

export type AppView = 'landing' | 'admin-login' | 'dashboard' | 'admin-panel';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
  });
  
  const [currentView, setCurrentView] = useState<AppView>('landing');

  // Persistence logic
  useEffect(() => {
    const savedSession = localStorage.getItem('chreso_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setAuth(session);
        // Direct logged-in users to their dashboard
        if (session.role === Role.ADMIN) {
          setCurrentView('admin-panel');
        } else {
          setCurrentView('dashboard');
        }
      } catch (e) {
        localStorage.removeItem('chreso_session');
      }
    }
  }, []);

  const login = useCallback((user: UniversityUser) => {
    const newState = {
      user,
      role: user.role,
      isAuthenticated: true,
    };
    setAuth(newState);
    localStorage.setItem('chreso_session', JSON.stringify(newState));
    
    if (user.role === Role.ADMIN) {
      setCurrentView('admin-panel');
    } else {
      setCurrentView('dashboard');
    }
  }, []);

  const logout = useCallback(() => {
    if (auth.user) {
      db.addLog(auth.user.id, auth.user.role, 'LOGOUT', 'User logged out');
    }
    setAuth({ user: null, role: null, isAuthenticated: false });
    localStorage.removeItem('chreso_session');
    setCurrentView('landing');
  }, [auth.user]);

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
  };

  const renderView = () => {
    // If not authenticated, only allow landing or admin login
    if (!auth.isAuthenticated) {
      if (currentView === 'admin-login') {
        return <AdminLogin onLogin={login} onNavigate={navigateTo} />;
      }
      return <LandingPage onLogin={login} onNavigate={navigateTo} />;
    }

    // Role-based rendering
    if (auth.role === Role.ADMIN) {
      if (currentView === 'admin-panel') {
        return <AdminPanel user={auth.user!} onLogout={logout} onNavigate={navigateTo} />;
      }
      return <Dashboards user={auth.user!} role={auth.role!} onLogout={logout} onNavigate={navigateTo} />;
    }

    // Staff/Student always go to standard dashboard
    return <Dashboards user={auth.user!} role={auth.role!} onLogout={logout} onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen">
      {renderView()}
    </div>
  );
};

export default App;
