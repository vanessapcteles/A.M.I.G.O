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
import MyCoursePage from './pages/MyCoursePage';
import MySchedulePage from './pages/MySchedulePage';
import GradesPage from './pages/GradesPage';
import FormandoFichaPage from './pages/FormandoFichaPage';
import FormadorFichaPage from './pages/FormadorFichaPage';
import ChatWidget from './components/ChatWidget';
import TrainerAvailabilityPage from './pages/TrainerAvailabilityPage';
import TrainerGradesPage from './pages/TrainerGradesPage';
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
import { ThemeProvider } from './context/ThemeContext';

function App() {
  // Roles que têm acesso à área interna
  const internalRoles = ['ADMIN', 'SECRETARIA', 'FORMADOR', 'FORMANDO'];

  return (
    <ThemeProvider>
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


              <Route path="/courses" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'CANDIDATO', 'FORMADOR']}><CoursesPage /></RoleBasedRoute>} />

              {/* Rotas de Formando */}
              <Route path="/my-course" element={<RoleBasedRoute allowedRoles={['FORMANDO']}><MyCoursePage /></RoleBasedRoute>} />
              <Route path="/grades" element={<RoleBasedRoute allowedRoles={['FORMANDO']}><GradesPage /></RoleBasedRoute>} />
              <Route path="/formando-ficha" element={<RoleBasedRoute allowedRoles={['FORMANDO']}><FormandoFichaPage /></RoleBasedRoute>} />

              {/* Rotas de Formador */}
              <Route path="/formador-ficha" element={<RoleBasedRoute allowedRoles={['FORMADOR']}><FormadorFichaPage /></RoleBasedRoute>} />
              <Route path="/my-schedule" element={<RoleBasedRoute allowedRoles={['FORMADOR']}><MySchedulePage /></RoleBasedRoute>} />
              <Route path="/trainer-availability" element={<RoleBasedRoute allowedRoles={['FORMADOR']}><TrainerAvailabilityPage /></RoleBasedRoute>} />
              <Route path="/trainer-grades" element={<RoleBasedRoute allowedRoles={['FORMADOR']}><TrainerGradesPage /></RoleBasedRoute>} />

              {/* Rotas mais específicas (Admin/Secretaria) */}
              <Route path="/users" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><UsersPage /></RoleBasedRoute>} />
              <Route path="/formandos/:id/ficha" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR']}><FormandoFichaPage /></RoleBasedRoute>} />
              <Route path="/rooms" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR']}><RoomsPage /></RoleBasedRoute>} />
              <Route path="/turmas" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR']}><TurmasPage /></RoleBasedRoute>} />
              <Route path="/turmas/:id" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR']}><TurmaDetailsPage /></RoleBasedRoute>} />
              <Route path="/turmas/:id/schedule" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR']}><TurmaSchedulePage /></RoleBasedRoute>} />
              <Route path="/modules" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR']}><ModulesPage /></RoleBasedRoute>} />
              <Route path="/formandos" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><FormandosPage /></RoleBasedRoute>} />
              <Route path="/formadores" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA']}><FormadoresPage /></RoleBasedRoute>} />
              <Route path="/schedules" element={<RoleBasedRoute allowedRoles={['ADMIN', 'SECRETARIA', 'FORMADOR', 'FORMANDO']}><SchedulesPage /></RoleBasedRoute>} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
