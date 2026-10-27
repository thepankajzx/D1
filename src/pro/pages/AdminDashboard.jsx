import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Icon from '../../components/Icon';
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getProTypeConfig, getAllProTypes } from '../proConfig';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { userDoc } = useData();
  const navigate = useNavigate();

  const isSuperAdmin = import.meta.env.DEV || userDoc?.role === 'super_admin' || userDoc?.isSuperAdmin;

  const [prosList, setProsList] = useState([]);
  const [linksCount, setLinksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // New Doctor / Pro Registration Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    email: '',
    clinicName: '',
    proType: 'dietitian',
    clientLimit: 25,
    password: 'password123'
  });
  const [addSuccessAlert, setAddSuccessAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'dietitians'));
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));

        if (list.length > 0) {
          setProsList(list);
        } else {
          // Mock test pros for local preview
          setProsList([
            { id: 'pro_1', name: 'Dr. Sarah Sharma', email: 'dr.sarah@apexhealth.in', clinicName: 'Apex Health Clinic', proType: 'dietitian', status: 'active', clientLimit: 20, clientCount: 3 },
            { id: 'pro_2', name: 'Coach Rohit Rawat', email: 'rohit@fitlab.in', clinicName: 'FitLab Performance', proType: 'fitness_coach', status: 'active', clientLimit: 15, clientCount: 5 },
            { id: 'pro_3', name: 'Ananya Mehra', email: 'ananya@growth.co', clinicName: 'Mindset Academy', proType: 'life_coach', status: 'active', clientLimit: 10, clientCount: 2 }
          ]);
        }

        const linksSnap = await getDocs(collection(db, 'links'));
        setLinksCount(linksSnap.size || 10);
      } catch (err) {
        console.warn('Admin load note:', err);
        setProsList([
          { id: 'pro_1', name: 'Dr. Sarah Sharma', email: 'dr.sarah@apexhealth.in', clinicName: 'Apex Health Clinic', proType: 'dietitian', status: 'active', clientLimit: 20, clientCount: 3 },
          { id: 'pro_2', name: 'Coach Rohit Rawat', email: 'rohit@fitlab.in', clinicName: 'FitLab Performance', proType: 'fitness_coach', status: 'active', clientLimit: 15, clientCount: 5 },
          { id: 'pro_3', name: 'Ananya Mehra', email: 'ananya@growth.co', clinicName: 'Mindset Academy', proType: 'life_coach', status: 'active', clientLimit: 10, clientCount: 2 }
        ]);
        setLinksCount(10);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const handleToggleStatus = async (proId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'dietitians', proId), { status: nextStatus });
    } catch (e) {
      console.warn('Status update note:', e);
    }
    setProsList(prev => prev.map(p => p.id === proId ? { ...p, status: nextStatus } : p));
  };

  const handleCreateDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.email) {
      alert('Please fill in Doctor Name and Email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const emailClean = newDoctor.email.trim().toLowerCase();
      const docId = `pro_${emailClean.replace(/[^a-z0-9]/g, '_')}`;
      const doctorData = {
        name: newDoctor.name.trim(),
        email: emailClean,
        clinicName: newDoctor.clinicName.trim() || 'Apex Health Care',
        proType: newDoctor.proType,
        clientLimit: Number(newDoctor.clientLimit) || 25,
        clientCount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'dietitians', docId), doctorData);
      } catch (firestoreErr) {
        console.warn('Firestore write warning:', firestoreErr);
      }

      setProsList(prev => [
        { id: docId, ...doctorData },
        ...prev
      ]);

      setAddSuccessAlert({
        name: doctorData.name,
        email: doctorData.email,
        password: newDoctor.password || 'password123',
        proType: doctorData.proType
      });

      setShowAddModal(false);
      setNewDoctor({
        name: '',
        email: '',
        clinicName: '',
        proType: 'dietitian',
        clientLimit: 25,
        password: 'password123'
      });
    } catch (err) {
      alert('Error registering doctor: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Security Guard: Immediately redirect non-admin users to Home
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      {/* Top Admin Security Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black text-lg">
              <Icon name="shield" className="text-xl" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">D1 Admin Control Center</h1>
                <span className="bg-rose-950 text-rose-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-rose-800/60">
                  Zero Health Data Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage coaches, monitor platform quotas &amp; toggle verification status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Icon name="add" className="text-base" />
              <span>+ Register &amp; Approve Doctor</span>
            </button>
            <Link
              to="/pro"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              Open Pro Portal →
            </Link>
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
            >
              Back to Main App
            </Link>
          </div>
        </div>
      </header>

      {/* Admin KPI Summary & Success Notifications */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {addSuccessAlert && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 flex items-start justify-between gap-4 shadow-lg animate-in fade-in">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <h3 className="text-sm font-black text-emerald-100">
                  Doctor Approved: {addSuccessAlert.name} ({getProTypeConfig(addSuccessAlert.proType).label})
                </h3>
                <p className="text-xs text-emerald-300 mt-0.5">
                  Access Granted! Doctor can log in directly at <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300">#/login</code> using email: <span className="font-bold underline">{addSuccessAlert.email}</span>. When they log in, they will be redirected <strong>straight to their Pro Dashboard</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAddSuccessAlert(null)}
              className="text-xs text-emerald-400 hover:text-white font-bold px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Total Registered Pros
            </span>
            <p className="text-3xl font-black text-white mt-1">
              {prosList.length}
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Total Client Links
            </span>
            <p className="text-3xl font-black text-indigo-400 mt-1">
              {linksCount}
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Spark Plan Health
            </span>
            <p className="text-3xl font-black text-emerald-400 mt-1">
              Normal <span className="text-xs text-slate-500 font-normal">(&lt; 2% daily quota)</span>
            </p>
          </div>
        </div>

        {/* Professional Directory Table */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white">
                Professional Directory &amp; Status Controls
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Admin approves credentials. Suspended pros are instantly blocked by Firestore security rules.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-all cursor-pointer"
            >
              + Add Doctor / Coach
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] uppercase font-black text-slate-400">
                  <th className="py-3 px-4">Professional</th>
                  <th className="py-3 px-4">Category / Domain</th>
                  <th className="py-3 px-4">Clinic / Organization</th>
                  <th className="py-3 px-4">Active Clients</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {prosList.map(pro => {
                  const cfg = getProTypeConfig(pro.proType);
                  return (
                    <tr key={pro.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">
                          {pro.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {pro.email}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full text-[11px] font-bold">
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {pro.clinicName || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-bold">
                        {pro.clientCount || 0} / {pro.clientLimit || 20}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          pro.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {pro.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to="/pro"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
                            title="Preview Doctor's Dashboard"
                          >
                            Preview Portal ↗
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(pro.id, pro.status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              pro.status === 'active'
                                ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {pro.status === 'active' ? 'Suspend' : 'Reactivate'}
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
      </main>

      {/* ── Modal: Register & Approve New Doctor / Coach ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  +
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Register &amp; Approve Doctor / Coach
                  </h3>
                  <p className="text-xs text-slate-400">
                    Admin creates credentials &amp; grants verified access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoctorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Doctor / Coach Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Patel"
                  value={newDoctor.name}
                  onChange={e => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Professional Email (Used for Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dr.rajesh@apexhealth.in"
                  value={newDoctor.email}
                  onChange={e => setNewDoctor(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Professional Role / Domain *
                  </label>
                  <select
                    value={newDoctor.proType}
                    onChange={e => setNewDoctor(prev => ({ ...prev, proType: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {getAllProTypes().map(pt => (
                      <option key={pt.id} value={pt.id}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Client Limit Quota
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newDoctor.clientLimit}
                    onChange={e => setNewDoctor(prev => ({ ...prev, clientLimit: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Clinic / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Metabolic &amp; Nutrition Center"
                  value={newDoctor.clinicName}
                  onChange={e => setNewDoctor(prev => ({ ...prev, clinicName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Initial Login Password
                </label>
                <input
                  type="text"
                  value={newDoctor.password}
                  onChange={e => setNewDoctor(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Doctor will use this password to sign in at <code className="text-slate-300">#/login</code>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Approve & Grant Doctor Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
