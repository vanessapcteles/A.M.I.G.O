import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CoursesPage from './pages/CoursesPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import Disable2FAPage from './pages/Disable2FAPage';
import UsersPage from './pages/UsersPage';
import RoomsPage from './pages/RoomsPage';
import TurmasPage from './pages/TurmasPage';
import { authService } from './services/authService';
import './App.css';

// Proteção de rotas simples
const PrivateRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rotas Protegidas */}
        <Route path="/dashboard" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/courses" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
        <Route path="/rooms" element={<PrivateRoute><RoomsPage /></PrivateRoute>} />
        <Route path="/turmas" element={<PrivateRoute><TurmasPage /></PrivateRoute>} />
        <Route path="/disable-2fa" element={<Disable2FAPage />} />

        {/* Redirecionar página inicial para dashboard se logado? Opcional */}
      </Routes>
    </Router>
  );
}

export default App;
