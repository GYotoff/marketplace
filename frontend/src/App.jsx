import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import AuthCallback from '@/pages/AuthCallback'
import Dashboard from '@/pages/Dashboard'
import ViewProfile from '@/pages/ViewProfile'
import EditProfile from '@/pages/EditProfile'
import Organizations from '@/pages/Organizations'
import Events from '@/pages/Events'

// Organization flows
import RegisterOrganization from '@/pages/organizations/RegisterOrganization'
import OrganizationPage from '@/pages/organizations/OrganizationPage'
import OrgDashboard from '@/pages/organizations/OrgDashboard'
import OrgSettings from '@/pages/organizations/OrgSettings'
import OrgContentEditor from '@/pages/organizations/OrgContentEditor'

// Admin
import AdminOrganizations from '@/pages/admin/AdminOrganizations'
import AdminOrgDetail from '@/pages/admin/AdminOrgDetail'
import AdminEntities from '@/pages/admin/AdminEntities'

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-6xl font-medium text-gray-100 mb-2">404</p>
      <h1 className="text-xl font-medium text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go home</a>
    </div>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/organizations/register" element={<RegisterOrganization />} />
        <Route path="/organizations/:slug" element={<OrganizationPage />} />
        <Route path="/events" element={<Events />} />

        {/* Protected — any authenticated user */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
        <Route path="/dashboard/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

        {/* Organization flows */}
        <Route path="/org/dashboard" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgDashboard />
          </ProtectedRoute>
        } />
        <Route path="/org/settings" element={
          <ProtectedRoute allowedRoles={['org_admin', 'content_creator', 'super_admin']}>
            <OrgSettings />
          </ProtectedRoute>
        } />
        <Route path="/org/content" element={
          <ProtectedRoute allowedRoles={['org_admin', 'content_creator', 'super_admin']}>
            <OrgContentEditor />
          </ProtectedRoute>
        } />

        {/* Portal admin */}
        <Route path="/admin/entities" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminEntities />
          </ProtectedRoute>
        } />
        <Route path="/admin/organizations/:id" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminOrgDetail />
          </ProtectedRoute>
        } />
        <Route path="/admin/organizations" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminOrganizations />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
