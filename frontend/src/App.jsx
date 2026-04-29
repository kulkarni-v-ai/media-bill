import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e1e2e', color: '#e8e8f0', border: '1px solid #2a2a3d' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
