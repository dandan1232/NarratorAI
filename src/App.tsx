import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './stores/useAppStore';
import WelcomePage from './pages/WelcomePage';
import SetupPage from './pages/SetupPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import VoicePage from './pages/VoicePage';
import CompanionsPage from './pages/CompanionsPage';
import Layout from './components/Layout';

function App() {
  const { isInitialized, setCurrentView, companions, currentCompanion, setCurrentCompanion, sessions, setCurrentSession } = useAppStore();
  const navigate = useNavigate();
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

  // Auto-navigate to chat if setup is complete and on root
  useEffect(() => {
    if (isInitialized && location.pathname === '/' && companions.length > 0) {
      navigate('/chat');
    }
  }, [isInitialized, location.pathname, companions.length, navigate]);

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            !isInitialized ? (
              <WelcomePage />
            ) : (
              <Navigate to="/setup" replace />
            )
          }
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
