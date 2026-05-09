import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/useAppStore';
import WelcomePage from './pages/WelcomePage';
import SetupPage from './pages/SetupPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import VoicePage from './pages/VoicePage';
import CompanionsPage from './pages/CompanionsPage';
import DrivePage from './pages/DrivePage';
import Layout from './components/Layout';

function App() {
  const { isInitialized, setCurrentView, companions, currentCompanion, setCurrentCompanion, sessions, setCurrentSession } = useAppStore();
  const location = useLocation();

  // Sync currentView with URL path
  useEffect(() => {
    if (!isInitialized) {
      setCurrentView('welcome');
      return;
    }
    const path = location.pathname;
    if (path.startsWith('/chat')) setCurrentView('chat');
    else if (path.startsWith('/companions')) setCurrentView('companions');
    else if (path.startsWith('/voice')) setCurrentView('voice');
    else if (path.startsWith('/settings')) setCurrentView('settings');
    else if (path.startsWith('/setup')) setCurrentView('setup');
    else if (path.startsWith('/drive')) setCurrentView('drive');
  }, [location.pathname, isInitialized, setCurrentView]);

  // Auto-select companion if none selected but companions exist
  useEffect(() => {
    if (isInitialized && !currentCompanion && companions.length > 0) {
      const first = companions[0];
      setCurrentCompanion(first);
      const session = sessions.find((s) => s.companionId === first.id);
      setCurrentSession(session || null);
    }
  }, [isInitialized, currentCompanion, companions, sessions, setCurrentCompanion, setCurrentSession]);

  // Drive mode is full-screen, outside Layout
  if (location.pathname === '/drive') {
    return isInitialized ? <DrivePage /> : <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={<WelcomePage />}
        />
        <Route
          path="/setup"
          element={<SetupPage />}
        />
        <Route
          path="/chat"
          element={isInitialized ? <ChatPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/settings"
          element={isInitialized ? <SettingsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/companions"
          element={isInitialized ? <CompanionsPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/voice"
          element={isInitialized ? <VoicePage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
