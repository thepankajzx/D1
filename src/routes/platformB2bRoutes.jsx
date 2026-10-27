import React from 'react';
import { Route } from 'react-router-dom';

function lazyRetry(componentImport) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                               (error?.message && error.message.includes('Failed to fetch dynamically imported module'));
      if (isChunkLoadError) {
        const isReloaded = sessionStorage.getItem('chunk_retry_' + window.location.pathname);
        if (!isReloaded) {
          sessionStorage.setItem('chunk_retry_' + window.location.pathname, 'true');
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

// B2B Professional Collaboration Layer (Web Only Full Product)
const ProDashboard = lazyRetry(() => import('../pro/pages/ProDashboard'));
const JoinInvitePage = lazyRetry(() => import('../pro/pages/JoinInvitePage'));
const AdminDashboard = lazyRetry(() => import('../pro/pages/AdminDashboard'));
const OrgAdminPortal = lazyRetry(() => import('../pro/pages/OrgAdminPortal'));
const OrgSetupPage = lazyRetry(() => import('../pro/pages/OrgSetupPage'));
const JoinOrgDoctorPage = lazyRetry(() => import('../pro/pages/JoinOrgDoctorPage'));
const SuperAdminPortal = lazyRetry(() => import('../pro/pages/SuperAdminPortal'));
const ClinicalAiCopilot = lazyRetry(() => import('../components/ClinicalAiCopilot'));

export function getB2bRoutes() {
  return (
    <>
      <Route path="/pro" element={<ProDashboard />} />
      <Route path="/coach" element={<ProDashboard />} />
      <Route path="/join" element={<JoinInvitePage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/org-portal" element={<OrgAdminPortal />} />
      <Route path="/org" element={<OrgAdminPortal />} />
      <Route path="/org-setup" element={<OrgSetupPage />} />
      <Route path="/join-org" element={<JoinOrgDoctorPage />} />
      <Route path="/super-admin" element={<SuperAdminPortal />} />
      <Route path="/master-command" element={<SuperAdminPortal />} />
    </>
  );
}

export function renderActiveBot({ location, userRole, HabitAiCoachBot }) {
  const isClinicalPortal = (
    location.pathname === '/pro' ||
    location.pathname.startsWith('/pro/') ||
    location.pathname.startsWith('/org') || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/coach') ||
    location.pathname.startsWith('/super-admin') ||
    location.pathname.startsWith('/join')
  ) && !location.pathname.startsWith('/profile') && !location.pathname.startsWith('/progress');

  const isClinician = userRole === 'doctor' || userRole === 'org_admin' || userRole === 'super_admin';

  if (isClinicalPortal && isClinician) {
    return <ClinicalAiCopilot />;
  }
  return <HabitAiCoachBot />;
}
