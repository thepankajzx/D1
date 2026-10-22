import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { DEFAULT_ORG, getSavedOrg, getSavedDoctors, saveDoctors } from '../services/orgService';

export default function JoinOrgDoctorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'apex-wellness';
  const code = searchParams.get('code') || 'DOC-9481';

  const org = getSavedOrg();
  const [doctorName, setDoctorName] = useState('Dr. Sarah Sharma');
  const [specialty, setSpecialty] = useState('Clinical Dietitian & Metabolic Lead');
  const [phone, setPhone] = useState('+91 98111 22334');
  const [joined, setJoined] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    setJoined(true);

    const doctors = getSavedDoctors();
    let matchedDoc = doctors.find(d => d.name.toLowerCase() === doctorName.toLowerCase().trim());
    if (!matchedDoc) {
      matchedDoc = {
        id: `doc_${Date.now()}`,
        name: doctorName.trim(),
        specialty: specialty.trim(),
        proType: 'dietitian',
        email: `${doctorName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@apexhealth.in`,
        phone: phone.trim() || '+91 98000 00000',
        clinicBranch: org.branches ? org.branches.split(',')[0].trim() : 'Main Clinic',
        patientIds: [],
        clientCount: 0,
        avgCompliance: 0,
        status: 'active'
      };
      saveDoctors([matchedDoc, ...doctors]);
    }

    localStorage.setItem('user_role', 'doctor');
    localStorage.setItem('active_doctor_id', matchedDoc.id);

    setTimeout(() => {
      navigate(`/pro?doc=${matchedDoc.id}&from=join`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-2xl mx-auto">
          {org.logoText || 'ORG'}
        </div>

        <div>
          <span className="inline-block bg-emerald-950 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-800 mb-2">
            Verified Organization Invitation
          </span>
          <h1 className="text-xl font-black text-white">
            Join {org.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Admin <strong>{org.admin?.name || 'Administrator'}</strong> has invited you to join the clinical care team on Stitch.
          </p>
        </div>

        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Organization:</span>
            <span className="font-bold text-white">{org.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Invite Code:</span>
            <span className="font-mono text-emerald-400 font-bold">{code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Workspace Cloud:</span>
            <span className="text-indigo-300 font-bold">100% Isolated Org Database</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Your Professional Name
            </label>
            <input
              type="text"
              required
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Clinical Specialty
            </label>
            <input
              type="text"
              required
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={joined}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {joined ? 'Connecting to Apex Health...' : 'Accept Invitation & Launch Portal ➔'}
          </button>
        </form>
      </div>
    </div>
  );
}
