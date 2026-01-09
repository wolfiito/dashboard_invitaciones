// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/LoginPages';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { EventDetailsPage } from '@/pages/EventDetailsPage';
import { ClientDashboardPage } from '@/pages/client/ClientDashboardPage';
import { ClientGuestsPage } from '@/pages/client/ClientGuestsPage';
import { ClientTablesPage } from '@/pages/client/ClientTablesPage';
import { HostessPage } from '@/pages/client/HostessPage';
import { ClientTimelinePage } from "@/pages/client/ClientTimelinePage";
import { ClientLocationPage } from '@/pages/client/ClientLocationPage';
import { ClientGiftsPage } from "@/pages/client/ClientGiftsPage";
import { ClientMessagesPage } from '@/pages/client/ClientMessagesPage';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'admin' | 'client' }) {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== allowedRole) return <Navigate to={role === 'admin' ? '/' : '/client/dashboard'} replace />;
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* ZONA CLIENTE */}
        <Route path="/client/*" element={
          <ProtectedRoute allowedRole="client">
            <DashboardLayout role="client">
              <Routes>
                <Route path="dashboard" element={<ClientDashboardPage />} />
                <Route path="guests" element={<ClientGuestsPage />} />
                <Route path="tables" element={<ClientTablesPage />} />
                <Route path="hostess" element={<HostessPage />} />
                <Route path="timeline" element={<ClientTimelinePage />} />
                <Route path="location" element={<ClientLocationPage />} />
                <Route path="gift" element={<ClientGiftsPage />} />
                <Route path="dashboard" element={<ClientDashboardPage />} />
                <Route path="messages" element={<ClientMessagesPage />} />
                {/* IMPORTANTE: Ruta absoluta para evitar recursión */}
                <Route path="*" element={<Navigate to="/client/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* ZONA ADMIN */}
        <Route path="/*" element={
          <ProtectedRoute allowedRole="admin">
            <DashboardLayout role="admin">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId" element={<EventDetailsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;