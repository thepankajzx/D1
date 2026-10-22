import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { 
  DEFAULT_ORG, 
  DEFAULT_DOCTORS, 
  getSavedOrg, 
  saveOrg, 
  getSavedDoctors, 
  saveDoctors, 
  resetOrgToDefault,
  validateOrgToken,
  claimOrgToken
} from '../services/orgService';

export default function OrgSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const [tokenValidation] = useState(() => {
    if (tokenParam) return validateOrgToken(tokenParam);
    return null;
  });

  const initialOrg = getSavedOrg();

  // 1. Organization & Branding
  const [companyName, setCompanyName] = useState(
    tokenValidation?.valid && tokenValidation.invite?.orgName 
      ? tokenValidation.invite.orgName 
      : (initialOrg.name || 'Apex Healthcare & Wellness Network')
  );
  const [brandCode, setBrandCode] = useState(
    tokenValidation?.valid && tokenValidation.invite?.orgName 
      ? tokenValidation.invite.orgName.substring(0, 4).toUpperCase() 
      : (initialOrg.logoText || 'APEX')
  );
  const [orgSlug, setOrgSlug] = useState(
    tokenValidation?.valid && tokenValidation.invite?.slug 
      ? tokenValidation.invite.slug 
      : (initialOrg.slug || 'apex-wellness')
  );
  const [planTier, setPlanTier] = useState(
    tokenValidation?.valid && tokenValidation.invite?.planTier 
      ? tokenValidation.invite.planTier 
      : (initialOrg.planTier || 'Enterprise Multi-Clinic (Unlimited Doctors)')
  );
  const [patientCapacity, setPatientCapacity] = useState(
    tokenValidation?.valid && tokenValidation.invite?.maxPatients 
      ? tokenValidation.invite.maxPatients 
      : (initialOrg.patientCapacity || 500)
  );
  const [licenseStatus, setLicenseStatus] = useState(initialOrg.licenseStatus || 'Active Annual Enterprise License');
  const [renewalDate, setRenewalDate] = useState(initialOrg.renewalDate || 'March 2027');

  // 2. Admin Credentials
  const [adminName, setAdminName] = useState(
    tokenValidation?.valid && tokenValidation.invite?.adminName 
      ? tokenValidation.invite.adminName 
      : (initialOrg.admin?.name || 'Priya Nambiar')
  );
  const [adminDesignation, setAdminDesignation] = useState(initialOrg.admin?.designation || 'Chief Wellness Director & HR Lead');
  const [adminEmail, setAdminEmail] = useState(
    tokenValidation?.valid && tokenValidation.invite?.adminEmail 
      ? tokenValidation.invite.adminEmail 
      : (initialOrg.admin?.email || 'admin@apexhealth.in')
  );
  const [phone, setPhone] = useState(
    tokenValidation?.valid && tokenValidation.invite?.adminPhone 
      ? tokenValidation.invite.adminPhone 
      : (initialOrg.admin?.phone || '+91 98765 43210')
  );
  const [password, setPassword] = useState('admin123');

  // 3. Branches / Locations list
  const [branchesList, setBranchesList] = useState(() => {
    if (initialOrg.branches) {
      return initialOrg.branches.split(',').map(s => s.trim()).filter(Boolean);
    }
    return ['South Delhi Clinic', 'Bandra West', 'Online Care', 'Corporate HQ'];
  });
  const [newBranchInput, setNewBranchInput] = useState('');

  // 4. Clinical Specialties list
  const [specialtiesList, setSpecialtiesList] = useState(() => {
    if (initialOrg.specialty) {
      return initialOrg.specialty.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [
      'Clinical Nutrition & Metabolic Lead',
      'Metabolic & Lifestyle Physician',
      'Strength & Performance Coach',
      'PCOS & Hormonal Health Specialist',
      'Executive Stress & Recovery Coach'
    ];
  });
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

  // 5. Clinician Staff Roster
  const [doctorsList, setDoctorsList] = useState(() => getSavedDoctors());
  
  // Quick Add Clinician row state
  const [newDocName, setNewDocName] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocBranch, setNewDocBranch] = useState(branchesList[0] || 'South Delhi Clinic');
  const [newDocSpecialty, setNewDocSpecialty] = useState(specialtiesList[0] || 'Clinical Nutrition & Metabolic Lead');

  // CSV Import Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvError, setCsvError] = useState('');

  // Save / Launch State
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── Branch Handlers ──
  const handleAddBranch = (branchToAdd) => {
    const val = (branchToAdd || newBranchInput).trim();
    if (!val) return;
    if (!branchesList.includes(val)) {
      setBranchesList(prev => [...prev, val]);
      setIsSaved(false);
    }
    setNewBranchInput('');
  };

  const handleRemoveBranch = (branchToRemove) => {
    if (branchesList.length <= 1) {
      alert('You must have at least one clinic location.');
      return;
    }
    setBranchesList(prev => prev.filter(b => b !== branchToRemove));
    setIsSaved(false);
  };

  // ── Specialty Handlers ──
  const handleAddSpecialty = (specToAdd) => {
    const val = (specToAdd || newSpecialtyInput).trim();
    if (!val) return;
    if (!specialtiesList.includes(val)) {
      setSpecialtiesList(prev => [...prev, val]);
      setIsSaved(false);
    }
    setNewSpecialtyInput('');
  };

  const handleRemoveSpecialty = (specToRemove) => {
    if (specialtiesList.length <= 1) {
      alert('You must have at least one clinical specialty.');
      return;
    }
    setSpecialtiesList(prev => prev.filter(s => s !== specToRemove));
    setIsSaved(false);
  };

  // ── Doctor Quick Add Handler ──
  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const cleanName = newDocName.trim();
    const formattedName = cleanName.startsWith('Dr.') || cleanName.startsWith('Coach') 
      ? cleanName 
      : `Dr. ${cleanName}`;

    const newDoctor = {
      id: `doc_${Date.now()}`,
      name: formattedName,
      specialty: newDocSpecialty || specialtiesList[0] || 'Clinical Nutrition & Metabolic Lead',
      proType: 'dietitian',
      email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${orgSlug}.in`,
      phone: newDocPhone.trim() || '+91 98000 00000',
      clinicBranch: newDocBranch || branchesList[0] || 'South Delhi Clinic',
      patientIds: [],
      clientCount: 0,
      avgCompliance: 0,
      status: 'active'
    };

    setDoctorsList(prev => [...prev, newDoctor]);
    setNewDocName('');
    setNewDocPhone('');
    setIsSaved(false);
  };

  const handleRemoveDoctor = (docId) => {
    setDoctorsList(prev => prev.filter(d => d.id !== docId));
    setIsSaved(false);
  };

  // ── CSV Bulk Import Handler ──
  const handleImportCsv = () => {
    setCsvError('');
    if (!csvText.trim()) {
      setCsvError('Please paste CSV content.');
      return;
    }

    const lines = csvText.trim().split('\n');
    const parsed = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header row if present
      if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('phone')) {
        continue;
      }

      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        const name = parts[0];
        const formattedName = name.startsWith('Dr.') || name.startsWith('Coach') ? name : `Dr. ${name}`;
        const phone = parts[1] || '+91 98000 00000';
        const branch = parts[2] || branchesList[0] || 'South Delhi Clinic';
        const specialty = parts[3] || specialtiesList[0] || 'Clinical Nutrition & Metabolic Lead';

        // Auto-add branch and specialty if they don't exist yet
        if (branch && !branchesList.includes(branch)) {
          setBranchesList(prev => [...prev, branch]);
        }
        if (specialty && !specialtiesList.includes(specialty)) {
          setSpecialtiesList(prev => [...prev, specialty]);
        }

        parsed.push({
          id: `doc_${Date.now()}_${i}`,
          name: formattedName,
          specialty,
          proType: 'dietitian',
          email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@${orgSlug}.in`,
          phone,
          clinicBranch: branch,
          patientIds: [],
          clientCount: 0,
          avgCompliance: 0,
          status: 'active'
        });
      }
    }

    if (parsed.length === 0) {
      setCsvError('No valid rows found in CSV. Format: Name, Phone, Branch, Specialty');
      return;
    }

    setDoctorsList(prev => [...prev, ...parsed]);
    setShowCsvModal(false);
    setCsvText('');
    setIsSaved(false);
    triggerToast(`Imported ${parsed.length} clinicians successfully!`);
  };

  const handleLoadSampleCsv = () => {
    setCsvText(
`Dr. Vikramaditya Singhania, +91 98111 55667, South Delhi Clinic, Clinical Nutrition & Metabolic Lead
Dr. Pooja Hegde, +91 98222 66778, Bandra West, PCOS & Hormonal Health Specialist
Coach Arjun Kapoor, +91 98333 77889, Corporate HQ, Strength & Performance Coach
Dr. Shalini Raman, +91 98444 88990, Online Care, Metabolic & Lifestyle Physician`
    );
  };

  // ── Toast Helper ──
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ── 1. Save Configuration ──
  const handleSaveConfiguration = () => {
    const updatedOrg = {
      name: companyName.trim() || 'Apex Healthcare & Wellness Network',
      logoText: brandCode.trim().toUpperCase() || 'APEX',
      slug: orgSlug.trim().toLowerCase() || 'apex-wellness',
      branches: branchesList.join(', '),
      specialty: specialtiesList.join(', '),
      admin: {
        id: `admin_${Date.now()}`,
        name: adminName.trim() || 'Priya Nambiar',
        designation: adminDesignation.trim() || 'Chief Wellness Director & HR Lead',
        email: adminEmail.trim() || 'admin@apexhealth.in',
        phone: phone.trim() || '+91 98765 43210'
      },
      planTier,
      patientCapacity: parseInt(patientCapacity) || 500,
      licenseStatus,
      renewalDate
    };

    saveOrg(updatedOrg);
    saveDoctors(doctorsList);

    if (tokenParam && tokenValidation?.valid) {
      claimOrgToken(tokenParam, updatedOrg);
    }

    // Set role in session
    localStorage.setItem('user_role', 'org_admin');
    localStorage.setItem('admin_email', adminEmail.trim());

    setIsSaved(true);
    triggerToast('Configuration saved successfully! Workspace is ready to launch.');
  };

  // ── 2. Launch Workspace ──
  const handleLaunchWorkspace = () => {
    handleSaveConfiguration();
    navigate('/org-portal');
  };

  // ── Reset to Apex Demo ──
  const handleResetToDefault = () => {
    if (window.confirm('Reset all organization settings and doctor directory back to the Apex Healthcare demo defaults?')) {
      resetOrgToDefault();
      setCompanyName(DEFAULT_ORG.name);
      setBrandCode(DEFAULT_ORG.logoText);
      setOrgSlug(DEFAULT_ORG.slug);
      setBranchesList(DEFAULT_ORG.branches.split(',').map(s => s.trim()));
      setSpecialtiesList(DEFAULT_ORG.specialty.split(',').map(s => s.trim()));
      setAdminName(DEFAULT_ORG.admin.name);
      setAdminDesignation(DEFAULT_ORG.admin.designation);
      setAdminEmail(DEFAULT_ORG.admin.email);
      setPhone(DEFAULT_ORG.admin.phone);
      setDoctorsList(DEFAULT_DOCTORS);
      setIsSaved(true);
      triggerToast('Restored demo defaults for Apex Healthcare.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-28 transition-colors">
      
      {/* ── Top Header / Sticky Navigation ── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left Title & Back Nav */}
            <div className="flex items-center gap-3">
              <Link
                to="/org-portal"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Return to Admin Dashboard"
              >
                <Icon name="arrow_back" className="text-base" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Enterprise Workspace Setup
                  </h1>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isSaved 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }`}>
                    {isSaved ? 'Saved & Ready' : 'Draft Config'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure network branding, clinic branches, clinical specialties, and staff roster.
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Reset to Apex Demo"
              >
                ⚡ Reset Demo
              </button>

              <button
                type="button"
                onClick={handleSaveConfiguration}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Icon name="save" className="text-sm" />
                <span>Save Configuration</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchWorkspace}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Launch Enterprise Workspace ➔</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Toast Notification ── */}
      {showToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Icon name="check_circle" className="text-base" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Main Setup Grid Container (Stretched Full Width) ── */}
      <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Token Authorization Banner */}
        {tokenParam && tokenValidation?.valid && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <div>
                <span className="font-black text-sm block">Cryptographic License Verified</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Authorized by Platform Founder for <strong>{tokenValidation.invite.orgName}</strong> ({tokenValidation.invite.adminEmail})
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 font-mono text-[11px] font-bold self-start sm:self-auto">
              Token: {tokenParam}
            </span>
          </div>
        )}

        {tokenParam && tokenValidation && !tokenValidation.valid && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-900 dark:text-rose-200 shadow-2xs">
            <span className="text-xl">⚠️</span>
            <div>
              <span className="font-black text-sm block">Token Security Warning</span>
              <span className="text-[11px] text-rose-700 dark:text-rose-300">{tokenValidation.error}</span>
            </div>
          </div>
        )}

        {/* Row 1: Brand Identity & Master Admin Credentials (2 Column Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Network & Brand Identity */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                <Icon name="apartment" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Network &amp; Brand Identity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  White-label branding for your clinical care network
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Institution / Network Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => { setCompanyName(e.target.value); setIsSaved(false); }}
                    placeholder="e.g. Apex Healthcare & Wellness Network"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Code / Logo *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={brandCode}
                    onChange={e => { setBrandCode(e.target.value.toUpperCase()); setIsSaved(false); }}
                    placeholder="APEX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-black uppercase text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Workspace Slug (Unique URL ID)
                  </label>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs">
                    <span className="text-slate-400">stitch.care/org/</span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={e => { setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setIsSaved(false); }}
                      className="flex-1 bg-transparent text-slate-900 dark:text-white font-mono focus:outline-hidden font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deployment Tier
                  </label>
                  <select
                    value={planTier}
                    onChange={e => { setPlanTier(e.target.value); setIsSaved(false); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="Enterprise Multi-Clinic (Unlimited Doctors)">Enterprise Multi-Clinic (Unlimited Doctors)</option>
                    <option value="Corporate Wellness & HR Portal">Corporate Wellness &amp; HR Portal</option>
                    <option value="Hospital Outpatient & Inpatient Network">Hospital Outpatient &amp; Inpatient Network</option>
                    <option value="Solo Practice / Private Dietitian Suite">Solo Practice / Private Dietitian Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Enrollment Capacity
                  </label>
                  <input
                    type="number"
                    value={patientCapacity}
                    onChange={e => { setPatientCapacity(e.target.value); setIsSaved(false); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    License Renewal Date
                  </label>
                  <input
                    type="text"
                    value={renewalDate}
                    onChange={e => { setRenewalDate(e.target.value); setIsSaved(false); }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Administrator Credentials & Access Control */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                <Icon name="verified_user" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Master Administrator Credentials
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Primary contact and portal supervisor for all clinical staff
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => { setAdminName(e.target.value); setIsSaved(false); }}
                    placeholder="e.g. Priya Nambiar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    value={adminDesignation}
                    onChange={e => { setAdminDesignation(e.target.value); setIsSaved(false); }}
                    placeholder="e.g. Chief Wellness Director & HR Lead"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Admin Email *
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => { setAdminEmail(e.target.value); setIsSaved(false); }}
                    placeholder="admin@apexhealth.in"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <WhatsAppIcon size={13} className="text-emerald-500" />
                    <span>WhatsApp Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setIsSaved(false); }}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Master Access Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Direct B2B admin password for password-based login mode.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Clinic Locations & Clinical Specialties (2 Column Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 3: Clinic Locations / Branches Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                  <Icon name="location_on" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Clinic Branches ({branchesList.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Physical clinics, virtual wings, and corporate branches
                  </p>
                </div>
              </div>
            </div>

            {/* Active Branches Pills */}
            <div className="flex flex-wrap gap-2 min-h-16 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 items-center">
              {branchesList.map(branch => (
                <span
                  key={branch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs group"
                >
                  <span>📍 {branch}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBranch(branch)}
                    className="w-4 h-4 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 flex items-center justify-center text-[10px] cursor-pointer"
                    title="Remove branch"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Add Branch Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newBranchInput}
                onChange={e => setNewBranchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddBranch(); } }}
                placeholder="Enter new clinic branch name..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddBranch()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                + Add Branch
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
              <span className="text-[11px] font-bold">Suggested:</span>
              {['Gurgaon DLF Phase 5', 'Bangalore Koramangala', 'Hyderabad Jubilee Hills', 'Virtual Telecare Wing'].filter(b => !branchesList.includes(b)).map(suggested => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleAddBranch(suggested)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  + {suggested}
                </button>
              ))}
            </div>
          </div>

          {/* Card 4: Clinical Departments & Specialties Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  <Icon name="medical_services" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Clinical Specialties ({specialtiesList.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Medical and lifestyle domains practiced by your doctors
                  </p>
                </div>
              </div>
            </div>

            {/* Active Specialties Pills */}
            <div className="flex flex-wrap gap-2 min-h-16 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 items-center">
              {specialtiesList.map(spec => (
                <span
                  key={spec}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs group"
                >
                  <span>🩺 {spec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialty(spec)}
                    className="w-4 h-4 rounded-full hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 flex items-center justify-center text-[10px] cursor-pointer"
                    title="Remove specialty"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Add Specialty Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpecialtyInput}
                onChange={e => setNewSpecialtyInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }}
                placeholder="Enter new specialty (e.g. Gut Microbiome Reset)..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddSpecialty()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                + Add Specialty
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
              <span className="text-[11px] font-bold">Suggested:</span>
              {['Gut Health & Microbiome Protocol', 'Cardiometabolic & Longevity', 'Pediatric Nutrition', 'Postpartum Fitness'].filter(s => !specialtiesList.includes(s)).map(suggested => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleAddSpecialty(suggested)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  + {suggested}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Staff Doctor Roster & Bulk CSV Import (Full Width) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                <Icon name="badge" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Medical Clinicians &amp; Coaches Directory ({doctorsList.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-load doctors to automatically bind them to their clinics and patient rosters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCsvModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="upload_file" className="text-sm" />
                <span>Bulk CSV Upload / Paste</span>
              </button>
            </div>
          </div>

          {/* Clinician Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Doctor / Clinician Name</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <WhatsAppIcon size={12} className="text-emerald-500" />
                      <span>Phone (WhatsApp)</span>
                    </span>
                  </th>
                  <th className="px-4 py-3">Assigned Branch</th>
                  <th className="px-4 py-3">Specialty / Role</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {doctorsList.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {doc.name.replace(/^(Dr\.|Coach)\s+/i, '').slice(0, 2).toUpperCase()}
                        </div>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                      {doc.phone || '+91 98000 00000'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={doc.clinicBranch}
                        onChange={e => {
                          const val = e.target.value;
                          setDoctorsList(prev => prev.map(d => d.id === doc.id ? { ...d, clinicBranch: val } : d));
                          setIsSaved(false);
                        }}
                        className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {branchesList.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={doc.specialty}
                        onChange={e => {
                          const val = e.target.value;
                          setDoctorsList(prev => prev.map(d => d.id === doc.id ? { ...d, specialty: val } : d));
                          setIsSaved(false);
                        }}
                        className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        {specialtiesList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveDoctor(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Remove doctor"
                      >
                        <Icon name="delete" className="text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Add Clinician Row */}
          <form onSubmit={handleAddDoctor} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              + Quick Add Doctor to Roster
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Doctor Name (e.g. Dr. Kavita Roy)"
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="WhatsApp Phone (e.g. +91 98111 22334)"
                  value={newDocPhone}
                  onChange={e => setNewDocPhone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <select
                  value={newDocBranch}
                  onChange={e => setNewDocBranch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  {branchesList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <select
                  value={newDocSpecialty}
                  onChange={e => setNewDocSpecialty(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  {specialtiesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* ── Fixed Bottom Two-Stage Action Bar ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 z-40 shadow-lg">
        <div className="w-full max-w-[1500px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isSaved ? 'All configuration settings are saved to isolated cloud storage.' : 'Unsaved changes pending — Click "Save Configuration" to persist.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveConfiguration}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Icon name="save" className="text-sm" />
              <span>Step 1: Save Configuration</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchWorkspace}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>Step 2: Launch Enterprise Workspace ➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL: Bulk CSV Staff Upload / Paste ── */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                  <Icon name="upload_file" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Bulk CSV Clinician Roster Import
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste CSV or doctor list with columns: Name, Phone, Branch, Specialty
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  CSV Data:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  ⚡ Load Sample CSV Data
                </button>
              </div>

              <textarea
                rows={8}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="Dr. John Doe, +91 98765 43210, South Delhi Clinic, Clinical Dietitian&#10;Dr. Jane Smith, +91 98765 12345, Bandra West, PCOS Specialist"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />

              {csvError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  ⚠ {csvError}
                </p>
              )}

              <p className="text-[11px] text-slate-400">
                Any branches or specialties in the CSV that do not already exist will automatically be created.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Icon name="check" className="text-sm" />
                <span>Import Clinicians ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
