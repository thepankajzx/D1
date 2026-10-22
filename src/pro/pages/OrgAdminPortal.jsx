import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import PatientAnalyticsDeepDive from '../components/PatientAnalyticsDeepDive';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DEFAULT_ORG, 
  DEFAULT_DOCTORS, 
  DEFAULT_PATIENTS, 
  getOrgDashboardData,
  saveDoctors,
  savePatients,
  getSavedPatients,
  getPatientBiomarker,
  getDoctorTemplates,
  PRE_MADE_TEMPLATES,
  getSavedProtocols,
  saveProtocol,
  reassignPatientDoctor,
  createDoctorWhatsAppInvite,
  createPatientWhatsAppNudge,
  createPatientInviteWhatsApp
} from '../services/orgService';

export default function OrgAdminPortal() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [data, setData] = useState(() => getOrgDashboardData());
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' | 'patients'
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const adminMenuRef = useRef(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Close admin menu when clicking outside or scrolling
  useEffect(() => {
    function handleClickOutside(event) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
    }
    function handleScroll() {
      setShowAdminMenu(false);
    }
    if (showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showAdminMenu]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user_role');
      localStorage.removeItem('admin_email');
      await logout();
      navigate('/login');
    } catch (e) {
      navigate('/login');
    }
  };
  
  // Search & Filters for Doctors
  const [doctorSearch, setDoctorSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [doctorViewMode, setDoctorViewMode] = useState('matrix'); // 'matrix' | 'cards'
  const [doctorSortField, setDoctorSortField] = useState('compliance'); // 'name' | 'specialty' | 'branch' | 'patients' | 'compliance'
  const [doctorSortDir, setDoctorSortDir] = useState('desc'); // 'asc' | 'desc'

  // Search & Filters for Patients
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [patientSortField, setPatientSortField] = useState('score'); // 'name' | 'doctor' | 'protocol' | 'score' | 'biomarker' | 'status'
  const [patientSortDir, setPatientSortDir] = useState('desc'); // 'asc' | 'desc'

  // Reassign Patient Clinician Modal State
  const [reassigningPatient, setReassigningPatient] = useState(null);
  const [reassignTargetDoctorId, setReassignTargetDoctorId] = useState('');

  // Selected Patient for Deep-Dive Modal
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Invite Doctor Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    specialty: 'Clinical Dietitian & Metabolic Lead',
    proType: 'dietitian',
    phone: '',
    clinicBranch: 'South Delhi Clinic'
  });
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Add & Assign Patient Modal (Solo Admin Practice or Team Doctor)
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: '30',
    gender: 'Female',
    goal: 'Weight Loss & Metabolic Balance',
    assignedDoctorId: 'doc_sarah',
    planName: 'Clinical Metabolic Reset Plan'
  });
  const [generatedPatientInvite, setGeneratedPatientInvite] = useState(null);
  const [copiedPatientLink, setCopiedPatientLink] = useState(false);

  // Protocols State & Protocol Management Modal
  const [protocols, setProtocols] = useState(() => getSavedProtocols());
  const [showProtocolManagerModal, setShowProtocolManagerModal] = useState(false);
  const [newProtocolName, setNewProtocolName] = useState('');
  const [newProtocolFocus, setNewProtocolFocus] = useState('');
  const [newProtocolBiomarker, setNewProtocolBiomarker] = useState('');
  const [newProtocolIcon, setNewProtocolIcon] = useState('shield');
  const [protocolSuccess, setProtocolSuccess] = useState(false);

  const handleCreateProtocol = (e) => {
    e.preventDefault();
    if (!newProtocolName.trim()) return;
    const updated = saveProtocol({
      name: newProtocolName.trim(),
      focus: newProtocolFocus.trim() || 'Custom Care Protocol',
      biomarker: newProtocolBiomarker.trim() || 'Clinical Metric',
      icon: newProtocolIcon
    });
    setProtocols(updated);
    setNewProtocolName('');
    setNewProtocolFocus('');
    setNewProtocolBiomarker('');
    setProtocolSuccess(true);
    triggerToast('Care Protocol added to clinical library!');
    setTimeout(() => setProtocolSuccess(false), 2500);
  };

  // Filtered Doctors list
  const filteredDoctors = useMemo(() => {
    return data.doctors.filter(doc => {
      if (!doc) return false;
      if (branchFilter !== 'all' && doc.clinicBranch !== branchFilter) return false;
      if (doctorSearch.trim()) {
        const query = doctorSearch.toLowerCase();
        const matchName = (doc.name || '').toLowerCase().includes(query);
        const matchSpec = (doc.specialty || '').toLowerCase().includes(query);
        const matchBranch = (doc.clinicBranch || '').toLowerCase().includes(query);
        if (!matchName && !matchSpec && !matchBranch) return false;
      }
      return true;
    });
  }, [data.doctors, branchFilter, doctorSearch]);

  // Unique clinic branches
  const clinicBranches = useMemo(() => {
    return Array.from(new Set(data.doctors.map(d => d.clinicBranch)));
  }, [data.doctors]);

  // Dynamic configured branches from org settings + doctors
  const configuredBranches = useMemo(() => {
    const orgBranches = data?.org?.branches;
    let fromOrg = [];
    if (Array.isArray(orgBranches)) {
      fromOrg = orgBranches;
    } else if (typeof orgBranches === 'string') {
      fromOrg = orgBranches.split(',').map(b => b.trim()).filter(Boolean);
    }
    const fromDocs = (data?.doctors || []).map(d => d.clinicBranch).filter(Boolean);
    const combined = Array.from(new Set([...fromOrg, ...fromDocs]));
    return combined.length > 0 ? combined : ['South Delhi Clinic', 'Bandra West', 'Online Care', 'Corporate HQ'];
  }, [data?.org?.branches, data?.doctors]);

  // Dynamic configured specialties from org settings + defaults
  const configuredSpecialties = useMemo(() => {
    const orgSpecialty = data?.org?.specialty;
    let fromOrg = [];
    if (Array.isArray(orgSpecialty)) {
      fromOrg = orgSpecialty;
    } else if (typeof orgSpecialty === 'string') {
      fromOrg = orgSpecialty.split(',').map(s => s.trim()).filter(Boolean);
    }
    const standard = [
      'Clinical Dietitian & Metabolic Lead',
      'Metabolic & Lifestyle Physician',
      'Strength & Performance Coach',
      'PCOS & Hormonal Health Specialist',
      'Executive Stress & Recovery Coach',
      'Clinical Nutritionist & Weight Management',
      'Pediatric & Family Wellness Lead'
    ];
    return Array.from(new Set([...fromOrg, ...standard]));
  }, [data?.org?.specialty]);

  // Sortable & Filtered Doctors list
  const sortedDoctors = useMemo(() => {
    const list = [...filteredDoctors];
    list.sort((a, b) => {
      let valA, valB;
      if (doctorSortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        return doctorSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (doctorSortField === 'specialty') {
        valA = a.specialty.toLowerCase();
        valB = b.specialty.toLowerCase();
        return doctorSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (doctorSortField === 'branch') {
        valA = a.clinicBranch.toLowerCase();
        valB = b.clinicBranch.toLowerCase();
        return doctorSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (doctorSortField === 'patients') {
        valA = a.clientCount || 0;
        valB = b.clientCount || 0;
        return doctorSortDir === 'asc' ? valA - valB : valB - valA;
      }
      if (doctorSortField === 'compliance') {
        valA = a.avgCompliance || 0;
        valB = b.avgCompliance || 0;
        return doctorSortDir === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
    return list;
  }, [filteredDoctors, doctorSortField, doctorSortDir]);

  // Sortable & Filtered patients list
  const sortedPatients = useMemo(() => {
    let list = data.patients.filter(p => {
      if (!p) return false;
      if (doctorFilter !== 'all' && p.assignedDoctorId !== doctorFilter) return false;
      if (statusFilter === 'attention' && !p.needsAttention) return false;
      if (statusFilter === 'on_track' && p.needsAttention) return false;
      if (templateFilter !== 'all' && p.planName !== templateFilter) return false;
      if (patientSearch.trim()) {
        const query = patientSearch.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(query);
        const matchPhone = (p.phone || '').toLowerCase().includes(query);
        const matchPlan = (p.planName || '').toLowerCase().includes(query);
        const matchDoc = (p.assignedDoctorName || '').toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchPlan && !matchDoc) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA, valB;
      if (patientSortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
        return patientSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (patientSortField === 'doctor') {
        valA = (a.assignedDoctorName || '').toLowerCase();
        valB = (b.assignedDoctorName || '').toLowerCase();
        return patientSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (patientSortField === 'protocol') {
        valA = (a.planName || '').toLowerCase();
        valB = (b.planName || '').toLowerCase();
        return patientSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (patientSortField === 'score') {
        valA = a.compliance7d || 0;
        valB = b.compliance7d || 0;
        return patientSortDir === 'asc' ? valA - valB : valB - valA;
      }
      if (patientSortField === 'biomarker') {
        const bioA = getPatientBiomarker(a);
        const bioB = getPatientBiomarker(b);
        valA = bioA?.numericValue || 0;
        valB = bioB?.numericValue || 0;
        return patientSortDir === 'asc' ? valA - valB : valB - valA;
      }
      if (patientSortField === 'status') {
        valA = a.needsAttention ? 1 : 0;
        valB = b.needsAttention ? 1 : 0;
        return patientSortDir === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return list;
  }, [data.patients, doctorFilter, statusFilter, templateFilter, patientSearch, patientSortField, patientSortDir]);

  // Backward compatibility alias
  const filteredPatients = sortedPatients;

  // Handle reassigning patient to new clinician
  const handleReassignSubmit = (e) => {
    e.preventDefault();
    if (!reassigningPatient || !reassignTargetDoctorId) return;
    const result = reassignPatientDoctor({
      patientId: reassigningPatient.id,
      newDoctorId: reassignTargetDoctorId
    });
    if (result) {
      setData(prev => ({
        ...prev,
        patients: result.updatedPatients,
        doctors: result.updatedDoctors
      }));
      setReassigningPatient(null);
      setReassignTargetDoctorId('');
      triggerToast(`Patient ${result.transferredPatient.name} successfully transferred to ${result.newDoctor.name}!`);
    }
  };

  const handleDoctorSortToggle = (field) => {
    if (doctorSortField === field) {
      setDoctorSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setDoctorSortField(field);
      setDoctorSortDir('desc');
    }
  };

  const handlePatientSortToggle = (field) => {
    if (patientSortField === field) {
      setPatientSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setPatientSortField(field);
      setPatientSortDir('desc');
    }
  };

  const handleCreatePatientSubmit = (e) => {
    e.preventDefault();
    if (!patientForm.name) return;

    // Find assigned doctor (or Admin practice)
    const doc = data.doctors.find(d => d.id === patientForm.assignedDoctorId) || data.doctors[0];
    
    // Generate WhatsApp invite
    const invite = createPatientInviteWhatsApp({
      patientName: patientForm.name,
      doctorName: doc.name,
      phone: patientForm.phone,
      planName: patientForm.planName
    });

    // Create new patient record
    const newPatientId = `p_${Date.now()}`;
    const newPatient = {
      id: newPatientId,
      name: patientForm.name,
      age: Number(patientForm.age) || 30,
      gender: patientForm.gender,
      phone: patientForm.phone || '+91 98990 00000',
      assignedDoctorId: doc.id,
      assignedDoctorName: doc.name,
      goal: patientForm.goal,
      planName: patientForm.planName,
      compliance7d: 88.0,
      compliance30d: 85.0,
      loggedDaysLast7: 7,
      lastLoggedDate: new Date().toISOString().split('T')[0],
      needsAttention: false,
      startingWeight: 70.0,
      currentWeight: 69.4,
      dailyFocusNote: 'Welcome to your personalized wellness plan! Focus on hydration and meals.',
      sampleDays: [
        {
          date: new Date().toISOString().split('T')[0],
          status: 'full',
          planScore: 90,
          habits: {
            water: { name: 'Hydration Target', value: 3.0, target: 3.0, unit: 'L', status: 'done' },
            dinner: { name: 'Dinner Before 8:30 PM', value: '08:15 PM', status: 'done' }
          },
          metrics: { weight: 69.4 }
        }
      ],
      clinicalNotes: [
        { id: `cn_${Date.now()}`, date: new Date().toISOString().split('T')[0], text: `Initial Onboarding: Enrolled by ${data.org.admin.name}. Assigned to ${doc.name}.` }
      ]
    };

    // Update patients and doctor counts
    const updatedPatients = [newPatient, ...data.patients];
    const updatedDoctors = data.doctors.map(d => d.id === doc.id ? { 
      ...d, 
      patientIds: Array.from(new Set([...(d.patientIds || []), newPatientId])),
      clientCount: (d.clientCount || 0) + 1 
    } : d);
    savePatients(updatedPatients);
    saveDoctors(updatedDoctors);

    setData(prev => ({
      ...prev,
      patients: updatedPatients,
      doctors: updatedDoctors,
      stats: {
        ...prev.stats,
        totalPatients: updatedPatients.length
      }
    }));

    setGeneratedPatientInvite(invite);
  };

  const handleCreateDoctorInvite = (e) => {
    e.preventDefault();
    if (!inviteForm.name) return;
    const inv = createDoctorWhatsAppInvite({
      doctorName: inviteForm.name,
      phone: inviteForm.phone,
      orgName: data.org.name,
      orgSlug: data.org.slug
    });
    setGeneratedInvite(inv);

    // Register invited doctor in org roster
    const cleanDocName = inviteForm.name.trim();
    const formattedName = cleanDocName.startsWith('Dr.') || cleanDocName.startsWith('Coach') 
      ? cleanDocName 
      : `Dr. ${cleanDocName}`;
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: formattedName,
      specialty: inviteForm.specialty,
      proType: inviteForm.proType || 'dietitian',
      email: `${cleanDocName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@apexhealth.in`,
      phone: inviteForm.phone || '+91 98000 00000',
      clinicBranch: inviteForm.clinicBranch || 'South Delhi Clinic',
      patientIds: [],
      clientCount: 0,
      avgCompliance: 0,
      status: 'active'
    };

    const updatedDoctors = [newDoc, ...data.doctors];
    saveDoctors(updatedDoctors);
    setData(prev => ({
      ...prev,
      doctors: updatedDoctors,
      stats: {
        ...prev.stats,
        totalDoctors: updatedDoctors.length
      }
    }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper for Doctor Initials
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'DR';
    const parts = name.replace(/^(Dr\.|Coach)\s+/i, '').split(' ').filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name.slice(0, 2) || 'DR').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24 transition-colors">
      {/* ── Enterprise Clean Header (Day Theme) ── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-40">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Organization Branding & Details */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-sm tracking-wider shadow-md shrink-0 border border-indigo-400/30">
                {data.org.logoText || 'APEX'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {data.org.name}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 flex items-center gap-2">
                  <span>Admin: <strong className="text-slate-800 dark:text-slate-200">{data.org.admin.name}</strong> ({data.org.admin.designation})</span>
                  <span>•</span>
                  <span>ID: <code className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">{data.org.id}</code></span>
                </p>
              </div>
            </div>

            {/* Right: Clean Action Bar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={() => setShowProtocolManagerModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Manage and create clinical care protocols"
              >
                <Icon name="assignment" className="text-sm" />
                <span>Care Protocols ({protocols.length})</span>
              </button>

              <button
                onClick={() => {
                  setGeneratedPatientInvite(null);
                  setShowAddPatientModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Add and assign a new patient"
              >
                <Icon name="person_add" className="text-sm" />
                <span>Add Patient</span>
              </button>

              <button
                onClick={() => {
                  setGeneratedInvite(null);
                  setShowInviteModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Send 1-Click WhatsApp Invite to a Doctor"
              >
                <WhatsAppIcon size={14} className="text-white" />
                <span>Invite Doctor</span>
              </button>

              {/* Admin Profile & Account Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAdminMenu(prev => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-all border border-indigo-200/80 dark:border-indigo-800/80 cursor-pointer shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">
                    {getInitials(data.org?.admin?.name || data.org?.admin || 'Priya Nambiar')}
                  </div>
                  <span className="hidden sm:inline font-bold">
                    {(data.org?.admin?.name || data.org?.admin || 'Admin').toString().split(' ')[0]}
                  </span>
                  <Icon name={showAdminMenu ? "expand_less" : "expand_more"} className="text-xs" />
                </button>

                {showAdminMenu && (
                  <>
                    {/* Fixed invisible backdrop to close dropdown when tapping anywhere on page */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAdminMenu(false)} 
                    />
                    
                    <div 
                      ref={adminMenuRef}
                      className="absolute right-0 mt-2 w-80 sm:w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95"
                    >
                      {/* Admin Info Header */}
                      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white block text-sm">
                            {data.org?.admin?.name || data.org?.admin || 'Priya Nambiar'}
                          </span>
                          <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md">
                            Apex Master Admin
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">
                          {data.org?.admin?.email || 'admin@apexhealth.in'}
                        </span>
                      </div>

                      {/* ── Organization License & Capacity Section (Shifted from Main Dashboard) ── */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 truncate max-w-[170px]">
                            {(data.org?.planTier || 'Enterprise Multi-Clinic').toString().split('(')[0].trim()}
                          </span>
                          <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800 shrink-0">
                            Active License
                          </span>
                        </div>

                        {/* Capacity Meter */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>Enrolled Patient Capacity</span>
                            <span className="font-mono text-slate-900 dark:text-white">{data.stats.totalPatients} / {data.org.patientCapacity || 500} ({(((data.stats.totalPatients) / (data.org.patientCapacity || 500)) * 100).toFixed(1)}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(3, ((data.stats.totalPatients) / (data.org.patientCapacity || 500)) * 100))}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                          <span>Renewal: <strong className="text-slate-700 dark:text-slate-300 font-bold">{data.org.renewalDate || 'March 2027'}</strong></span>
                          <span>Branches: <strong className="text-slate-700 dark:text-slate-300 font-bold">{data.doctors.length > 0 ? Array.from(new Set(data.doctors.map(d => d.clinicBranch))).length : 4}</strong></span>
                        </div>
                      </div>

                      {/* Prominent Configure Workspace Button */}
                      <Link
                        to="/org-setup"
                        onClick={() => setShowAdminMenu(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Icon name="settings" className="text-sm" />
                          <span>Configure Workspace</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md">Setup Wizard ➔</span>
                      </Link>

                      <div className="space-y-1">
                        <Link
                          to="/pro?from=admin"
                          onClick={() => setShowAdminMenu(false)}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                        >
                          <Icon name="badge" className="text-sm text-indigo-600" />
                          <span>Doctor View / Clinician Portal ↗</span>
                        </Link>

                        <Link
                          to="/?view=consumer"
                          onClick={() => setShowAdminMenu(false)}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                        >
                          <Icon name="visibility" className="text-sm text-emerald-600" />
                          <span>Preview Consumer Habit Tracker</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-colors cursor-pointer"
                        >
                          <Icon name="logout" className="text-sm" />
                          <span>Switch Account / Log Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Container ── */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ── 1. Organization KPIs Cards Grid (Day Theme) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Doctors */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Registered Doctors
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Icon name="medical_services" className="text-base" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {data.stats.totalDoctors}
              </p>
              <span className="text-xs font-semibold text-slate-400">Clinicians</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              5 Specialists + 1 Solo Admin • 4 Branches
            </p>
          </div>

          {/* KPI 2: Patients */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Total Org Patients
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Icon name="groups" className="text-base" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {data.stats.totalPatients}
              </p>
              <span className="text-xs font-semibold text-slate-400">Active</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              100% synced daily tracking in isolated cloud
            </p>
          </div>

          {/* KPI 3: Compliance */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                7-Day Compliance Avg
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Icon name="trending_up" className="text-base" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {data.stats.avgCompliance}%
              </p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                ↑ +4.2%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cohort-wide adherence across prescribed habits
            </p>
          </div>

          {/* KPI 4: Triage & Health Status */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Cohort Health Triage
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Icon name="health_and_safety" className="text-base" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{data.stats.onTrackCount}</span>
                <span className="text-xs font-semibold text-slate-500">On Track</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{data.stats.needsAttentionCount}</span>
                <span className="text-xs font-semibold text-slate-500">Attention</span>
              </div>
            </div>
            
            {/* Visual ratio bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3 flex">
              <div style={{ width: `${(data.stats.onTrackCount / (data.stats.totalPatients || 1)) * 100}%` }} className="bg-emerald-500 h-full"></div>
              <div style={{ width: `${(data.stats.needsAttentionCount / (data.stats.totalPatients || 1)) * 100}%` }} className="bg-amber-400 h-full"></div>
            </div>
          </div>
        </div>

        {/* ── 2. Segmented Navigation Tabs (Day Theme) ── */}
        <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 text-sm font-bold">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'doctors' 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>👨‍⚕️ Doctors Roster</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'doctors'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {data.doctors.length}
            </span>
            {activeTab === 'doctors' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'patients' 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>👥 All Org Patients</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'patients'
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {data.patients.length}
            </span>
            {activeTab === 'patients' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        </div>

        {/* ── TAB 1: DOCTORS ROSTER (Day Theme + Matrix View & Sortable Columns) ── */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            
            {/* Search & Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Company Doctors &amp; Specialists
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    🔒 Tamper-Proof Audit Enabled
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adherence scores are strictly calculated from patient app check-ins (0% manual doctor overrides permitted).
                </p>
              </div>

              {/* View Switcher & Filters */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <button
                    onClick={() => setDoctorViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      doctorViewMode === 'matrix'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>▦ Matrix View</span>
                  </button>
                  <button
                    onClick={() => setDoctorViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      doctorViewMode === 'cards'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>⊞ Cards</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search doctor or specialty..."
                    value={doctorSearch}
                    onChange={e => setDoctorSearch(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-44 sm:w-52 font-medium"
                  />
                  {doctorSearch && (
                    <button 
                      onClick={() => setDoctorSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="all">All Clinic Branches</option>
                  {clinicBranches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode 1: Interactive Sortable Doctors Performance Matrix Table */}
            {doctorViewMode === 'matrix' ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500 tracking-wider">
                        <th 
                          onClick={() => handleDoctorSortToggle('name')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Doctor / Clinician</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {doctorSortField === 'name' ? (doctorSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                            </span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleDoctorSortToggle('specialty')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Specialty &amp; Domain</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {doctorSortField === 'specialty' ? (doctorSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                            </span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleDoctorSortToggle('branch')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Clinic Branch</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {doctorSortField === 'branch' ? (doctorSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                            </span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleDoctorSortToggle('patients')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Caseload</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {doctorSortField === 'patients' ? (doctorSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                            </span>
                          </div>
                        </th>
                        <th 
                          onClick={() => handleDoctorSortToggle('compliance')}
                          className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>7D Adherence Avg</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {doctorSortField === 'compliance' ? (doctorSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                            </span>
                          </div>
                        </th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {sortedDoctors.map(doc => {
                        const docTemplates = getDoctorTemplates(doc);
                        return (
                          <tr 
                            key={doc.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                                  {getInitials(doc.name)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white block text-sm">
                                    {doc.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {doc.phone}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                                {doc.specialty}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                              📍 {doc.clinicBranch}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xs">
                                <span>👥</span>
                                <span>{doc.clientCount} Patients</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${doc.avgCompliance >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                <span className={`text-sm font-black ${
                                  doc.avgCompliance >= 85
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : doc.avgCompliance >= 70
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {doc.avgCompliance}%
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setDoctorFilter(doc.id);
                                    setActiveTab('patients');
                                  }}
                                  className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700"
                                  title="Filter patient roster to this clinician"
                                >
                                  View ({doc.clientCount})
                                </button>
                                <Link
                                  to={`/pro?doc=${doc.id}&from=admin`}
                                  className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all text-center flex items-center gap-1 shadow-xs"
                                  title="Inspect doctor's live portal"
                                >
                                  <span>Inspect ↗</span>
                                </Link>
                                <a
                                  href={`https://wa.me/${(doc.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${doc.name}, this is Priya from Apex Healthcare admin team regarding your clinic roster.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-all text-center flex items-center justify-center"
                                  title="Message clinician on WhatsApp"
                                >
                                  <WhatsAppIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* View Mode 2: Doctors Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDoctors.map(doc => {
                  const docTemplates = getDoctorTemplates(doc);
                  return (
                    <div 
                      key={doc.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Doctor Avatar & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                              {getInitials(doc.name)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                                {doc.name}
                              </h3>
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate">
                                {doc.specialty}
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                            Active
                          </span>
                        </div>

                        {/* Location & Contact */}
                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>📍 {doc.clinicBranch}</span>
                          <span>•</span>
                          <span>📞 {doc.phone}</span>
                        </div>

                        {/* Quick Metrics */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Active Patients</span>
                            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                              {doc.clientCount} {doc.clientCount === 1 ? 'Patient' : 'Patients'}
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Adherence</span>
                              <span className="text-[9px] text-emerald-600 font-bold">🔒 System</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-2 h-2 rounded-full ${doc.avgCompliance >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                {doc.avgCompliance}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            setDoctorFilter(doc.id);
                            setActiveTab('patients');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all text-center cursor-pointer border border-slate-200/80 dark:border-slate-700"
                        >
                          View Patients ({doc.clientCount})
                        </button>

                        <Link
                          to={`/pro?doc=${doc.id}&from=admin`}
                          className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all text-center flex items-center gap-1 shadow-xs"
                          title="Inspect doctor's live view"
                        >
                          <span>Inspect Portal ↗</span>
                        </Link>

                        <a
                          href={`https://wa.me/${(doc.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${doc.name}, this is Priya from Apex Healthcare admin team regarding your clinic roster.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-all text-center flex items-center justify-center"
                          title="Connect with doctor on WhatsApp"
                        >
                          <WhatsAppIcon size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ALL ORG PATIENTS (Day Theme Table + Search & Filter) ── */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            
            {/* Active Doctor Filter Navigation Banner (Back to All Doctors Loop) */}
            {doctorFilter !== 'all' && (() => {
              const currentDoc = data.doctors.find(d => d.id === doctorFilter);
              return (
                <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 dark:from-indigo-950/70 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      <Icon name="person" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Filtered by Doctor
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'} in this Cohort
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        Viewing Patient Roster for {currentDoc ? currentDoc.name : 'Selected Doctor'}
                        {currentDoc?.specialty ? <span className="font-normal text-slate-500 dark:text-slate-400 ml-1.5">({currentDoc.specialty})</span> : null}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setDoctorFilter('all');
                        setActiveTab('doctors');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Icon name="arrow_back" className="text-sm" />
                      <span>Back to All Doctors</span>
                    </button>
                    <button
                      onClick={() => setDoctorFilter('all')}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <span>Show All Patients ({data.patients.length})</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Organization Patient Roster ({sortedPatients.length} / {data.patients.length})
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Sortable Columns (▲/▼)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click column headers to sort ascending/descending. Click <strong>Transfer</strong> on any row to reassign clinician.
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search patient name..."
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-40 font-medium"
                  />
                  {patientSearch && (
                    <button 
                      onClick={() => setPatientSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Doctor Filter */}
                <select
                  value={doctorFilter}
                  onChange={e => setDoctorFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="all">All Clinicians</option>
                  {data.doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                {/* Care Protocol / Template Filter */}
                <select
                  value={templateFilter}
                  onChange={e => setTemplateFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="all">All Protocols ({PRE_MADE_TEMPLATES.length})</option>
                  {PRE_MADE_TEMPLATES.map(t => (
                    <option key={t.id} value={t.name}>{t.icon} {t.name}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="all">All Health Statuses</option>
                  <option value="on_track">On Track (≥ 70%)</option>
                  <option value="attention">Needs Attention</option>
                </select>

                <button
                  onClick={() => {
                    setGeneratedPatientInvite(null);
                    setShowAddPatientModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ml-1"
                >
                  <Icon name="person_add" className="text-sm" />
                  <span>Add Patient</span>
                </button>
              </div>
            </div>

            {/* Patients Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-black text-slate-500 tracking-wider">
                      <th 
                        onClick={() => handlePatientSortToggle('name')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Patient Name</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {patientSortField === 'name' ? (patientSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => handlePatientSortToggle('doctor')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Primary Clinician</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {patientSortField === 'doctor' ? (patientSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>

                      <th 
                        onClick={() => handlePatientSortToggle('protocol')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Care Protocol / Template</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {patientSortField === 'protocol' ? (patientSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>

                      <th 
                        onClick={() => handlePatientSortToggle('score')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>7-Day Score</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {patientSortField === 'score' ? (patientSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>

                      <th 
                        onClick={() => handlePatientSortToggle('biomarker')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Clinical Biomarker / Trend</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {patientSortField === 'biomarker' ? (patientSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>

                      <th 
                        onClick={() => handlePatientSortToggle('status')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Triage Status</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {patientSortField === 'status' ? (patientSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </div>
                      </th>

                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {sortedPatients.map(patient => {
                      const biomarker = getPatientBiomarker(patient);
                      const nudge = createPatientWhatsAppNudge({
                        patientName: patient.name,
                        doctorName: patient.assignedDoctorName,
                        phone: patient.phone,
                        score: patient.compliance7d,
                        needsAttention: patient.needsAttention
                      });

                      return (
                        <tr 
                          key={patient.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          {/* 1. Patient Details */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block text-sm">
                              {patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {patient.age}y • {patient.gender} • {patient.phone}
                            </span>
                          </td>

                          {/* 2. Primary Clinician & Inline Transfer Button */}
                          <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                                  {patient.assignedDoctorName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Care Lead
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setReassigningPatient(patient);
                                  const otherDoc = data.doctors.find(d => d.id !== patient.assignedDoctorId);
                                  setReassignTargetDoctorId(otherDoc ? otherDoc.id : '');
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[10.5px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                title="Reassign this patient to another doctor"
                              >
                                <span>⇄</span>
                                <span>Transfer</span>
                              </button>
                            </div>
                          </td>

                          {/* 3. Care Protocol / Pre-Made Template */}
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 max-w-[200px] truncate">
                              <span>📋</span>
                              <span className="truncate">{patient.planName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[200px]">
                              {patient.goal || 'Custom Care Plan'}
                            </span>
                          </td>

                          {/* 4. 7-Day Adherence Score (Tamper-Proof) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                                patient.compliance7d >= 85
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                                  : patient.compliance7d >= 70
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60'
                              }`}>
                                {patient.compliance7d}%
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-400 block mt-0.5 font-medium" title="System calculated strictly from client logs. Zero doctor override.">
                              🔒 Tamper-Proof
                            </span>
                          </td>

                          {/* 5. Dynamic Clinical Biomarker / Trend (Diabetes, PCOS, BP, Gut, Weight) */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 dark:text-white block text-xs">
                              {biomarker?.display || biomarker?.current || '—'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold ${
                                ((biomarker?.trend || biomarker?.change || '').includes('High') || (biomarker?.trend || biomarker?.change || '').includes('Hypertensive'))
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {biomarker?.trend || biomarker?.change || 'Stable'}
                              </span>
                              <span className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">
                                • {biomarker?.metricLabel || biomarker?.name || 'Biomarker'}
                              </span>
                            </div>
                          </td>

                          {/* 6. Triage Status */}
                          <td className="py-3.5 px-4">
                            {patient.needsAttention ? (
                              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1">
                                <span>⚠</span> Needs Attention
                              </span>
                            ) : (
                              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1">
                                <span>✓</span> On Track
                              </span>
                            )}
                          </td>

                          {/* 7. Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={nudge.waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-bold text-xs transition-all shadow-2xs"
                                title="Open WhatsApp Nudge"
                              >
                                <WhatsAppIcon size={12} className="text-emerald-600 dark:text-emerald-400" />
                                <span>WhatsApp</span>
                              </a>
                              <button
                                onClick={() => setSelectedPatient(patient)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                              >
                                Deep Dive ↗
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: 1-Click WhatsApp Doctor Onboarding (Day Theme) ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base border border-emerald-200/50 dark:border-emerald-800/50">
                  <WhatsAppIcon size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Invite Doctor via WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    No manual emails or passwords needed — 1 click WhatsApp onboarding
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!generatedInvite ? (
              <form onSubmit={handleCreateDoctorInvite} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Doctor / Coach Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sameer Khan"
                    value={inviteForm.name}
                    onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specialty / Clinical Role *
                  </label>
                  <select
                    value={inviteForm.specialty}
                    onChange={e => setInviteForm(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {configuredSpecialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Doctor Phone Number (for WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 12345"
                    value={inviteForm.phone}
                    onChange={e => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clinic Branch / Location *
                  </label>
                  <select
                    value={inviteForm.clinicBranch}
                    onChange={e => setInviteForm(prev => ({ ...prev, clinicBranch: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {configuredBranches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <WhatsAppIcon size={14} className="text-white" />
                    <span>Generate WhatsApp Link ➔</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300">Invite Code: {generatedInvite.code}</span>
                    <span className="text-[10.5px] bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full font-bold">1-Click Auto Join</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Doctor will automatically be linked to <strong className="font-bold">{data.org.name}</strong> upon tapping this link.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pre-Filled Message:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{generatedInvite.rawText}"</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <a
                    href={generatedInvite.waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <WhatsAppIcon size={15} className="text-white" />
                    <span>Open in WhatsApp</span>
                  </a>
                  <button
                    onClick={() => handleCopy(generatedInvite.joinUrl)}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {copiedLink ? 'Copied ✓' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Patient Deep Dive (Full Analytics ECharts, Consistency Heatmap with Tune Preferences & Clinical Notes) ── */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedPatient.name}</h2>
                  <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                    {selectedPatient.planName}
                  </span>
                  {selectedPatient.needsAttention && (
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                      ⚠ Attention Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Primary Clinician: <strong className="text-slate-800 dark:text-slate-200">{selectedPatient.assignedDoctorName}</strong> • Goal: {selectedPatient.goal} • Phone: {selectedPatient.phone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={createPatientWhatsAppNudge({
                    patientName: selectedPatient.name,
                    doctorName: selectedPatient.assignedDoctorName,
                    phone: selectedPatient.phone,
                    score: selectedPatient.compliance7d,
                    needsAttention: selectedPatient.needsAttention,
                    customNote: selectedPatient.dailyFocusNote
                  }).waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <WhatsAppIcon size={14} className="text-white" />
                  <span>WhatsApp Nudge</span>
                </a>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Complete Deep Dive with ECharts Spline, Exact Heatmap with Preferences Tune Modal, Day Inspector, and Clinical Notes */}
            <PatientAnalyticsDeepDive
              patient={selectedPatient}
              proName={selectedPatient.assignedDoctorName}
              dailyFocusNote={selectedPatient.dailyFocusNote}
              onSaveDailyFocus={(note) => {
                setData(prev => ({
                  ...prev,
                  patients: prev.patients.map(p => p.id === selectedPatient.id ? { ...p, dailyFocusNote: note } : p)
                }));
                setSelectedPatient(prev => prev ? { ...prev, dailyFocusNote: note } : prev);
              }}
              onWhatsAppNudge={(patientName, note) => {
                const nudge = createPatientWhatsAppNudge({
                  patientName,
                  doctorName: selectedPatient.assignedDoctorName,
                  phone: selectedPatient.phone,
                  score: selectedPatient.compliance7d,
                  needsAttention: selectedPatient.needsAttention,
                  customNote: note
                });
                window.open(nudge.waUrl, '_blank');
              }}
            />
          </div>
        </div>
      )}

      {/* ── MODAL: Add / Assign New Patient (Day Theme) ── */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Add &amp; Assign New Patient
                </h3>
                <p className="text-xs text-slate-500">
                  Assign to Solo Admin Practice or a Team Doctor with a 1-Click WhatsApp Invite
                </p>
              </div>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!generatedPatientInvite ? (
              <form onSubmit={handleCreatePatientSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Rathore"
                    value={patientForm.name}
                    onChange={e => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98990 00000"
                      value={patientForm.phone}
                      onChange={e => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Age &amp; Gender
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Age"
                        value={patientForm.age}
                        onChange={e => setPatientForm(prev => ({ ...prev, age: e.target.value }))}
                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                      <select
                        value={patientForm.gender}
                        onChange={e => setPatientForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Doctor / Coach *
                  </label>
                  <select
                    value={patientForm.assignedDoctorId}
                    onChange={e => setPatientForm(prev => ({ ...prev, assignedDoctorId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {data.doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Care Plan Protocol
                  </label>
                  <select
                    value={patientForm.planName}
                    onChange={e => setPatientForm(prev => ({ ...prev, planName: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="Clinical Metabolic Reset Plan">Clinical Metabolic Reset Plan (Diet &amp; Hydration)</option>
                    <option value="Weight Loss &amp; Fat Reduction Protocol">Weight Loss &amp; Fat Reduction Protocol</option>
                    <option value="Longevity &amp; Cellular Health Protocol">Longevity &amp; Cellular Health Protocol</option>
                    <option value="Strength &amp; Performance Protocol">Strength &amp; Performance Protocol</option>
                    <option value="Stress, Sleep &amp; Cortisol Reset Protocol">Stress, Sleep &amp; Cortisol Reset Protocol</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Goal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sustainable weight loss &amp; metabolic flexibility"
                    value={patientForm.goal}
                    onChange={e => setPatientForm(prev => ({ ...prev, goal: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Create &amp; Generate Invite ➔</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300">Invite Code: {generatedPatientInvite.code}</span>
                    <span className="text-[10.5px] bg-indigo-100 dark:bg-indigo-900/80 px-2 py-0.5 rounded-full font-bold">1-Click Patient Join</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Patient <strong className="font-bold">{patientForm.name}</strong> has been enrolled and assigned to clinician!
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pre-Filled WhatsApp Message:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{generatedPatientInvite.rawText}"</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <a
                    href={generatedPatientInvite.waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <WhatsAppIcon size={14} className="text-white" />
                    <span>Send on WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPatientInvite.joinUrl);
                      setCopiedPatientLink(true);
                      setTimeout(() => setCopiedPatientLink(false), 2000);
                    }}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {copiedPatientLink ? 'Copied ✓' : 'Copy Link'}
                  </button>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => {
                      setShowAddPatientModal(false);
                      setGeneratedPatientInvite(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Reassign Patient Clinician (Day Theme) ── */}
      {reassigningPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-200/50 dark:border-indigo-800/50">
                  <span className="text-lg">⇄</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Reassign Patient Clinician
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer care management to another specialist
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReassigningPatient(null);
                  setReassignTargetDoctorId('');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Patient Summary Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {reassigningPatient.name}
                </span>
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                  {reassigningPatient.planName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Currently assigned to: <strong className="text-slate-800 dark:text-slate-200 font-bold">{reassigningPatient.assignedDoctorName}</strong>
              </p>
            </div>

            {/* Transfer Form */}
            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select New Primary Clinician *
                </label>
                <select
                  value={reassignTargetDoctorId}
                  onChange={e => setReassignTargetDoctorId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                >
                  <option value="" disabled>Choose a doctor...</option>
                  {data.doctors.map(d => (
                    <option key={d.id} value={d.id} disabled={d.id === reassigningPatient.assignedDoctorId}>
                      {d.name} — {d.specialty} ({d.clientCount} active {d.clientCount === 1 ? 'patient' : 'patients'}) {d.id === reassigningPatient.assignedDoctorId ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Patient's historical logs and check-ins will seamlessly appear on the new doctor's dashboard.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setReassigningPatient(null);
                    setReassignTargetDoctorId('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reassignTargetDoctorId || reassignTargetDoctorId === reassigningPatient.assignedDoctorId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>Confirm Reassignment ➔</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Care Protocols Library & Custom Protocol Builder ── */}
      {showProtocolManagerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131722] border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-200/50 dark:border-purple-800/50">
                  <Icon name="assignment" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Clinical Care Protocols Library &amp; Builder
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standardized protocols &amp; custom clinical habit programs across all clinic branches
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProtocolManagerModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form to Add New Protocol */}
            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Create New Custom Protocol</span>
                </span>
                {protocolSuccess && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                    ✓ Protocol Created &amp; Live!
                  </span>
                )}
              </div>

              <form onSubmit={handleCreateProtocol} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Protocol Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProtocolName}
                      onChange={e => setNewProtocolName(e.target.value)}
                      placeholder="e.g. Thyroid & Hypometabolic Reset"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Clinical Biomarker *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProtocolBiomarker}
                      onChange={e => setNewProtocolBiomarker(e.target.value)}
                      placeholder="e.g. Fasting TSH (uIU/mL) & Basal Temp"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Focus / Protocol Objective *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProtocolFocus}
                    onChange={e => setNewProtocolFocus(e.target.value)}
                    placeholder="e.g. T3/T4 conversion support, circadian cortisol balancing, and anti-inflammatory habits"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Icon:</span>
                    {['scale', 'bloodtype', 'female', 'spa', 'favorite', 'bedtime', 'fitness_center', 'shield'].map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setNewProtocolIcon(ic)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${
                          newProtocolIcon === ic 
                            ? 'bg-purple-600 text-white shadow-xs scale-105' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon name={ic} className="text-xs" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>+ Add to Library</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of Active Protocols */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Active Protocol Directory ({protocols.length} Protocols)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {protocols.map(proto => (
                  <div
                    key={proto.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xs">
                          <Icon name={proto.icon || 'shield'} className="text-xs" />
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {proto.name}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                        Active
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {proto.focus}
                    </p>

                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-purple-700 dark:text-purple-400 font-bold">
                      <span>Biomarker:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{proto.biomarker || 'Weight & Habits'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowProtocolManagerModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 dark:border-slate-300 animate-in slide-in-from-bottom-5 duration-200">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">✓</span>
          <span className="text-xs font-bold">{toastMessage}</span>
          <button 
            onClick={() => setShowToast(false)} 
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 ml-2 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
