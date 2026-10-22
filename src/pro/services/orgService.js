// B2B Multi-Tenant Organization & Solo Coaching Service
// Contains complete realistic enterprise mock dataset:
// 1 Enterprise Org, 1 Admin, 5 Doctors across domains, 15 Patients with 30-day data

import { db } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where 
} from 'firebase/firestore';

// Helper to generate 30-day heatmap records
function generateSampleDays(complianceRate, startWeight = 72.0) {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Determine adherence based on complianceRate
    const rand = Math.random() * 100;
    let status = 'full';
    let planScore = 90;
    
    if (rand > complianceRate) {
      if (rand > complianceRate + 15) {
        status = 'missed';
        planScore = Math.floor(30 + Math.random() * 20);
      } else {
        status = 'partial';
        planScore = Math.floor(60 + Math.random() * 20);
      }
    } else {
      status = 'full';
      planScore = Math.floor(85 + Math.random() * 15);
    }

    const dayWeight = +(startWeight - (30 - i) * 0.07 + (Math.random() * 0.4 - 0.2)).toFixed(1);

    days.push({
      date: dateStr,
      status, // 'full' | 'partial' | 'missed'
      planScore,
      habits: {
        water: {
          name: 'Hydration Target',
          value: status === 'full' ? 3.0 : (status === 'partial' ? 2.0 : 1.2),
          target: 3.0,
          unit: 'L',
          status: status === 'full' ? 'done' : (status === 'partial' ? 'partial' : 'missed')
        },
        dinner: {
          name: 'Dinner Before 8:30 PM',
          value: status === 'full' ? '08:15 PM' : (status === 'partial' ? '08:45 PM' : '10:15 PM'),
          status: status === 'full' ? 'done' : 'missed'
        },
        activity: {
          name: 'Daily Step / Walk Goal',
          value: status === 'full' ? 10200 : (status === 'partial' ? 6500 : 3200),
          target: 10000,
          unit: 'steps',
          status: status === 'full' ? 'done' : 'partial'
        },
        veggies: {
          name: 'Vegetable Portions',
          value: status === 'full' ? 5 : (status === 'partial' ? 3 : 1),
          target: 5,
          unit: 'servings',
          status: status === 'full' ? 'done' : 'partial'
        }
      },
      metrics: {
        weight: dayWeight
      }
    });
  }
  return days;
}

// 1. Master Organization Details
export const DEFAULT_ORG = {
  id: 'org_apex_wellness',
  name: 'Apex Healthcare & Corporate Wellness Network',
  slug: 'apex-wellness',
  logoText: 'APEX',
  branches: 'South Delhi Clinic, Bandra West, Online Care, Corporate HQ',
  specialty: 'Clinical Nutrition, PCOS & Metabolic Medicine',
  admin: {
    id: 'admin_priya',
    name: 'Priya Nambiar',
    designation: 'Chief Wellness Director & HR Lead',
    email: 'admin.priya@apexhealth.in',
    phone: '+91 98765 43210'
  },
  planTier: 'Enterprise Multi-Clinic (Unlimited Doctors)',
  activeHabitProtocols: 8,
  patientCapacity: 500,
  licenseStatus: 'Active Annual Enterprise License',
  renewalDate: 'March 2027',
  createdAt: '2026-08-15'
};

export function getSavedOrg() {
  try {
    const raw = localStorage.getItem('active_org');
    if (raw) {
      const parsed = JSON.parse(raw);
      const adminObj = (typeof parsed.admin === 'object' && parsed.admin !== null)
        ? { ...DEFAULT_ORG.admin, ...parsed.admin }
        : { ...DEFAULT_ORG.admin, name: typeof parsed.admin === 'string' ? parsed.admin : DEFAULT_ORG.admin.name };

      return {
        ...DEFAULT_ORG,
        ...parsed,
        admin: adminObj,
        planTier: parsed.planTier || DEFAULT_ORG.planTier,
        branches: parsed.branches || DEFAULT_ORG.branches,
        specialty: parsed.specialty || DEFAULT_ORG.specialty
      };
    }
  } catch (e) {}
  return DEFAULT_ORG;
}

export function saveOrg(orgData) {
  try {
    const prev = getSavedOrg();
    const updated = { ...prev, ...orgData };
    localStorage.setItem('active_org', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return DEFAULT_ORG;
  }
}

export function getSavedDoctors() {
  try {
    const raw = localStorage.getItem('active_doctors');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_DOCTORS;
}

export function saveDoctors(doctorsList) {
  try {
    localStorage.setItem('active_doctors', JSON.stringify(doctorsList));
    return doctorsList;
  } catch (e) {
    return DEFAULT_DOCTORS;
  }
}

export function getSavedPatients() {
  try {
    const raw = localStorage.getItem('active_patients');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_PATIENTS;
}

export function savePatients(patientsList) {
  try {
    localStorage.setItem('active_patients', JSON.stringify(patientsList));
    return patientsList;
  } catch (e) {
    return DEFAULT_PATIENTS;
  }
}

export function resetOrgToDefault() {
  localStorage.removeItem('active_org');
  localStorage.removeItem('active_doctors');
  localStorage.removeItem('active_patients');
  return { org: DEFAULT_ORG, doctors: DEFAULT_DOCTORS, patients: DEFAULT_PATIENTS };
}

// Pre-made clinical templates
export const PRE_MADE_TEMPLATES = [
  { id: 'tmpl_metabolic', name: 'Weight & Metabolic Balance Plan', focus: 'Insulin Sensitivity & Fat Loss', icon: 'scale', biomarker: 'Body Weight Trend' },
  { id: 'tmpl_glucose', name: 'Pre-Diabetes & Glucose Balance', focus: 'HbA1c & Glucose Spike Control', icon: 'bloodtype', biomarker: 'Fasting Blood Sugar' },
  { id: 'tmpl_pcos', name: 'PCOS & Hormonal Health Protocol', focus: 'Androgens & Ovulation Rhythm', icon: 'female', biomarker: 'PCOS Cycle & Hormones' },
  { id: 'tmpl_gut', name: 'Gut Health & Anti-Inflammatory Routine', focus: 'Microbiome & Elimination', icon: 'spa', biomarker: 'Gut Microbiome Index' },
  { id: 'tmpl_dash', name: 'DASH Heart Health Protocol', focus: 'Sodium, Arteries & Blood Pressure', icon: 'favorite', biomarker: 'Blood Pressure' },
  { id: 'tmpl_sleep', name: 'Corporate Wellness & Sleep Hygiene', focus: 'Circadian Sync & Cortisol Reset', icon: 'bedtime', biomarker: 'Deep Sleep & HRV' },
  { id: 'tmpl_protein', name: 'High-Protein Clean Nutrition Protocol', focus: 'Lean Mass & Muscle Protein', icon: 'fitness_center', biomarker: 'Lean Muscle Mass' },
  { id: 'tmpl_longevity', name: 'Solo Practice Longevity & Metabolic Protocol', focus: 'Cellular Health & Habits', icon: 'shield', biomarker: 'Biological Age Index' }
];

export function getSavedProtocols() {
  try {
    const raw = localStorage.getItem('active_protocols');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return PRE_MADE_TEMPLATES;
}

export function saveProtocol(newProtocol) {
  try {
    const current = getSavedProtocols();
    const id = newProtocol.id || `tmpl_custom_${Date.now()}`;
    const formatted = {
      id,
      name: newProtocol.name || 'Custom Care Protocol',
      focus: newProtocol.focus || 'Target Habits & Biomarkers',
      icon: newProtocol.icon || 'shield',
      biomarker: newProtocol.biomarker || 'Clinical Biomarker',
      assignedDoctorIds: newProtocol.assignedDoctorIds || []
    };
    const updated = [...current.filter(p => p.id !== id), formatted];
    localStorage.setItem('active_protocols', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return PRE_MADE_TEMPLATES;
  }
}

// Helper to determine clinical biomarker per condition / template
export function getPatientBiomarker(patient) {
  if (!patient) {
    return {
      name: 'Biomarker',
      metricLabel: 'Biomarker',
      current: '—',
      display: '—',
      change: '—',
      trend: 'Normal',
      status: 'positive',
      icon: 'scale',
      unit: '',
      numericValue: 0
    };
  }

  if (patient.primaryBiomarker && typeof patient.primaryBiomarker === 'object') {
    const pb = patient.primaryBiomarker;
    return {
      ...pb,
      name: pb.name || pb.metricLabel || 'Biomarker',
      metricLabel: pb.metricLabel || pb.name || 'Biomarker',
      current: pb.current || pb.display || '—',
      display: pb.display || pb.current || '—',
      change: pb.change || pb.trend || 'Stable',
      trend: pb.trend || pb.change || 'Stable',
      status: pb.status || 'positive',
      icon: pb.icon || 'scale',
      unit: pb.unit || '',
      numericValue: typeof pb.numericValue === 'number' ? pb.numericValue : 0
    };
  }

  const plan = (patient.planName || patient.goal || '').toLowerCase();
  
  if (plan.includes('diabetes') || plan.includes('glucose') || plan.includes('sugar')) {
    return {
      name: 'Fasting Blood Sugar',
      metricLabel: 'Fasting Blood Sugar',
      current: '118 mg/dL',
      display: '118 mg/dL',
      change: '↓ 20 mg/dL (Controlled)',
      trend: 'Controlled (-20 mg/dL)',
      status: 'positive',
      icon: 'bloodtype',
      unit: 'mg/dL',
      numericValue: 118
    };
  }
  if (plan.includes('pcos') || plan.includes('hormon')) {
    return {
      name: 'PCOS Cycle & Hormones',
      metricLabel: 'PCOS Cycle & Hormones',
      current: '29-Day Cycle',
      display: '29-Day Cycle',
      change: 'Ovulatory cycle synced',
      trend: 'Synced (Ovulatory)',
      status: 'positive',
      icon: 'female',
      unit: 'days',
      numericValue: 29
    };
  }
  if (plan.includes('gut') || plan.includes('digest')) {
    const isAttn = patient.needsAttention;
    return {
      name: 'Gut Microbiome Index',
      metricLabel: 'Gut Microbiome Index',
      current: isAttn ? '6.5 / 10' : '1.8 / 10',
      display: isAttn ? '6.5 / 10' : '1.8 / 10',
      change: isAttn ? '⚠ Bloating reported' : 'Gut motility balanced',
      trend: isAttn ? 'High Bloating Reported' : 'Balanced motility',
      status: isAttn ? 'warning' : 'positive',
      icon: 'spa',
      unit: '/10',
      numericValue: isAttn ? 6.5 : 1.8
    };
  }
  if (plan.includes('dash') || plan.includes('hypertension') || plan.includes('bp') || plan.includes('cardio') || plan.includes('heart')) {
    return {
      name: 'Blood Pressure',
      metricLabel: 'Blood Pressure',
      current: '124/82 mmHg',
      display: '124/82 mmHg',
      change: 'Normotensive tier',
      trend: 'Normotensive tier',
      status: 'positive',
      icon: 'favorite',
      unit: 'mmHg',
      numericValue: 124
    };
  }
  if (plan.includes('sleep') || plan.includes('burnout') || plan.includes('stress')) {
    return {
      name: 'Deep Sleep & HRV',
      metricLabel: 'Deep Sleep & HRV',
      current: '7.4 hrs',
      display: '7.4 hrs',
      change: '+1.4 hrs latency gain',
      trend: '+1.4 hrs latency gain',
      status: 'positive',
      icon: 'bedtime',
      unit: 'hrs',
      numericValue: 7.4
    };
  }
  if (plan.includes('strength') || plan.includes('protein') || plan.includes('muscle')) {
    return {
      name: 'Lean Muscle Mass',
      metricLabel: 'Lean Muscle Mass',
      current: `${patient.currentWeight || 65.4} kg`,
      display: `${patient.currentWeight || 65.4} kg`,
      change: '+1.4 kg lean gain',
      trend: '+1.4 kg lean gain',
      status: 'positive',
      icon: 'fitness_center',
      unit: 'kg',
      numericValue: patient.currentWeight || 65.4
    };
  }

  // Default: Weight
  const diff = +((patient.startingWeight || 72) - (patient.currentWeight || 70)).toFixed(1);
  const diffStr = diff >= 0 ? `↓ ${diff} kg progress` : `+ ${Math.abs(diff)} kg`;
  return {
    name: 'Body Weight Trend',
    metricLabel: 'Body Weight Trend',
    current: `${patient.currentWeight || 71.0} kg`,
    display: `${patient.currentWeight || 71.0} kg`,
    change: diffStr,
    trend: diffStr,
    status: diff >= 0 ? 'positive' : 'warning',
    icon: 'scale',
    unit: 'kg',
    numericValue: patient.currentWeight || 71.0
  };
}

// Templates assigned to a doctor
export function getDoctorTemplates(doctor) {
  if (!doctor) return [PRE_MADE_TEMPLATES[0]];
  const docId = doctor.id;
  let templateIds = [];
  if (docId === 'doc_admin') templateIds = ['tmpl_longevity', 'tmpl_metabolic'];
  else if (docId === 'doc_sarah') templateIds = ['tmpl_metabolic', 'tmpl_gut', 'tmpl_protein'];
  else if (docId === 'doc_rajesh') templateIds = ['tmpl_glucose', 'tmpl_dash'];
  else if (docId === 'doc_rohit') templateIds = ['tmpl_protein', 'tmpl_metabolic'];
  else if (docId === 'doc_ananya') templateIds = ['tmpl_pcos', 'tmpl_metabolic'];
  else if (docId === 'doc_vikram') templateIds = ['tmpl_sleep', 'tmpl_metabolic'];
  else {
    const spec = (doctor.specialty || '').toLowerCase();
    if (spec.includes('pcos')) templateIds = ['tmpl_pcos'];
    else if (spec.includes('strength') || spec.includes('coach')) templateIds = ['tmpl_protein'];
    else if (spec.includes('lifestyle') || spec.includes('physician')) templateIds = ['tmpl_glucose', 'tmpl_dash'];
    else templateIds = ['tmpl_metabolic'];
  }
  return templateIds
    .map(id => PRE_MADE_TEMPLATES.find(t => t.id === id))
    .filter(Boolean);
}

// Reassign patient to a new doctor
export function reassignPatientDoctor({ patientId, newDoctorId }) {
  const doctors = getSavedDoctors();
  const patients = getSavedPatients();

  const newDoc = doctors.find(d => d.id === newDoctorId);
  if (!newDoc) return null;

  let oldDocId = null;

  // Update patient
  const updatedPatients = patients.map(p => {
    if (p.id === patientId) {
      oldDocId = p.assignedDoctorId;
      return {
        ...p,
        assignedDoctorId: newDoc.id,
        assignedDoctorName: newDoc.name,
        clinicalNotes: [
          ...(p.clinicalNotes || []),
          {
            id: `cn_trans_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            text: `Care protocol transferred to ${newDoc.name} (${newDoc.specialty}) by Apex Administrator.`
          }
        ]
      };
    }
    return p;
  });

  // Update doctors counts & patientIds
  const updatedDoctors = doctors.map(d => {
    if (d.id === newDoc.id) {
      const pIds = Array.from(new Set([...(d.patientIds || []), patientId]));
      return {
        ...d,
        patientIds: pIds,
        clientCount: pIds.length
      };
    }
    if (d.id === oldDocId) {
      const pIds = (d.patientIds || []).filter(id => id !== patientId);
      return {
        ...d,
        patientIds: pIds,
        clientCount: pIds.length
      };
    }
    return d;
  });

  savePatients(updatedPatients);
  saveDoctors(updatedDoctors);

  return {
    updatedPatients,
    updatedDoctors,
    transferredPatient: updatedPatients.find(p => p.id === patientId),
    newDoctor: newDoc
  };
}

// 2. 5-6 Doctors across Specialties
export const DEFAULT_DOCTORS = [
  {
    id: 'doc_admin',
    name: 'Priya Nambiar (Admin / Solo Practice)',
    specialty: 'Executive Wellness & Direct Coaching',
    proType: 'wellness_lead',
    email: 'admin.priya@apexhealth.in',
    phone: '+91 98765 43210',
    clinicBranch: 'Apex HQ Executive Suite',
    patientIds: ['p_kavish'],
    clientCount: 1,
    avgCompliance: 86.5,
    status: 'active'
  },
  {
    id: 'doc_sarah',
    name: 'Dr. Sarah Sharma',
    specialty: 'Clinical Dietitian & Metabolic Lead',
    proType: 'dietitian',
    email: 'dr.sarah@apexhealth.in',
    phone: '+91 98111 22334',
    clinicBranch: 'South Delhi Clinic',
    patientIds: ['p_riya', 'p_kavita', 'p_arjun', 'p_rohan'],
    clientCount: 4,
    avgCompliance: 84.8,
    status: 'active'
  },
  {
    id: 'doc_rajesh',
    name: 'Dr. Rajesh Patel',
    specialty: 'Metabolic & Lifestyle Physician',
    proType: 'dietitian',
    email: 'dr.rajesh@apexhealth.in',
    phone: '+91 98222 33445',
    clinicBranch: 'Mumbai Central Center',
    patientIds: ['p_sneha', 'p_priya_d', 'p_amit'],
    clientCount: 3,
    avgCompliance: 81.2,
    status: 'active'
  },
  {
    id: 'doc_rohit',
    name: 'Coach Rohit Rawat',
    specialty: 'Strength & Performance Coach',
    proType: 'fitness_coach',
    email: 'coach.rohit@apexhealth.in',
    phone: '+91 98333 44556',
    clinicBranch: 'Bangalore Sports Hub',
    patientIds: ['p_vikas', 'p_neha', 'p_rahul'],
    clientCount: 3,
    avgCompliance: 88.0,
    status: 'active'
  },
  {
    id: 'doc_ananya',
    name: 'Dr. Ananya Sen',
    specialty: 'PCOS & Hormonal Health Specialist',
    proType: 'dietitian',
    email: 'dr.ananya@apexhealth.in',
    phone: '+91 98444 55667',
    clinicBranch: 'Kolkata Wellness Clinic',
    patientIds: ['p_pooja', 'p_karan', 'p_meera'],
    clientCount: 3,
    avgCompliance: 80.5,
    status: 'active'
  },
  {
    id: 'doc_vikram',
    name: 'Coach Vikram Malhotra',
    specialty: 'Executive Stress & Recovery Coach',
    proType: 'wellness_lead',
    email: 'coach.vikram@apexhealth.in',
    phone: '+91 98555 66778',
    clinicBranch: 'Gurgaon Corporate Wing',
    patientIds: ['p_sunita', 'p_deepak'],
    clientCount: 2,
    avgCompliance: 83.5,
    status: 'active'
  }
];

// 3. 15 Patients with full 30-day compliance, weight curves, and clinical consultation records
export const DEFAULT_PATIENTS = [
  // --- Doctor Sarah's 4 Patients ---
  {
    id: 'p_riya',
    name: 'Riya Malhotra',
    age: 28,
    gender: 'Female',
    phone: '+91 98990 11001',
    assignedDoctorId: 'doc_sarah',
    assignedDoctorName: 'Dr. Sarah Sharma',
    goal: 'Weight Loss & Insulin Balance',
    planName: 'Weight & Metabolic Balance Plan',
    compliance7d: 88.5,
    compliance30d: 85.0,
    loggedDaysLast7: 7,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 73.2,
    currentWeight: 71.0,
    dailyFocusNote: 'Finish dinner by 8:15 PM tonight. Keep raw vegetable salad portion generous.',
    sampleDays: generateSampleDays(88, 73.2),
    clinicalNotes: [
      { id: 'cn_1', date: '2026-10-11', text: 'Adherence strong. Net 2.2 kg reduction. Advised continuing raw salad intake.' },
      { id: 'cn_2', date: '2026-10-04', text: 'Initial consultation: Late evening cravings reported. Target 3L water set.' }
    ]
  },
  {
    id: 'p_kavita',
    name: 'Kavita Verma',
    age: 34,
    gender: 'Female',
    phone: '+91 98990 11002',
    assignedDoctorId: 'doc_sarah',
    assignedDoctorName: 'Dr. Sarah Sharma',
    goal: 'Digestive Reset & Post-Pregnancy Fitness',
    planName: 'Gut Health & Anti-Inflammatory Routine',
    compliance7d: 48.0,
    compliance30d: 54.0,
    loggedDaysLast7: 2,
    lastLoggedDate: '2026-10-08',
    needsAttention: true,
    attentionReason: 'Missed logging for past 3 consecutive days; water intake dropped to 1.2L',
    startingWeight: 68.5,
    currentWeight: 67.9,
    dailyFocusNote: 'Please restart morning warm water lemon routine today and check in on WhatsApp.',
    sampleDays: generateSampleDays(50, 68.5),
    clinicalNotes: [
      { id: 'cn_3', date: '2026-10-08', text: 'Struggling with workday routine consistency. Requested 15-min call.' }
    ]
  },
  {
    id: 'p_arjun',
    name: 'Arjun Kapoor',
    age: 31,
    gender: 'Male',
    phone: '+91 98990 11003',
    assignedDoctorId: 'doc_sarah',
    assignedDoctorName: 'Dr. Sarah Sharma',
    goal: 'Metabolic Health & Fatty Liver Reversal',
    planName: 'Weight & Metabolic Balance Plan',
    compliance7d: 94.0,
    compliance30d: 91.5,
    loggedDaysLast7: 7,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 84.0,
    currentWeight: 80.8,
    dailyFocusNote: 'Excellent fatty liver recovery pace. 10k steps maintained for 14 straight days.',
    sampleDays: generateSampleDays(93, 84.0),
    clinicalNotes: [
      { id: 'cn_4', date: '2026-10-10', text: 'Liver enzyme profile updated. Triglycerides down 18%. Excellent adherence.' }
    ]
  },
  {
    id: 'p_rohan',
    name: 'Rohan Mehra',
    age: 26,
    gender: 'Male',
    phone: '+91 98990 11004',
    assignedDoctorId: 'doc_sarah',
    assignedDoctorName: 'Dr. Sarah Sharma',
    goal: 'Lean Bulking & Clean Digestion',
    planName: 'High-Protein Clean Nutrition Protocol',
    compliance7d: 82.0,
    compliance30d: 79.0,
    loggedDaysLast7: 6,
    lastLoggedDate: '2026-10-10',
    needsAttention: false,
    startingWeight: 64.0,
    currentWeight: 65.4,
    dailyFocusNote: 'Keep consuming 4 boiled eggs + paneer portion at breakfast.',
    sampleDays: generateSampleDays(81, 64.0),
    clinicalNotes: [
      { id: 'cn_5', date: '2026-10-05', text: 'Targeting 2500 clean calories. Digestion normal.' }
    ]
  },

  // --- Doctor Rajesh's 3 Patients ---
  {
    id: 'p_sneha',
    name: 'Sneha Gupta',
    age: 42,
    gender: 'Female',
    phone: '+91 98990 11005',
    assignedDoctorId: 'doc_rajesh',
    assignedDoctorName: 'Dr. Rajesh Patel',
    goal: 'Type 2 Diabetes HbA1c Management',
    planName: 'Pre-Diabetes & Glucose Balance',
    compliance7d: 76.0,
    compliance30d: 74.5,
    loggedDaysLast7: 5,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 76.5,
    currentWeight: 74.8,
    dailyFocusNote: 'Post-lunch 15-minute slow walk is mandatory to blunt glucose spikes.',
    sampleDays: generateSampleDays(76, 76.5),
    clinicalNotes: [
      { id: 'cn_6', date: '2026-10-09', text: 'Fasting blood sugar stabilized from 138 to 118. Continue walking habit.' }
    ]
  },
  {
    id: 'p_priya_d',
    name: 'Priya Deshmukh',
    age: 38,
    gender: 'Female',
    phone: '+91 98990 11006',
    assignedDoctorId: 'doc_rajesh',
    assignedDoctorName: 'Dr. Rajesh Patel',
    goal: 'Hypertension & Sodium Reduction',
    planName: 'DASH Heart Health Protocol',
    compliance7d: 89.0,
    compliance30d: 86.0,
    loggedDaysLast7: 7,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 70.0,
    currentWeight: 68.2,
    dailyFocusNote: 'Keep sodium under 2g today. Fresh coconut water permitted.',
    sampleDays: generateSampleDays(88, 70.0),
    clinicalNotes: [
      { id: 'cn_7', date: '2026-10-07', text: 'BP reads 124/82 consistently. Great progress with mindful meal salt control.' }
    ]
  },
  {
    id: 'p_amit',
    name: 'Amit Singhal',
    age: 49,
    gender: 'Male',
    phone: '+91 98990 11007',
    assignedDoctorId: 'doc_rajesh',
    assignedDoctorName: 'Dr. Rajesh Patel',
    goal: 'Uric Acid & Joint Inflammation Reduction',
    planName: 'Anti-Inflammatory Purine Restriction Plan',
    compliance7d: 58.0,
    compliance30d: 62.0,
    loggedDaysLast7: 3,
    lastLoggedDate: '2026-10-09',
    needsAttention: true,
    attentionReason: 'Weekend logging lapses; reported mild toe joint discomfort',
    startingWeight: 86.0,
    currentWeight: 85.1,
    dailyFocusNote: 'Strictly avoid red meat and dal makhani this weekend. Maintain 3.5L water.',
    sampleDays: generateSampleDays(60, 86.0),
    clinicalNotes: [
      { id: 'cn_8', date: '2026-10-06', text: 'Uric acid level 7.8. Hydration and cherry juice advised.' }
    ]
  },

  // --- Coach Rohit's 3 Patients ---
  {
    id: 'p_vikas',
    name: 'Vikas Nair',
    age: 29,
    gender: 'Male',
    phone: '+91 98990 11008',
    assignedDoctorId: 'doc_rohit',
    assignedDoctorName: 'Coach Rohit Rawat',
    goal: 'Fat Loss & 10k Steps Daily',
    planName: 'Hypertrophy & Mobility Daily Routine',
    compliance7d: 96.0,
    compliance30d: 92.0,
    loggedDaysLast7: 7,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 82.0,
    currentWeight: 78.4,
    dailyFocusNote: 'Today is Leg day + 15 min mobility stretches. Hit your 150g protein goal.',
    sampleDays: generateSampleDays(95, 82.0),
    clinicalNotes: [
      { id: 'cn_9', date: '2026-10-11', text: 'Squat form reviewed on video. Excellent depth and knee tracking.' }
    ]
  },
  {
    id: 'p_neha',
    name: 'Neha Chawla',
    age: 27,
    gender: 'Female',
    phone: '+91 98990 11009',
    assignedDoctorId: 'doc_rohit',
    assignedDoctorName: 'Coach Rohit Rawat',
    goal: 'Strength Building & Posture Correction',
    planName: 'Daily Mobility & Core Stability',
    compliance7d: 92.0,
    compliance30d: 89.0,
    loggedDaysLast7: 7,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 58.0,
    currentWeight: 57.2,
    dailyFocusNote: 'Do 3 sets of dead hangs and bird-dog core holds between meetings.',
    sampleDays: generateSampleDays(91, 58.0),
    clinicalNotes: [
      { id: 'cn_10', date: '2026-10-08', text: 'Upper back tightness significantly reduced after 2 weeks of thoracic mobility.' }
    ]
  },
  {
    id: 'p_rahul',
    name: 'Rahul Bajaj',
    age: 35,
    gender: 'Male',
    phone: '+91 98990 11010',
    assignedDoctorId: 'doc_rohit',
    assignedDoctorName: 'Coach Rohit Rawat',
    goal: 'Marathon 10K Endurance Base',
    planName: 'Cardio & Aerobic Endurance Routine',
    compliance7d: 74.0,
    compliance30d: 72.0,
    loggedDaysLast7: 5,
    lastLoggedDate: '2026-10-10',
    needsAttention: false,
    startingWeight: 75.0,
    currentWeight: 73.6,
    dailyFocusNote: 'Zone 2 heart rate run for 40 minutes. Keep breathing nasal if possible.',
    sampleDays: generateSampleDays(73, 75.0),
    clinicalNotes: [
      { id: 'cn_11', date: '2026-10-04', text: 'Pacing cadence 165 spm. Advised calf foam rolling.' }
    ]
  },

  // --- Doctor Ananya's 3 Patients ---
  {
    id: 'p_pooja',
    name: 'Pooja Aggarwal',
    age: 26,
    gender: 'Female',
    phone: '+91 98990 11011',
    assignedDoctorId: 'doc_ananya',
    assignedDoctorName: 'Dr. Ananya Sen',
    goal: 'PCOS Cycle Regularity & Skin Health',
    planName: 'PCOS & Hormonal Health Protocol',
    compliance7d: 86.0,
    compliance30d: 83.0,
    loggedDaysLast7: 6,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 67.0,
    currentWeight: 65.1,
    dailyFocusNote: 'Drink 2 cups spearmint tea and avoid packaged dairy snacks today.',
    sampleDays: generateSampleDays(85, 67.0),
    clinicalNotes: [
      { id: 'cn_12', date: '2026-10-10', text: 'Cycle resumed after 45 days. Inflammatory acne reduced. Superb progress.' }
    ]
  },
  {
    id: 'p_karan',
    name: 'Karan Malhotra',
    age: 33,
    gender: 'Male',
    phone: '+91 98990 11012',
    assignedDoctorId: 'doc_ananya',
    assignedDoctorName: 'Dr. Ananya Sen',
    goal: 'Thyroid Hypo Management & Fatigue Relief',
    planName: 'Thyroid Support & Circadian Energy Plan',
    compliance7d: 80.0,
    compliance30d: 78.0,
    loggedDaysLast7: 6,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 81.0,
    currentWeight: 79.5,
    dailyFocusNote: 'Take morning thyroid med on empty stomach 45 mins before first water.',
    sampleDays: generateSampleDays(79, 81.0),
    clinicalNotes: [
      { id: 'cn_13', date: '2026-10-03', text: 'Afternoon brain fog decreasing. Afternoon sunlight exposure recommended.' }
    ]
  },
  {
    id: 'p_meera',
    name: 'Meera Joshi',
    age: 30,
    gender: 'Female',
    phone: '+91 98990 11013',
    assignedDoctorId: 'doc_ananya',
    assignedDoctorName: 'Dr. Ananya Sen',
    goal: 'Cortisol Balancing & Stress Weight Loss',
    planName: 'PCOS & Hormonal Health Protocol',
    compliance7d: 91.0,
    compliance30d: 88.0,
    loggedDaysLast7: 7,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 63.5,
    currentWeight: 61.8,
    dailyFocusNote: '10 min 4-7-8 breathwork before sleeping. No screens after 10 PM.',
    sampleDays: generateSampleDays(90, 63.5),
    clinicalNotes: [
      { id: 'cn_14', date: '2026-10-07', text: 'Sleep quality score improved to 8.2/10. Weight down 1.7 kg.' }
    ]
  },

  // --- Coach Vikram's 2 Patients ---
  {
    id: 'p_sunita',
    name: 'Sunita Rao',
    age: 46,
    gender: 'Female',
    phone: '+91 98990 11014',
    assignedDoctorId: 'doc_vikram',
    assignedDoctorName: 'Coach Vikram Malhotra',
    goal: 'Workplace Burnout Recovery & Daily Deep Sleep',
    planName: 'Corporate Wellness & Sleep Hygiene',
    compliance7d: 78.0,
    compliance30d: 76.0,
    loggedDaysLast7: 5,
    lastLoggedDate: '2026-10-10',
    needsAttention: false,
    startingWeight: 66.0,
    currentWeight: 65.2,
    dailyFocusNote: 'Block 20 minutes lunch break away from laptop and notifications.',
    sampleDays: generateSampleDays(77, 66.0),
    clinicalNotes: [
      { id: 'cn_15', date: '2026-10-06', text: 'Reported falling asleep in under 20 mins. Magnesium glycinate routine working.' }
    ]
  },
  {
    id: 'p_deepak',
    name: 'Deepak Khurana',
    age: 52,
    gender: 'Male',
    phone: '+91 98990 11015',
    assignedDoctorId: 'doc_vikram',
    assignedDoctorName: 'Coach Vikram Malhotra',
    goal: 'Executive Cardiovascular Fitness & Stamina',
    planName: 'Corporate Wellness & Stamina Protocol',
    compliance7d: 84.0,
    compliance30d: 82.5,
    loggedDaysLast7: 6,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 88.0,
    currentWeight: 85.5,
    dailyFocusNote: 'Hit morning 45-min brisk walk before flight. Stay hydrated in transit.',
    sampleDays: generateSampleDays(83, 88.0),
    clinicalNotes: [
      { id: 'cn_16', date: '2026-10-08', text: 'Resting heart rate down from 78 to 71 bpm. Cardio capacity noticeably higher.' }
    ]
  },
  // --- Admin Solo Practice Patient ---
  {
    id: 'p_kavish',
    name: 'Kavish Singhal',
    age: 38,
    gender: 'Male',
    phone: '+91 98990 11016',
    assignedDoctorId: 'doc_admin',
    assignedDoctorName: 'Priya Nambiar (Admin / Solo Practice)',
    goal: 'Executive Longevity & Habit Mastery',
    planName: 'Solo Practice Longevity & Metabolic Protocol',
    compliance7d: 86.5,
    compliance30d: 85.0,
    loggedDaysLast7: 6,
    lastLoggedDate: '2026-10-11',
    needsAttention: false,
    startingWeight: 76.5,
    currentWeight: 74.2,
    dailyFocusNote: 'Ensure 20 mins post-dinner stroll and zero blue light 45 mins before sleep.',
    sampleDays: generateSampleDays(86, 76.5),
    clinicalNotes: [
      { id: 'cn_admin_1', date: '2026-10-10', text: 'Solo practice onboarding review: High compliance with early dinner and morning hydration.' }
    ]
  }
];

/**
 * Get organization overview with computed stats
 */
export function getOrgDashboardData(orgId = 'org_apex_wellness') {
  const doctors = getSavedDoctors();
  const patients = getSavedPatients();

  const totalPatients = patients.length;
  const totalDoctors = doctors.length;
  
  const avgCompliance = +(
    patients.reduce((sum, p) => sum + p.compliance7d, 0) / totalPatients
  ).toFixed(1);

  const needsAttentionCount = patients.filter(p => p.needsAttention).length;
  const onTrackCount = totalPatients - needsAttentionCount;

  return {
    org: getSavedOrg(),
    doctors,
    patients,
    stats: {
      totalDoctors,
      totalPatients,
      avgCompliance,
      needsAttentionCount,
      onTrackCount
    }
  };
}

/**
 * Generate 1-Click WhatsApp deep link URL for doctor invite
 */
export function createDoctorWhatsAppInvite({ doctorName, phone, orgName = DEFAULT_ORG.name, orgSlug = 'apex-wellness' }) {
  const code = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
  const joinUrl = `${window.location.origin}/#/join-org?org=${orgSlug}&code=${code}`;
  
  const rawText = `Namaste ${doctorName || 'Doctor'}! You have been invited to join the ${orgName} Professional Care Portal on Stitch. Access your patient dashboard and prescribed habit plans here: ${joinUrl}`;
  const encodedText = encodeURIComponent(rawText);

  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  return {
    code,
    joinUrl,
    waUrl,
    rawText
  };
}

/**
 * Generate 1-Click WhatsApp Smart Nudge URL for a Patient
 */
export function createPatientWhatsAppNudge({ patientName, doctorName, phone, score, needsAttention, customNote }) {
  let message = '';
  
  if (customNote && customNote.trim()) {
    message = `Hi ${patientName}! ${doctorName} here from your health team. ${customNote.trim()} Let's stay consistent!`;
  } else if (needsAttention) {
    message = `Hi ${patientName}! ${doctorName} here. I noticed your daily habit log missed a few days this week (Score: ${Math.round(score)}%). Is everything okay? Let's get back on track today!`;
  } else {
    message = `Hi ${patientName}! Great job maintaining your healthy habits (Score: ${Math.round(score)}%)! Keep up the momentum today. Let me know if you need any adjustments. — ${doctorName}`;
  }

  const encoded = encodeURIComponent(message);
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  return {
    message,
    waUrl
  };
}

/**
 * Generate 1-Click WhatsApp Invite URL for onboarding a new Patient
 */
export function createPatientInviteWhatsApp({ patientName, doctorName, phone, planName = 'Clinical Wellness Plan' }) {
  const code = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
  const joinUrl = `${window.location.origin}/#/join?code=${code}`;
  const rawText = `Namaste ${patientName || 'Patient'}! Your health coach ${doctorName || 'Doctor'} has prepared your ${planName} on Stitch Habit Tracker.\nTap here to review and accept your plan: ${joinUrl}`;
  const encodedText = encodeURIComponent(rawText);
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  return {
    code,
    joinUrl,
    waUrl,
    rawText
  };
}

// =========================================================================
// MULTI-TENANT ORGANIZATIONS REGISTRY & SUPER ADMIN LICENSE TOKENS
// =========================================================================

export const DEFAULT_ORGS_REGISTRY = [
  {
    id: 'org_apex_wellness',
    name: 'Apex Healthcare & Corporate Wellness Network',
    slug: 'apex-wellness',
    logoText: 'APEX',
    specialty: 'Clinical Nutrition, PCOS & Metabolic Medicine',
    branches: 'South Delhi Clinic, Bandra West, Online Care, Corporate HQ',
    planTier: 'Enterprise Multi-Clinic (Unlimited Doctors)',
    admin: {
      name: 'Priya Nambiar',
      designation: 'Chief Wellness Director & HR Lead',
      email: 'admin.priya@apexhealth.in',
      phone: '+91 98765 43210'
    },
    doctorCount: 6,
    patientCount: 15,
    avgCompliance: 84.8,
    status: 'active',
    licenseKey: 'sec_org_apex_live_8842',
    createdAt: '2026-08-15'
  },
  {
    id: 'org_max_metabolic',
    name: 'Max Metabolic & Longevity Center',
    slug: 'max-metabolic',
    logoText: 'MAX',
    specialty: 'Metabolic Syndrome, Diabetes Reversal & Cardiology',
    branches: 'Saket Flagship, Gurugram Sector 43, Tele-Consult OPD',
    planTier: 'Specialty Clinic Network (Up to 10 Doctors)',
    admin: {
      name: 'Dr. Vikram Malhotra',
      designation: 'Head of Preventive Endocrinology',
      email: 'vikram.m@maxmetabolic.org',
      phone: '+91 98112 34567'
    },
    doctorCount: 4,
    patientCount: 12,
    avgCompliance: 88.2,
    status: 'active',
    licenseKey: 'sec_org_max_live_9201',
    createdAt: '2026-09-01'
  },
  {
    id: 'org_apollo_pcos',
    name: 'Apollo Endocrine & PCOS Wellness Clinic',
    slug: 'apollo-pcos',
    logoText: 'APL',
    specialty: 'Hormonal Balancing, PCOS Reversal & Fertility Nutrition',
    branches: 'Jubilee Hills, Whitefield Bangalore, Virtual Clinic',
    planTier: 'Enterprise Multi-Clinic (Unlimited Doctors)',
    admin: {
      name: 'Dr. Sunita Rao',
      designation: 'Clinical Director & Chief Dietitian',
      email: 'sunita.rao@apollopcos.com',
      phone: '+91 98450 98765'
    },
    doctorCount: 5,
    patientCount: 14,
    avgCompliance: 82.5,
    status: 'active',
    licenseKey: 'sec_org_apollo_live_3391',
    createdAt: '2026-09-18'
  }
];

export function getOrganizationsRegistry() {
  try {
    const raw = localStorage.getItem('b2b_organizations_registry');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_ORGS_REGISTRY;
}

export function saveOrganizationsRegistry(registry) {
  try {
    localStorage.setItem('b2b_organizations_registry', JSON.stringify(registry));
    return registry;
  } catch (e) {
    return DEFAULT_ORGS_REGISTRY;
  }
}

export function getOrgTokensRegistry() {
  try {
    const raw = localStorage.getItem('b2b_org_tokens_registry');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      token: 'sec_org_apex_live_8842',
      orgId: 'org_apex_wellness',
      orgName: 'Apex Healthcare & Corporate Wellness Network',
      adminEmail: 'admin.priya@apexhealth.in',
      adminName: 'Priya Nambiar',
      planTier: 'Enterprise Multi-Clinic (Unlimited Doctors)',
      status: 'claimed',
      createdAt: '2026-08-15',
      claimedAt: '2026-08-15'
    },
    {
      token: 'sec_org_max_live_9201',
      orgId: 'org_max_metabolic',
      orgName: 'Max Metabolic & Longevity Center',
      adminEmail: 'vikram.m@maxmetabolic.org',
      adminName: 'Dr. Vikram Malhotra',
      planTier: 'Specialty Clinic Network (Up to 10 Doctors)',
      status: 'claimed',
      createdAt: '2026-09-01',
      claimedAt: '2026-09-01'
    },
    {
      token: 'sec_org_apollo_live_3391',
      orgId: 'org_apollo_pcos',
      orgName: 'Apollo Endocrine & PCOS Wellness Clinic',
      adminEmail: 'sunita.rao@apollopcos.com',
      adminName: 'Dr. Sunita Rao',
      planTier: 'Enterprise Multi-Clinic (Unlimited Doctors)',
      status: 'claimed',
      createdAt: '2026-09-18',
      claimedAt: '2026-09-18'
    }
  ];
}

export function saveOrgTokensRegistry(tokens) {
  try {
    localStorage.setItem('b2b_org_tokens_registry', JSON.stringify(tokens));
    return tokens;
  } catch (e) {
    return [];
  }
}

export function createOrgOnboardingToken({
  orgName,
  adminName,
  adminEmail,
  adminPhone = '',
  planTier = 'Enterprise Multi-Clinic (Unlimited Doctors)',
  specialty = 'Metabolic Health & Clinical Nutrition',
  maxDoctors = 10,
  maxPatients = 250,
  expiryDays = 14
}) {
  const hash = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
  const token = `sec_org_${hash}`;
  const slug = (orgName || 'clinic').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const orgId = `org_${slug}_${Math.floor(100 + Math.random() * 900)}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (Number(expiryDays || 14) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  const inviteRecord = {
    token,
    orgId,
    orgName,
    slug,
    adminName,
    adminEmail,
    adminPhone,
    planTier,
    specialty,
    maxDoctors: Number(maxDoctors) || 10,
    maxPatients: Number(maxPatients) || 250,
    status: 'pending',
    createdAt: now.toISOString().split('T')[0],
    expiresAt
  };

  // Add to tokens registry
  const tokens = getOrgTokensRegistry();
  tokens.unshift(inviteRecord);
  saveOrgTokensRegistry(tokens);

  // Add to organizations registry as pending setup
  const orgs = getOrganizationsRegistry();
  orgs.unshift({
    id: orgId,
    name: orgName,
    slug,
    logoText: (orgName || 'CLINIC').substring(0, 4).toUpperCase(),
    specialty,
    branches: 'Main Clinic HQ, Telehealth OPD',
    planTier,
    admin: {
      name: adminName,
      designation: 'Clinic Director / Admin',
      email: adminEmail,
      phone: adminPhone
    },
    doctorCount: 0,
    patientCount: 0,
    avgCompliance: 0,
    status: 'pending_setup',
    licenseKey: token,
    createdAt: now.toISOString().split('T')[0]
  });
  saveOrganizationsRegistry(orgs);

  // Build secure URLs
  const origin = window.location.origin;
  const joinUrl = `${origin}/#/org-setup?token=${token}&org=${slug}`;
  
  const rawText = `Namaste ${adminName || 'Director'}! Your Definite Enterprise Care Portal for ${orgName} has been initialized.\nComplete your clinical roster and workspace configuration using your secure single-use cryptographic token here: ${joinUrl}`;
  const encodedText = encodeURIComponent(rawText);

  const cleanPhone = (adminPhone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  return {
    token,
    joinUrl,
    waUrl,
    rawText,
    inviteRecord
  };
}

export function validateOrgToken(token) {
  if (!token) return { valid: false, error: 'Token missing' };
  const tokens = getOrgTokensRegistry();
  const found = tokens.find(t => t.token === token);
  if (!found) return { valid: false, error: 'Token not found or invalid' };
  if (found.status === 'revoked') return { valid: false, error: 'Token has been revoked by platform administrator' };
  
  const todayStr = new Date().toISOString().split('T')[0];
  if (found.expiresAt && found.expiresAt < todayStr) {
    return { valid: false, error: 'Token has expired. Request an updated authorization link.' };
  }

  return { valid: true, invite: found };
}

export function claimOrgToken(token, orgData) {
  const tokens = getOrgTokensRegistry();
  const updatedTokens = tokens.map(t => {
    if (t.token === token) {
      return { ...t, status: 'claimed', claimedAt: new Date().toISOString().split('T')[0] };
    }
    return t;
  });
  saveOrgTokensRegistry(updatedTokens);

  // Update org registry
  const orgs = getOrganizationsRegistry();
  const updatedOrgs = orgs.map(o => {
    if (o.licenseKey === token || o.id === orgData.id) {
      return {
        ...o,
        ...orgData,
        status: 'active'
      };
    }
    return o;
  });
  saveOrganizationsRegistry(updatedOrgs);
  return true;
}

