
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatThemeProvider } from './contexts/ChatThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionStatusBar from './components/ConnectionStatusBar';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import StatusDemo from './pages/StatusDemo';
import SkeletonDemo from './components/SkeletonDemo';
import SkeletonShowcase from './components/SkeletonShowcase';
import ChatDemo from './components/ChatDemo';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ChatThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              {/* 🔄 Connection Status Bar */}
              <ConnectionStatusBar />

              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/status-demo" element={<StatusDemo />} />
                <Route path="/skeleton-demo" element={<SkeletonDemo />} />
                <Route path="/skeleton-showcase" element={<SkeletonShowcase />} />
                <Route path="/chat-demo" element={<ChatDemo />} />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/chat" replace />} />
              </Routes>

              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-color)',
                    border: '1px solid var(--toast-border)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#ffffff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
            </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ChatThemeProvider>
    </ThemeProvider>
  );
}

export default App;
