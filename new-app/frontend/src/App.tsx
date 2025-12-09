import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Datasets from './pages/Datasets';
import DatasetDetail from './pages/DatasetDetail';
import Dashboards from './pages/Dashboards';
import DashboardDetail from './pages/DashboardDetail';
import Monitors from './pages/Monitors';
import Relationships from './pages/Relationships';
import Search from './pages/Search';
import AIChat from './pages/AIChat';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="datasets" element={<Datasets />} />
        <Route path="datasets/:id" element={<DatasetDetail />} />
        <Route path="dashboards" element={<Dashboards />} />
        <Route path="dashboards/:id" element={<DashboardDetail />} />
        <Route path="monitors" element={<Monitors />} />
        <Route path="relationships" element={<Relationships />} />
        <Route path="search" element={<Search />} />
        <Route path="ai-chat" element={<AIChat />} />
      </Route>
    </Routes>
  );
}

export default App;
