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
import { ClientTimelinePage } from "@/pages/client/ClientTimelinePage";
import { ClientLocationPage } from '@/pages/client/ClientLocationPage';
import { ClientGiftsPage } from "@/pages/client/ClientGiftsPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ClientLoginPage />} />

        {/* ZONA CLIENTE: Ahora integrada con el DashboardLayout */}
        <Route path="/client/*" element={
          <DashboardLayout role="client">
            <Routes>
              <Route path="dashboard" element={<ClientDashboardPage />} />
              <Route path="guests" element={<ClientGuestsPage />} />
              <Route path="tables" element={<ClientTablesPage />} />
              <Route path="hostess" element={<HostessPage />} />
              <Route path="timeline" element={<ClientTimelinePage />} />
              <Route path="location" element={<ClientLocationPage />} />
              <Route path="gift" element={<ClientGiftsPage />} />
            </Routes>
          </DashboardLayout>
        } />

        {/* ZONA ADMIN: Ya usaba DashboardLayout, solo añadimos el role */}
        <Route path="/*" element={
          <DashboardLayout role="admin">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DashboardLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;