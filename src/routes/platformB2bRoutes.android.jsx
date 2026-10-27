import React from 'react';
import { Route, Navigate } from 'react-router-dom';

/**
 * Android MVP Build Stub for B2B Routes
 * In Android MVP build, all B2B/clinical modules are completely omitted from the bundle.
 * Any direct route hit or hash link safely redirects to the dashboard.
 */
export function getB2bRoutes() {
  return (
    <>
      <Route path="/pro" element={<Navigate to="/" replace />} />
      <Route path="/coach" element={<Navigate to="/" replace />} />
      <Route path="/join" element={<Navigate to="/" replace />} />
      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route path="/org-portal" element={<Navigate to="/" replace />} />
      <Route path="/org" element={<Navigate to="/" replace />} />
      <Route path="/org-setup" element={<Navigate to="/" replace />} />
      <Route path="/join-org" element={<Navigate to="/" replace />} />
      <Route path="/super-admin" element={<Navigate to="/" replace />} />
      <Route path="/master-command" element={<Navigate to="/" replace />} />
    </>
  );
}

export function renderActiveBot({ HabitAiCoachBot }) {
  return <HabitAiCoachBot />;
}
