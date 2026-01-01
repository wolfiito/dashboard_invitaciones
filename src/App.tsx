import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/EventsPage';
import { EventDetailsPage } from '@/pages/EventDetailsPage';
import { ClientLoginPage } from '@/pages/client/ClientLoginPage';
import { ClientDashboardPage } from '@/pages/client/ClientDashboardPage';
import { ClientGuestsPage } from '@/pages/client/ClientGuestsPage'; // <--- IMPORTANTE
import { ClientTablesPage } from '@/pages/client/ClientTablesPage';
import { HostessPage } from '@/pages/client/HostessPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================================
            ZONA PÚBLICA / CLIENTE (Sin Sidebar de Admin)
           ========================================= */}
        
        {/* 1. Login del Cliente */}
        <Route path="/login" element={<ClientLoginPage />} />

        {/* 2. Dashboard del Cliente */}
        <Route path="/client/dashboard" element={<ClientDashboardPage />} />
        
        {/* 3. Gestión de Invitados */}
        <Route path="/client/guests" element={<ClientGuestsPage />} />
        
        {/* 4. Gestión de Mesas */}
        <Route path="/client/tables" element={<ClientTablesPage />} />

        <Route path="/client/hostess" element={<HostessPage />} />
        
        {/* =========================================
            ZONA ADMIN (Con Sidebar)
           ========================================= */}
        
        <Route path="/*" element={
          <DashboardLayout>
            <Routes>
              {/* Rutas internas del Admin */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              
              {/* Si escriben basura en la URL, van al Dashboard Admin */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;