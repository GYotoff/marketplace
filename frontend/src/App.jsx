import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Settings from '@/pages/Settings'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import AuthCallback from '@/pages/AuthCallback'
import Dashboard from '@/pages/Dashboard'
import ViewProfile from '@/pages/ViewProfile'
import EditProfile from '@/pages/EditProfile'
import VolunteerCalendar from '@/pages/VolunteerCalendar'
import VolunteerAttendance from '@/pages/VolunteerAttendance'
import Organizations from '@/pages/Organizations'
import Corporations from '@/pages/Corporations'
import Volunteers from '@/pages/Volunteers'
import Projects from '@/pages/Projects'
import ProjectPage from '@/pages/ProjectPage'
import EventPage from '@/pages/EventPage'
import About from '@/pages/About'
import Blog from '@/pages/Blog'
import Contact from '@/pages/Contact'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import Cookies from '@/pages/Cookies'
import Events from '@/pages/Events'

// Organization flows
import RegisterOrganization from '@/pages/organizations/RegisterOrganization'
import OrganizationPage from '@/pages/organizations/OrganizationPage'
import OrgDashboard from '@/pages/organizations/OrgDashboard'
import OrgSettings from '@/pages/organizations/OrgSettings'
import OrgContentEditor from '@/pages/organizations/OrgContentEditor'
import OrgProjects from '@/pages/organizations/OrgProjects'
import OrgProjectEdit from '@/pages/organizations/OrgProjectEdit'
import OrgProjectEvents from '@/pages/organizations/OrgProjectEvents'
import OrgEventEdit from '@/pages/organizations/OrgEventEdit'
import OrgCalendar from '@/pages/organizations/OrgCalendar'

// Admin
import AdminOrganizations from '@/pages/admin/AdminOrganizations'
import AdminOrgDetail from '@/pages/admin/AdminOrgDetail'
import AdminEntities from '@/pages/admin/AdminEntities'
import AdminCorporations from '@/pages/admin/AdminCorporations'
import AdminRankings from '@/pages/admin/AdminRankings'
import AdminAchievements from '@/pages/admin/AdminAchievements'
import AdminProgressionRules from '@/pages/admin/AdminProgressionRules'
import RegisterCorporation from '@/pages/corporations/RegisterCorporation'
import CorpDashboard from '@/pages/corporations/CorpDashboard'
import CorpSettings from '@/pages/corporations/CorpSettings'
import CorpContentEditor from '@/pages/corporations/CorpContentEditor'
import CorporationPage from '@/pages/corporations/CorporationPage'

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
  const initTheme = useThemeStore(s => s.init)
  useEffect(() => { init(); initTheme() }, [init, initTheme])

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
        <Route path="/corporations" element={<Corporations />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/events/:id" element={<EventPage />} />
        <Route path="/dashboard/calendar" element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerCalendar />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/attendance" element={
          <ProtectedRoute allowedRoles={['volunteer']}>
            <VolunteerAttendance />
          </ProtectedRoute>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/organizations/register" element={<RegisterOrganization />} />
        <Route path="/organizations/:slug" element={<OrganizationPage />} />
        <Route path="/events" element={<Events />} />

        {/* Protected — any authenticated user */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
        <Route path="/dashboard/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

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
        <Route path="/org/calendar" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgCalendar />
          </ProtectedRoute>
        } />
        <Route path="/org/projects" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgProjects />
          </ProtectedRoute>
        } />
        <Route path="/org/projects/new" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgProjectEdit />
          </ProtectedRoute>
        } />
        <Route path="/org/projects/:id/edit" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgProjectEdit />
          </ProtectedRoute>
        } />
        <Route path="/org/projects/:projectId/events" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgProjectEvents />
          </ProtectedRoute>
        } />
        <Route path="/org/projects/:projectId/events/new" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgEventEdit />
          </ProtectedRoute>
        } />
        <Route path="/org/projects/:projectId/events/:eventId/edit" element={
          <ProtectedRoute allowedRoles={['org_admin', 'super_admin']}>
            <OrgEventEdit />
          </ProtectedRoute>
        } />

        {/* Corporation routes */}
        <Route path="/corporations/register" element={<RegisterCorporation />} />
        <Route path="/corp/dashboard" element={
          <ProtectedRoute allowedRoles={['corp_admin', 'super_admin']}>
            <CorpDashboard />
          </ProtectedRoute>
        } />
        <Route path="/corp/settings" element={
          <ProtectedRoute allowedRoles={['corp_admin', 'super_admin']}>
            <CorpSettings />
          </ProtectedRoute>
        } />
        <Route path="/corp/content" element={
          <ProtectedRoute allowedRoles={['corp_admin', 'super_admin']}>
            <CorpContentEditor />
          </ProtectedRoute>
        } />
        <Route path="/corporations/:slug" element={<CorporationPage />} />

        {/* Portal admin */}
        <Route path="/admin/entities" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminEntities />
          </ProtectedRoute>
        } />
        <Route path="/admin/rankings" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminRankings />
          </ProtectedRoute>
        } />
        <Route path="/admin/achievements" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminAchievements />
          </ProtectedRoute>
        } />
        <Route path="/admin/progression-rules" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminProgressionRules />
          </ProtectedRoute>
        } />
        <Route path="/admin/corporations" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminCorporations />
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
