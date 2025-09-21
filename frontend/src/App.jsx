import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import NotificationProvider from './components/feedback/NotificationSystem';
import { TodoProvider } from './context/TodoContext';
import { FolderProvider } from './context/FolderContext';
import { ProjectProvider } from './context/ProjectContext';
import ProtectedRoute from './components/ProtectedRoute';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';

// 懒加载组件以优化首屏加载性能
const WelcomePage = lazy(() => import('./components/WelcomePage'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const MainAppPage = lazy(() => import('./components/MainAppPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const CommandPalette = lazy(() => import('./components/common/CommandPalette'));
const TestSparkles = lazy(() => import('./components/TestSparkles'));

function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentView, setCurrentView] = useState('workspace');
  
  // Production环境已通过vite配置自动移除console.log

  // 全局快捷键
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true, // Ctrl+K on Windows/Linux, Cmd+K on Mac
      callback: () => setIsCommandPaletteOpen(true),
      allowInInput: true // 允许在输入框中也能触发
    }
  ]);

  // Suspense包装器用于懒加载组件
  const SuspenseWrapper = ({ children }) => (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<SuspenseWrapper><WelcomePage /></SuspenseWrapper>} />
              <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
              <Route path="/register" element={<SuspenseWrapper><RegisterPage /></SuspenseWrapper>} />
              <Route path="/test-sparkles" element={<SuspenseWrapper><TestSparkles /></SuspenseWrapper>} />

              {/* Protected routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <FolderProvider>
                      <NotesProvider>
                        <TodoProvider>
                          <ProjectProvider>
                            <SuspenseWrapper>
                              <MainAppPage 
                                currentView={currentView}
                                onViewChange={setCurrentView}
                              />
                              <CommandPalette
                                isOpen={isCommandPaletteOpen}
                                onClose={() => setIsCommandPaletteOpen(false)}
                                onViewChange={setCurrentView}
                              />
                            </SuspenseWrapper>
                          </ProjectProvider>
                        </TodoProvider>
                      </NotesProvider>
                    </FolderProvider>
                  </ErrorBoundary>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <SuspenseWrapper>
                      <SettingsPage />
                    </SuspenseWrapper>
                  </ErrorBoundary>
                </ProtectedRoute>
              } />

              {/* Demo routes removed - Atlassian UI is now integrated into main app */}

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;