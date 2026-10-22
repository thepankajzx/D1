import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/Icon';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import PatientAnalyticsDeepDive from '../components/PatientAnalyticsDeepDive';
import { 
  PRO_TYPES, 
  getProTypeConfig, 
  getAllProTypes 
} from '../proConfig';
import { 
  getProProfile, 
  saveProProfile, 
  getProClients, 
  getClientDays, 
  createInvite, 
  endClientLinkByPro,
  getMockDemoClients 
} from '../services/proService';
import { 
  DEFAULT_DOCTORS, 
  DEFAULT_PATIENTS, 
  DEFAULT_ORG,
  getSavedDoctors,
  getSavedPatients,
  getSavedOrg,
  savePatients,
  createPatientWhatsAppNudge 
} from '../services/orgService';

export default function ProDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Doctor ID query param (defaults to Dr. Sarah or inspected doctor)
  const queryDocId = searchParams.get('doc');
  const fromAdmin = searchParams.get('from') === 'admin' || searchParams.get('from') === 'org';

  // Active Doctor state
  const [selectedDoctorId, setSelectedDoctorId] = useState(queryDocId || 'doc_sarah');
  const [selectedProType, setSelectedProType] = useState('dietitian');
  const [proProfile, setProProfile] = useState({
    name: 'Dr. Sarah Sharma',
    clinicName: `${DEFAULT_ORG.name} • South Delhi Clinic`,
    email: currentUser?.email || 'dr.sarah@apexhealth.in',
    clientLimit: 25,
    status: 'active'
  });

  // Daily Focus Note State
  const [dailyFocusNoteInput, setDailyFocusNoteInput] = useState('');
  const [focusSaveSuccess, setFocusSaveSuccess] = useState(false);

  // UI Navigation
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'client_detail' | 'templates' | 'invites'
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Sync if queryDocId changes
  useEffect(() => {
    if (queryDocId && queryDocId !== selectedDoctorId) {
      setSelectedDoctorId(queryDocId);
    }
  }, [queryDocId]);

  // Data states
  const [clients, setClients] = useState([]);
  const [invites, setInvites] = useState([
    {
      code: 'APEX9-STAR1',
      formattedCode: 'APEX9-STAR1',
      clientLabel: 'Riya (Patient)',
      status: 'redeemed',
      daysValid: 7,
      createdAt: '2026-10-04'
    },
    {
      code: 'DEMO7-STAR8',
      formattedCode: 'DEMO7-STAR8',
      clientLabel: 'Kavita Verma',
      status: 'open',
      daysValid: 7,
      createdAt: '2026-10-09'
    },
    {
      code: 'FIT88-PRO92',
      formattedCode: 'FIT88-PRO92',
      clientLabel: 'Arjun Sen',
      status: 'redeemed',
      daysValid: 14,
      createdAt: '2026-09-28'
    }
  ]);
  const [loading, setLoading] = useState(true);

  // Invite creator modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInviteClientLabel, setNewInviteClientLabel] = useState('');
  const [newInviteDaysValid, setNewInviteDaysValid] = useState(7);
  const [selectedTemplateForInvite, setSelectedTemplateForInvite] = useState(null);
  const [createdInviteCode, setCreatedInviteCode] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Client detail states
  const [clientDetailDays, setClientDetailDays] = useState([]);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Date-wise Clinical Notes History
  const [clinicalNotesList, setClinicalNotesList] = useState([
    {
      id: 'note_1',
      date: '2026-10-11',
      text: 'Patient Riya is adhering consistently to the 8:30 PM dinner window. Water intake consistently > 2.8L. Weight dropped to 71.0 kg (net 2.2 kg reduction). Advised continuing raw salad intake before meals.'
    },
    {
      id: 'note_2',
      date: '2026-10-04',
      text: 'Initial Consultation: Started on Metabolic & Weight Balance Plan. Complained of late-evening snacking cravings. Target 3L hydration set.'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [notesSuccess, setNotesSuccess] = useState(false);

  const typeConfig = getProTypeConfig(selectedProType);

  function getDoctorPatients(docId) {
    const allPatients = getSavedPatients();
    const rawPatients = allPatients.filter(p => p.assignedDoctorId === docId);
    return rawPatients.map(p => ({
      id: p.id,
      clientDisplayName: p.name,
      dietitianName: p.assignedDoctorName,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      status: 'active',
      goal: p.goal,
      planName: p.planName,
      summary: {
        lastLoggedDate: p.lastLoggedDate,
        last7PlanScore: p.compliance7d,
        loggedDaysLast7: p.loggedDaysLast7,
        missedLast3: p.compliance7d < 60,
        planVersion: 1
      },
      needsAttention: p.needsAttention,
      attentionReason: p.attentionReason,
      startingWeight: p.startingWeight,
      currentWeight: p.currentWeight,
      dailyFocusNote: p.dailyFocusNote,
      sampleDays: p.sampleDays,
      clinicalNotes: p.clinicalNotes
    }));
  }

  // Load pro profile and client data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const allDoctors = getSavedDoctors();
      const currentOrg = getSavedOrg();
      const docData = allDoctors.find(d => d.id === selectedDoctorId) || allDoctors[0];
      setProProfile({
        name: docData.name,
        clinicName: `${currentOrg.name} • ${docData.clinicBranch}`,
        email: docData.email,
        clientLimit: 25,
        status: 'active'
      });
      setSelectedProType(docData.proType);
      const docPatients = getDoctorPatients(selectedDoctorId);
      setClients(docPatients);
      setLoading(false);
    }
    loadData();
  }, [selectedDoctorId]);

  // When selecting a client, load their days, notes, and focus
  useEffect(() => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    if (client.sampleDays) {
      setClientDetailDays(client.sampleDays);
      setSelectedDayDetail(client.sampleDays[0] || null);
    }
    if (client.dailyFocusNote) {
      setDailyFocusNoteInput(client.dailyFocusNote);
    } else {
      setDailyFocusNoteInput('');
    }
    if (client.clinicalNotes) {
      setClinicalNotesList(client.clinicalNotes);
    }
  }, [selectedClientId, clients]);

  const handleSaveDailyFocus = (e) => {
    e.preventDefault();
    if (!selectedClientId) return;
    setClients(prev => prev.map(c => c.id === selectedClientId ? { ...c, dailyFocusNote: dailyFocusNoteInput } : c));
    const allPatients = getSavedPatients();
    const updated = allPatients.map(p => p.id === selectedClientId ? { ...p, dailyFocusNote: dailyFocusNoteInput } : p);
    savePatients(updated);
    setFocusSaveSuccess(true);
    setTimeout(() => setFocusSaveSuccess(false), 2500);
  };

  const handleCreateInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      const templateToUse = selectedTemplateForInvite || (typeConfig.templates && typeConfig.templates[0]) || typeConfig.samplePlan;
      const result = await createInvite({
        proUid: currentUser?.uid || 'pro_sarah_apex_01',
        proName: proProfile.name,
        clinicName: proProfile.clinicName,
        proType: selectedProType,
        clientLabel: newInviteClientLabel || 'New Client',
        plan: {
          version: 1,
          ...templateToUse
        },
        daysValid: Number(newInviteDaysValid)
      });

      setCreatedInviteCode(result.code);
      setInvites(prev => [result, ...prev]);
    } catch (err) {
      alert('Error creating invite: ' + err.message);
    }
  };

  const handleAddClinicalNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote = {
      id: `note_${Date.now()}`,
      date: newNoteDate,
      text: newNoteText.trim()
    };

    setClinicalNotesList(prev => [newNote, ...prev]);
    if (selectedClientId) {
      const allPatients = getSavedPatients();
      const updated = allPatients.map(p => {
        if (p.id === selectedClientId) {
          return {
            ...p,
            clinicalNotes: [newNote, ...(p.clinicalNotes || [])]
          };
        }
        return p;
      });
      savePatients(updated);
    }
    setNewNoteText('');
    setNotesSuccess(true);
    setTimeout(() => setNotesSuccess(false), 2500);
  };

  const handleEndClientAccess = async (clientId) => {
    if (!window.confirm('Are you sure you want to end collaboration with this client? They will retain personal habits, but shared data flow will stop immediately.')) {
      return;
    }
    await endClientLinkByPro(clientId);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: 'ended_by_dietitian' } : c));
    setActiveTab('clients');
    setSelectedClientId(null);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-24">
      {/* ── Professional Clean Header (Doctor's Own Isolated Practice) ── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-40">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl shadow-xs border border-indigo-500/20 shrink-0">
                <Icon name="person" className="text-2xl" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {proProfile.name}
                  </h1>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    {typeConfig.badgeText}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {proProfile.clinicName || typeConfig.orgLabel} • {typeConfig.tagline}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {fromAdmin && (
                <Link
                  to="/org-portal"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 font-bold text-xs border border-indigo-800/80 transition-all shadow-2xs"
                  title="Return to B2B Org Admin Portal"
                >
                  <Icon name="arrow_back" className="text-sm" />
                  <span>Org Portal (Admin)</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setCreatedInviteCode(null);
                  setSelectedTemplateForInvite(null);
                  setShowInviteModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Icon name="add" className="text-sm" />
                <span>Invite New {typeConfig.clientLabel}</span>
              </button>

              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                title="Return to Main App"
              >
                <Icon name="arrow_back" className="text-sm" />
                <span>Main App</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Total {typeConfig.clientPlural}
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {clients.length} <span className="text-xs text-slate-400 font-normal">/ {proProfile.clientLimit || 25}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                7-Day Compliance Avg
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                83.4%
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Active Plans
              </span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Needs Attention
              </span>
              <p className="text-2xl font-black text-amber-500 mt-0.5">
                {clients.filter(c => c.needsAttention).length}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 mt-5 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold">
            <button
              onClick={() => { setActiveTab('clients'); setSelectedClientId(null); }}
              className={`pb-3 transition-colors relative cursor-pointer ${
                activeTab === 'clients' 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{typeConfig.clientPlural} ({clients.length})</span>
              {activeTab === 'clients' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            {selectedClientId && (
              <button
                onClick={() => setActiveTab('client_detail')}
                className={`pb-3 transition-colors relative cursor-pointer ${
                  activeTab === 'client_detail' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{selectedClient?.clientDisplayName || 'Client'} Overview</span>
                {activeTab === 'client_detail' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-3 transition-colors relative cursor-pointer ${
                activeTab === 'templates' 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Plan Templates ({typeConfig.templates?.length || 1})</span>
              {activeTab === 'templates' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('invites')}
              className={`pb-3 transition-colors relative cursor-pointer ${
                activeTab === 'invites' 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Invite History ({invites.length})</span>
              {activeTab === 'invites' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── TAB 1: CLIENTS LIST ── */}
        {activeTab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Active {typeConfig.clientPlural} ({clients.length})
              </h2>
              <span className="text-xs text-slate-500">
                Tap any row to inspect consistency heatmap, adherence charts, and clinical notes
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4">{typeConfig.clientLabel} Name</th>
                      <th className="py-3 px-4">7-Day Score</th>
                      <th className="py-3 px-4">Logged Ratio (7d)</th>
                      <th className="py-3 px-4">Last Logged</th>
                      <th className="py-3 px-4">Flags</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {clients.map(client => (
                      <tr 
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setActiveTab('client_detail');
                        }}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center text-xs">
                              {client.clientDisplayName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {client.clientDisplayName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {typeConfig.planLabel} (v{client.summary?.planVersion || 1})
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-sm ${
                              (client.summary?.last7PlanScore || 0) >= 70
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : (client.summary?.last7PlanScore || 0) >= 50
                                ? 'text-amber-500'
                                : 'text-rose-500'
                            }`}>
                              {client.summary?.last7PlanScore ? `${Math.round(client.summary.last7PlanScore)}%` : '—'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {client.summary?.loggedDaysLast7 || 0} / 7 days
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-xs">
                          {client.summary?.lastLoggedDate || 'Not yet'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {client.needsAttention && (
                              <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10.5px] font-bold border border-amber-300/40">
                                🚩 Needs Attention
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                              client.status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {client.status === 'active' ? 'Active' : 'Ended'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={createPatientWhatsAppNudge({
                                patientName: client.clientDisplayName,
                                doctorName: proProfile.name,
                                phone: client.phone,
                                score: client.summary?.last7PlanScore || 80,
                                needsAttention: client.needsAttention,
                                customNote: client.dailyFocusNote
                              }).waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all"
                              title="Send 1-Click WhatsApp Smart Nudge"
                            >
                              <WhatsAppIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
                              <span>WhatsApp</span>
                            </a>
                            <button
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setActiveTab('client_detail');
                              }}
                              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-xs cursor-pointer"
                            >
                              Deep-Dive →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CLIENT DETAIL VIEW (Heatmap, Chart, Habit Breakdown & Date Notes) ── */}
        {activeTab === 'client_detail' && selectedClient && (
          <div className="space-y-6">
            {/* Client Top Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => { setActiveTab('clients'); setSelectedClientId(null); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 mb-2 cursor-pointer"
                >
                  <Icon name="arrow_back" className="text-sm" />
                  <span>Back to all {typeConfig.clientPlural}</span>
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {selectedClient.clientDisplayName}
                  </h2>
                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black px-2.5 py-0.5 rounded-full">
                    Active Plan v{selectedClient.summary?.planVersion || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shared daily data sync • Prescribed habits strictly isolated from personal habits
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={createPatientWhatsAppNudge({
                    patientName: selectedClient.clientDisplayName,
                    doctorName: proProfile.name,
                    phone: selectedClient.phone,
                    score: selectedClient.summary?.last7PlanScore || 80,
                    needsAttention: selectedClient.needsAttention,
                    customNote: dailyFocusNoteInput
                  }).waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                >
                  <WhatsAppIcon size={14} className="text-white" />
                  <span>WhatsApp Nudge</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Print Report
                </button>
                <button
                  onClick={() => handleEndClientAccess(selectedClient.id)}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                >
                  End Collaboration
                </button>
              </div>
            </div>

            {/* Complete Deep-Dive: Trajectory ECharts Curve, Exact Analytics Heatmap with Tune Modal, Day Inspector, Weight Trend & Clinical Notes */}
            <PatientAnalyticsDeepDive
              patient={selectedClient}
              proName={proProfile.name}
              dailyFocusNote={selectedClient.dailyFocusNote}
              onSaveDailyFocus={(note) => {
                setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, dailyFocusNote: note } : c));
              }}
              onWhatsAppNudge={(patientName, note) => {
                const nudge = createPatientWhatsAppNudge({
                  patientName,
                  doctorName: proProfile.name,
                  phone: selectedClient.phone,
                  score: selectedClient.summary?.last7PlanScore || 80,
                  needsAttention: selectedClient.needsAttention,
                  customNote: note
                });
                window.open(nudge.waUrl, '_blank');
              }}
            />
          </div>
        )}

        {/* ── TAB 3: PLAN TEMPLATES (Multiple Pre-built Templates Library) ── */}
        {activeTab === 'templates' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Pre-Built {typeConfig.planLabel} Templates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any pre-configured protocol to instantly assign to clients or customize
                </p>
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(typeConfig.templates || [typeConfig.samplePlan]).map((tmpl) => (
                <div 
                  key={tmpl.id || tmpl.name}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        {tmpl.tag || 'Protocol'}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {tmpl.habits.length} Habits
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {tmpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>

                    {/* Habits Included Pills */}
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {tmpl.habits.map((h, i) => (
                        <span 
                          key={i} 
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            h.avoid 
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {h.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedTemplateForInvite(tmpl);
                        setShowInviteModal(true);
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs text-center"
                    >
                      Use for New Invite →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: INVITES MANAGER (Always Populated with History) ── */}
        {activeTab === 'invites' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Client Invite History
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single-use 10-symbol invite codes for onboarding new {typeConfig.clientPlural}
                </p>
              </div>

              <button
                onClick={() => {
                  setCreatedInviteCode(null);
                  setSelectedTemplateForInvite(null);
                  setShowInviteModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Icon name="add" className="text-sm" />
                <span>Create New Invite Code</span>
              </button>
            </div>

            {/* Invites Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500">
                    <th className="py-3 px-4">Client Label</th>
                    <th className="py-3 px-4">Invite Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {invites.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {inv.clientLabel}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {inv.formattedCode || inv.code}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          inv.status === 'redeemed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {inv.status === 'redeemed' ? 'Redeemed / Linked' : 'Open / Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {inv.createdAt || 'Recent'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const joinUrl = `${window.location.origin}/#/join?code=${inv.code}`;
                            navigator.clipboard.writeText(joinUrl);
                            alert('Invite URL copied to clipboard: ' + joinUrl);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          Copy Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── CREATE INVITE MODAL ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {!createdInviteCode ? (
              <form onSubmit={handleCreateInviteSubmit}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Icon name="link" className="text-indigo-600" />
                    <span>Generate Invite for {typeConfig.clientLabel}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 py-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {typeConfig.clientLabel} Label / First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newInviteClientLabel}
                      onChange={(e) => setNewInviteClientLabel(e.target.value)}
                      placeholder="e.g. Riya, Arjun..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Template to Assign
                    </label>
                    <select
                      value={selectedTemplateForInvite?.name || ''}
                      onChange={(e) => {
                        const found = (typeConfig.templates || []).find(t => t.name === e.target.value);
                        setSelectedTemplateForInvite(found);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {(typeConfig.templates || [typeConfig.samplePlan]).map(t => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.habits.length} Habits)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Invite Validity
                    </label>
                    <select
                      value={newInviteDaysValid}
                      onChange={(e) => setNewInviteDaysValid(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value={7}>7 Days (Standard)</option>
                      <option value={14}>14 Days (Maximum)</option>
                      <option value={3}>3 Days (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Create Invite
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-black">
                    ✓
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Invite Ready!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Send this invite link directly to {newInviteClientLabel}
                  </p>
                </div>

                <div className="my-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                    SINGLE-USE INVITE CODE
                  </span>
                  <span className="font-mono text-2xl font-black tracking-widest text-indigo-600 dark:text-indigo-400">
                    {createdInviteCode.slice(0, 5)}-{createdInviteCode.slice(5)}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const joinUrl = `${window.location.origin}/#/join?code=${createdInviteCode}`;
                      navigator.clipboard.writeText(joinUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Icon name="content_copy" className="text-sm" />
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Direct Link for WhatsApp'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = `Hi ${newInviteClientLabel}, ${proProfile.name} has prepared your ${typeConfig.planLabel} on Definite Habit Tracker.\nTap this link to review & accept your plan: ${window.location.origin}/#/join?code=${createdInviteCode}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <WhatsAppIcon size={15} className="text-white" />
                    <span>Share Directly via WhatsApp</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full mt-3 py-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

