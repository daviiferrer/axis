import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/landing';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import VerifyEmailPage from './pages/auth/VerifyEmail';
import DashboardPage from './pages/dashboard';
import ChatPage from './pages/dashboard/Chat';
import DashboardLayout from './components/dashboard/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Dashboard Layout - Parents all dashboard pages */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          {/* Add team and settings routes later when created */}
        </Route>

        {/* Redirect unknown routes to landing for now */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
