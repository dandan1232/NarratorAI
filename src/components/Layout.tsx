import { ReactNode } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useTheme } from '../hooks/useTheme';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isInitialized, currentView } = useAppStore();
  useTheme();

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200 dark:bg-orange-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-amber-200 dark:bg-amber-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-yellow-200 dark:bg-yellow-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Sidebar - only show when initialized and not on welcome/setup */}
        {isInitialized && currentView !== 'welcome' && currentView !== 'setup' && (
          <Sidebar />
        )}

        {/* Main content */}
        <main className="h-screen flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
