import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Layout components (will be created in later tasks)
const AppLayout = React.lazy(() => import('../components/layout/AppLayout'));

// Auth pages (will be created in subtask 3.2)
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('../pages/auth/ForgotPasswordPage'));

// Main app pages (will be created in later tasks)
const DashboardPage = React.lazy(() => import('../pages/dashboard/DashboardPage'));
const TeamsPage = React.lazy(() => import('../pages/teams/TeamsPage'));
const TeamDetailPage = React.lazy(() => import('../pages/teams/TeamDetailPage'));
const ProjectsPage = React.lazy(() => import('../pages/projects/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('../pages/projects/ProjectDetailPage'));
const TasksPage = React.lazy(() => import('../pages/tasks/TasksPage'));

// Error pages
const NotFoundPage = React.lazy(() => import('../pages/errors/NotFoundPage'));

// Loading component for Suspense
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // AUTHENTICATION ROUTES COMMENTED OUT FOR TESTING
  /*
  {
    path: '/login',
    element: (
      <ProtectedRoute requireAuth={false}>
        <React.Suspense fallback={<PageLoader />}>
          <LoginPage />
        </React.Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <ProtectedRoute requireAuth={false}>
        <React.Suspense fallback={<PageLoader />}>
          <RegisterPage />
        </React.Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <ProtectedRoute requireAuth={false}>
        <React.Suspense fallback={<PageLoader />}>
          <ForgotPasswordPage />
        </React.Suspense>
      </ProtectedRoute>
    ),
  },
  */
  {
    path: '/',
    element: (
      // REMOVED PROTECTED ROUTE FOR TESTING - DIRECT ACCESS TO APP
      <React.Suspense fallback={<PageLoader />}>
        <AppLayout />
      </React.Suspense>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </React.Suspense>
        ),
      },
      {
        path: 'teams',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <TeamsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'teams/:teamId',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <TeamDetailPage />
          </React.Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <ProjectsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'projects/:projectId',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <ProjectDetailPage />
          </React.Suspense>
        ),
      },
      {
        path: 'tasks',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <TasksPage />
          </React.Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </React.Suspense>
    ),
  },
]);

export default router;