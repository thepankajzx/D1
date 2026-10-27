import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Icon from '../../components/Icon';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { 
  getOrganizationsRegistry, 
  saveOrganizationsRegistry, 
  getOrgTokensRegistry, 
  saveOrgTokensRegistry, 
  createOrgOnboardingToken,
  getSavedDoctors 
} from '../services/orgService';

export default function SuperAdminPortal() {
  const { currentUser } = useAuth();
  const { userDoc } = useData();
  const navigate = useNavigate();

  const isSuperAdmin = import.meta.env.DEV || userDoc?.role === 'super_admin' || userDoc?.isSuperAdmin;

  // Theme mode: Default to crisp, modern White Theme (true = dark, false = light)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('superadmin_theme');
      if (saved) return saved === 'dark';
    } catch (e) {}
    return false; // Default: clean White/Light theme
  });

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      localStorage.setItem('superadmin_theme', nextMode ? 'dark' : 'light');
    } catch (e) {}
  };

  const [activeTab, setActiveTab] = useState('institutions'); // 'institutions' | 'generator' | 'tokens'
  const [orgs, setOrgs] = useState(() => getOrganizationsRegistry());
  const [tokens, setTokens] = useState(() => getOrgTokensRegistry());
  const [doctorsList] = useState(() => getSavedDoctors());

  // Generator form state
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [specialty, setSpecialty] = useState('Metabolic Health & Clinical Nutrition');
  const [planTier, setPlanTier] = useState('Enterprise Multi-Clinic (Unlimited Doctors)');
  const [maxDoctors, setMaxDoctors] = useState(10);
  const [maxPatients, setMaxPatients] = useState(250);
  const [expiryDays, setExpiryDays] = useState(14);

  // Newly generated link modal
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Inspect Doctor Roster modal
  const [selectedOrgRoster, setSelectedOrgRoster] = useState(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Preset Helper for Fast 1-Click Demo Creation
  const handleApplyPreset = (presetType) => {
    if (presetType === 'metabolic') {
      setOrgName('MedCare Metabolic & Lifestyle Clinic');
      setAdminName('Dr. Rohit Sharma');
      setAdminEmail('director@medcaremetabolic.com');
      setAdminPhone('+91 98101 23456');
      setSpecialty('Metabolic Health & Clinical Nutrition');
      setPlanTier('Specialty Clinic Network (Up to 10 Doctors)');
      setMaxDoctors(8);
      setMaxPatients(200);
    } else if (presetType === 'pcos') {
      setOrgName('Aura PCOS & Hormone Wellness Care');
      setAdminName('Dr. Ananya Varma');
      setAdminEmail('ananya@aurahormonecare.in');
      setAdminPhone('+91 98202 34567');
      setSpecialty('PCOS Reversal & Hormonal Endocrinology');
      setPlanTier('Enterprise Multi-Clinic (Unlimited Doctors)');
      setMaxDoctors(12);
      setMaxPatients(350);
    } else if (presetType === 'cardio') {
      setOrgName('Apex Preventive Heart & Longevity');
      setAdminName('Dr. K. S. Singhania');
      setAdminEmail('singhania@apexlongevity.org');
      setAdminPhone('+91 98303 45678');
      setSpecialty('Cardiometabolic & Hypertension DASH');
      setPlanTier('Solo Practitioner Pro (1 Specialist)');
      setMaxDoctors(2);
      setMaxPatients(80);
    }
  };

  // Refresh lists
  const refreshData = () => {
    setOrgs(getOrganizationsRegistry());
    setTokens(getOrgTokensRegistry());
  };

  // Handle Token Generation
  const handleGenerateToken = (e) => {
    e.preventDefault();
    if (!orgName.trim() || !adminName.trim() || !adminEmail.trim()) {
      alert('Please fill in Institution Name, Admin Name, and Admin Email.');
      return;
    }

    if (navigator.vibrate) navigator.vibrate(30);

    const result = createOrgOnboardingToken({
      orgName: orgName.trim(),
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      specialty,
      planTier,
      maxDoctors,
      maxPatients,
      expiryDays
    });

    setGeneratedInvite(result);
    refreshData();

    // Reset Form
    setOrgName('');
    setAdminName('');
    setAdminEmail('');
    setAdminPhone('');
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    if (navigator.vibrate) navigator.vibrate(20);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleRevokeToken = (tokenStr) => {
    if (!window.confirm('Are you sure you want to revoke this onboarding token? The administrator will no longer be able to use it.')) return;
    const updated = tokens.map(t => t.token === tokenStr ? { ...t, status: 'revoked' } : t);
    saveOrgTokensRegistry(updated);
    setTokens(updated);
  };

  // Platform Aggregated Metrics
  const totalOrgs = orgs.length;
  const totalDoctors = orgs.reduce((acc, o) => acc + (o.doctorCount || 0), 0);
  const totalPatients = orgs.reduce((acc, o) => acc + (o.patientCount || 0), 0);
  const activeOrgs = orgs.filter(o => o.status === 'active');
  const avgNetworkCompliance = activeOrgs.length > 0 
    ? +(activeOrgs.reduce((acc, o) => acc + (o.avgCompliance || 0), 0) / activeOrgs.length).toFixed(1)
    : 85.0;

  // Filtered organizations
  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.admin?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Security Guard: Immediately redirect unauthorized users to Home
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Theme container classes
  const themeClass = isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-20 ${themeClass}`}>
      
      {/* ── Top Master Sovereign Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-500/20 shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                Sovereign B2B Command Nexus
              </h1>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-mono shadow-2xs shrink-0">
                FOUNDER ACCESS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              Multi-Clinic Enterprise Governance &amp; Cryptographic License Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            title={isDarkMode ? 'Switch to Crisp White Theme' : 'Switch to Dark Theme'}
          >
            <span>{isDarkMode ? '☀️ White Theme' : '🌙 Dark Theme'}</span>
          </button>

          <Link
            to="/profile"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Icon name="person" className="text-sm" />
            <span className="hidden sm:inline">My Profile</span>
          </Link>
          
          <Link
            to="/org-portal"
            className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all items-center gap-1.5 shadow-2xs"
            title="Inspect Apex Org Portal"
          >
            <span>Apex Clinic Demo ↗</span>
          </Link>
        </div>
      </header>

      {/* ── Main Container ──────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

        {/* ── High-Level Aggregated KPI Banner ─────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Metric 1: Partner Institutions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Partner Institutions</span>
              <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm">🏢</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalOrgs}
              </p>
              <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {activeOrgs.length} Active Workspaces
              </span>
            </div>
          </div>

          {/* Metric 2: Medical Staff */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Medical Clinicians</span>
              <span className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center text-sm">🩺</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                {totalDoctors}
              </p>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                Doctors &amp; Dietitians
              </span>
            </div>
          </div>

          {/* Metric 3: Supervised Patients */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Supervised Patients</span>
              <span className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">👥</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalPatients}
              </p>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                Active Trainees
              </span>
            </div>
          </div>

          {/* Metric 4: Adherence */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
              <span>Network Adherence</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">📈</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {avgNetworkCompliance}%
              </p>
              <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 block">
                High Clinical Compliance
              </span>
            </div>
          </div>

          {/* Metric 5: Cryptographic Tokens */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/50 dark:via-slate-900 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <span>Security Tokens</span>
              <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm">🔐</span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {tokens.length}
              </p>
              <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-300 mt-0.5 block">
                100% Cryptographic Isolation
              </span>
            </div>
          </div>
        </section>

        {/* ── Navigation Tabs Bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              onClick={() => setActiveTab('institutions')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'institutions'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🏢 Partner Institutions</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'institutions' ? 'bg-indigo-100 dark:bg-black/40 text-indigo-700 dark:text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {orgs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'generator'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>⚡ Generate Secure Admin Link</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tokens'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🔐 Security Tokens Log</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'tokens' ? 'bg-indigo-100 dark:bg-black/40 text-indigo-700 dark:text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tokens.length}
              </span>
            </button>
          </div>

          {activeTab === 'institutions' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search institutions, directors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-medium shadow-2xs"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
            </div>
          )}
        </div>

        {/* ── TAB 1: PARTNER INSTITUTIONS DIRECTORY ───────────────────────────── */}
        {activeTab === 'institutions' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map((org) => {
                const isActive = org.status === 'active';
                // Clean 2-4 letter logo initials that never wrap or break
                const displayLogo = org.logoText ? org.logoText.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) : 'ORG';

                return (
                  <div
                    key={org.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all flex flex-col justify-between shadow-xs hover:shadow-md group"
                  >
                    <div>
                      {/* Card Header with Non-Breaking Clean Logo Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/80 dark:to-slate-800 border border-indigo-200/90 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 tracking-wider shadow-2xs uppercase px-1 text-center select-none overflow-hidden">
                            {displayLogo}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                              {org.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                              {org.specialty}
                            </p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          <span>{isActive ? 'Live' : 'Pending'}</span>
                        </span>
                      </div>

                      {/* Admin Lead Details */}
                      <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Director:</span>
                          <span className="text-slate-900 dark:text-white font-bold">{org.admin?.name || 'Assigned Lead'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                          <span>Email:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[180px]">{org.admin?.email}</span>
                        </div>
                        {org.admin?.phone && (
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                            <span>Phone:</span>
                            <span className="font-mono">{org.admin.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Live Telemetry Counts */}
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[9.5px] uppercase text-slate-400 dark:text-slate-500 font-bold block">Doctors</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                            {org.doctorCount || 0}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[9.5px] uppercase text-slate-400 dark:text-slate-500 font-bold block">Patients</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                            {org.patientCount || 0}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[9.5px] uppercase text-slate-400 dark:text-slate-500 font-bold block">Adherence</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            {org.avgCompliance ? `${org.avgCompliance}%` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* License Tier */}
                      <div className="mt-3 text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                        <span className="truncate font-medium">{org.planTier}</span>
                        <span className="text-slate-400 dark:text-slate-500 shrink-0 font-mono text-[9.5px]">
                          {org.licenseKey ? org.licenseKey.substring(0, 14) + '...' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Sovereign Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to={`/org-portal?org=${org.id}&from=superadmin`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center transition-all shadow-xs"
                        title="Deep dive into this organization's live portal"
                      >
                        Inspect Portal ↗
                      </Link>

                      <button
                        onClick={() => setSelectedOrgRoster(org)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                        title="View clinical roster breakdown"
                      >
                        Roster
                      </button>

                      {org.admin?.phone && (
                        <a
                          href={`https://wa.me/${org.admin.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${org.admin.name}, this is the Definite Platform Founder regarding your ${org.name} deployment.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-all flex items-center justify-center shrink-0"
                          title="Direct WhatsApp outreach to director"
                        >
                          <WhatsAppIcon size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: CRYPTOGRAPHIC ADMIN ONBOARDING LINK GENERATOR ─────────────── */}
        {activeTab === 'generator' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <span>🔐 Single-Use Cryptographic Auth</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                Generate Secure Administrator Onboarding Link
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Creates a cryptographically signed authorization token and dedicated invitation URL. Only the designated director with this token can initialize their clinical workspace.
              </p>
            </div>

            {/* Quick 1-Click Clinic Templates (Fast Testing for Demos) */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
              <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-xs font-black">
                <span>⚡ 1-Click Fast Demo Presets:</span>
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">Click to autofill form</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('metabolic')}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  Metabolic &amp; Lifestyle Clinic
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('pcos')}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  PCOS &amp; Hormone Center
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('cardio')}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                >
                  Solo Cardiology Pro
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-4">
              {/* Institution Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Institution / Clinic / Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortis Metabolic & Longevity Wing"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
                />
              </div>

              {/* Director Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Director / Administrator Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Mehta"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Director Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. director@mehtaclinic.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Director Phone / WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Director WhatsApp / Mobile (with country code)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98111 22334"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Specialty Focus
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium cursor-pointer"
                  >
                    <option value="Metabolic Health & Clinical Nutrition">Metabolic Health &amp; Clinical Nutrition</option>
                    <option value="PCOS Reversal & Hormonal Endocrinology">PCOS Reversal &amp; Hormonal Endocrinology</option>
                    <option value="Cardiometabolic & Hypertension DASH">Cardiometabolic &amp; Hypertension DASH</option>
                    <option value="Executive Stress, Sleep & Longevity">Executive Stress, Sleep &amp; Longevity</option>
                    <option value="Sports Nutrition & Hypertrophy Performance">Sports Nutrition &amp; Performance</option>
                  </select>
                </div>
              </div>

              {/* License Tier & Quota Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    License Tier
                  </label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium cursor-pointer"
                  >
                    <option value="Enterprise Multi-Clinic (Unlimited Doctors)">Enterprise Multi-Clinic (Unlimited)</option>
                    <option value="Specialty Clinic Network (Up to 10 Doctors)">Specialty Clinic (Up to 10 Doctors)</option>
                    <option value="Solo Practitioner Pro (1 Specialist)">Solo Practitioner Pro (1 Specialist)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Doctor Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxDoctors}
                    onChange={(e) => setMaxDoctors(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Token Validity
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 font-medium cursor-pointer"
                  >
                    <option value={7}>7 Days Validity</option>
                    <option value={14}>14 Days Validity</option>
                    <option value={30}>30 Days Validity</option>
                    <option value={365}>1 Year Enterprise Pass</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚡ Issue Cryptographic Authorization Token &amp; Link</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 3: SECURITY TOKENS & AUDIT LOG ──────────────────────────────── */}
        {activeTab === 'tokens' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Issued Cryptographic Onboarding Tokens</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Audit trail of all administrative authorization keys issued</p>
              </div>
              <span className="text-xs text-slate-500 font-mono font-bold">
                {tokens.length} Total Tokens
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Token Key</th>
                    <th className="py-3 px-4">Target Institution</th>
                    <th className="py-3 px-4">Director Contact</th>
                    <th className="py-3 px-4">License Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issued Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {tokens.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {t.token}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {t.orgName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-200">{t.adminName}</div>
                        <div className="text-[10px] text-slate-500">{t.adminEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {t.planTier}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'claimed'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : t.status === 'revoked'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {t.status === 'claimed' ? '✓ Claimed & Active' : t.status === 'revoked' ? 'Revoked' : '⏳ Pending Setup'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {t.createdAt}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.status === 'pending' && (
                          <button
                            onClick={() => handleRevokeToken(t.token)}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 underline font-bold cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                        {t.status === 'claimed' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL 1: NEWLY GENERATED CRYPTOGRAPHIC INVITE ─────────────────────── */}
      {generatedInvite && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Authorization Token Activated</span>
              </div>
              <button
                onClick={() => setGeneratedInvite(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {generatedInvite.inviteRecord.orgName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Director: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{generatedInvite.inviteRecord.adminName}</span> ({generatedInvite.inviteRecord.adminEmail})
              </p>
            </div>

            {/* Token Badge */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
              <span className="truncate pr-2 font-bold">{generatedInvite.token}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold shrink-0">100% Isolated</span>
            </div>

            {/* Full URL Box */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Single-Use Setup Link:</span>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-mono break-all select-all">
                {generatedInvite.joinUrl}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleCopyLink(generatedInvite.joinUrl)}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                <span>{copiedLink ? '✓ Copied Link' : '📋 Copy Onboarding Link'}</span>
              </button>

              <a
                href={generatedInvite.waUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp Invite</span>
              </a>
            </div>

            {/* Direct Test Link button for Founder */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/org-setup?token=${generatedInvite.token}`}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>🚀 Open Setup Page Now (Test as Admin)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CLINICIAN STAFF ROSTER INSPECTION ────────────────────────── */}
      {selectedOrgRoster && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedOrgRoster.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enrolled Medical Clinicians &amp; Assigned Caseloads</p>
              </div>
              <button
                onClick={() => setSelectedOrgRoster(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {doctorsList.map((doc) => (
                <div key={doc.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">{doc.name}</h4>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{doc.specialty}</p>
                    <span className="text-[10px] text-slate-500">📍 {doc.clinicBranch}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {doc.clientCount} Patients
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {doc.avgCompliance}% Adherence
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOrgRoster(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
