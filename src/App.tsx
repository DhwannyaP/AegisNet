import { Routes, Route, Navigate } from 'react-router-dom';
import { PacketProvider } from './context/PacketContext';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { ComparePage } from './pages/ComparePage';
import { PricingPage } from './pages/PricingPage';

// The dashboard is available at /demo so visitors to the website
// can explore it in simulation mode without needing an account or the desktop app.
function DemoRoute() {
  return (
    <PacketProvider>
      <DashboardLayout onSignOut={() => window.location.href = '/'} />
    </PacketProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/demo" element={<DemoRoute />} />
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
