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
import ModulesPage from './pages/ModulesPage';
import FormandosPage from './pages/FormandosPage';
import FormadoresPage from './pages/FormadoresPage';
import TurmaDetailsPage from './pages/TurmaDetailsPage';
import TurmaSchedulePage from './pages/TurmaSchedulePage';
import SchedulesPage from './pages/SchedulesPage';
import CandidatoPage from './pages/CandidatoPage';
import CandidaturasPage from './pages/CandidaturasPage';
import ChatWidget from './components/ChatWidget';
import { authService } from './services/authService';
import './App.css';

// Componente de Rota Protegida por Role
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se allowedRoles for fornecido, verificar se o user tem permissão
  if (allowedRoles && !allowedRoles.includes(user.tipo_utilizador)) {
    // Se for Candidato a tentar aceder a pages internas, manda para a Landing Page
    if (user.tipo_utilizador === 'CANDIDATO') {
      return <Navigate to="/" replace />;
    }
    // Outros casos, manda para dashboard ou acesso negado
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para a Raiz (/)
// Se for staff/aluno logado -> Dashboard
// Se for candidato ou anonimo -> Landing Page
const RootRoute = () => {
  const user = authService.getCurrentUser();
  if (user && user.tipo_utilizador !== 'CANDIDATO') {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
};

import DashboardRootLayout from './components/layout/DashboardRootLayout';

import { ToastProvider } from './context/ToastContext';

function App() {
  // Roles que têm acesso à área interna
  const internalRoles = ['ADMIN', 'SECRETARIA', 'FORMADOR', 'FORMANDO'];

  return (
    <ToastProvider>
      <Router>
        <ChatWidget />
        <Routes>
          {/* Raiz Inteligente */}
          <Route path="/" element={<RootRoute />} />

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/disable-2fa" element={<Disable2FAPage />} />

          {/* Rota para Candidatos (Sem Sidebar) */}
          <Route path="/candidato" element={<RoleBasedRoute allowedRoles={['CANDIDATO']}><CandidatoPage /></RoleBasedRoute>} />

          {/* Layout Global com Sidebar para Todas as Rotas Internas */}
          <Route element={<DashboardRootLayout />}>

            {/* Rotas Comuns / Admin / Secretaria */}
            <Route path="/dashboard" element={<RoleBasedRoute allowedRoles={internalRoles}><HomePage /></RoleBasedRoute>} />
            <Route path="/profile" element={<RoleBasedRoute allowedRoles={internalRoles}><ProfilePage /></RoleBasedRoute>} />
            <Route path="/candidaturas" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><CandidaturasPage /></RoleBasedRoute>} />

            {/* Rota para Candidatos */}


            <Route path="/courses" element={<RoleBasedRoute allowedRoles={internalRoles}><CoursesPage /></RoleBasedRoute>} />

            {/* Rotas mais específicas (Admin/Secretaria) */}
            <Route path="/users" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><UsersPage /></RoleBasedRoute>} />
            <Route path="/rooms" element={<RoleBasedRoute allowedRoles={internalRoles}><RoomsPage /></RoleBasedRoute>} />
            <Route path="/turmas" element={<RoleBasedRoute allowedRoles={internalRoles}><TurmasPage /></RoleBasedRoute>} />
            <Route path="/turmas/:id" element={<RoleBasedRoute allowedRoles={internalRoles}><TurmaDetailsPage /></RoleBasedRoute>} />
            <Route path="/turmas/:id/schedule" element={<RoleBasedRoute allowedRoles={internalRoles}><TurmaSchedulePage /></RoleBasedRoute>} />
            <Route path="/modules" element={<RoleBasedRoute allowedRoles={internalRoles}><ModulesPage /></RoleBasedRoute>} />
            <Route path="/formandos" element={<RoleBasedRoute allowedRoles={internalRoles}><FormandosPage /></RoleBasedRoute>} />
            <Route path="/formadores" element={<RoleBasedRoute allowedRoles={internalRoles}><FormadoresPage /></RoleBasedRoute>} />
            <Route path="/schedules" element={<RoleBasedRoute allowedRoles={internalRoles}><SchedulesPage /></RoleBasedRoute>} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
