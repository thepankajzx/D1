import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getProTypeConfig } from '../proConfig';

// 31-symbol alphabet without ambiguous symbols (I, L, O, 0, 1)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 10) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_ALPHABET.length);
    result += CODE_ALPHABET[randomIndex];
  }
  return result;
}

export function formatInviteCode(code) {
  if (!code) return '';
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length > 5) {
    return `${clean.slice(0, 5)}-${clean.slice(5, 10)}`;
  }
  return clean;
}

export function normalizeInviteCode(code) {
  return (code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Fetch or initialize Professional Profile from Firestore
 */
export async function getProProfile(uid) {
  if (!uid) return null;
  try {
    const docRef = doc(db, 'dietitians', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn('[proService] getProProfile error:', err);
  }
  return null;
}

/**
 * Save / Update Professional Profile
 */
export async function saveProProfile(uid, data) {
  if (!uid) return;
  const docRef = doc(db, 'dietitians', uid);
  const payload = {
    ...data,
    proType: data.proType || 'dietitian',
    status: data.status || 'active',
    updatedAt: serverTimestamp()
  };
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Fetch all clients linked to this professional
 */
export async function getProClients(proUid) {
  if (!proUid) return [];
  try {
    const q = query(collection(db, 'links'), where('dietitianUid', '==', proUid));
    const snap = await getDocs(q);
    const clients = [];
    snap.forEach((d) => {
      clients.push({ id: d.id, ...d.data() });
    });
    return clients;
  } catch (err) {
    console.warn('[proService] getProClients error:', err);
    return [];
  }
}

/**
 * Fetch client link details and their active plan
 */
export async function getClientLink(linkId) {
  if (!linkId) return null;
  try {
    const linkRef = doc(db, 'links', linkId);
    const linkSnap = await getDoc(linkRef);
    if (!linkSnap.exists()) return null;

    const planRef = doc(db, `links/${linkId}/plan/current`);
    const planSnap = await getDoc(planRef);

    return {
      link: { id: linkSnap.id, ...linkSnap.data() },
      plan: planSnap.exists() ? planSnap.data() : null
    };
  } catch (err) {
    console.warn('[proService] getClientLink error:', err);
    return null;
  }
}

/**
 * Fetch client's daily shared logs for inspection
 */
export async function getClientDays(linkId, maxDays = 30) {
  if (!linkId) return [];
  try {
    const daysRef = collection(db, `links/${linkId}/days`);
    const q = query(daysRef, orderBy('date', 'desc'), limit(maxDays));
    const snap = await getDocs(q);
    const days = [];
    snap.forEach((d) => {
      days.push({ id: d.id, ...d.data() });
    });
    return days;
  } catch (err) {
    console.warn('[proService] getClientDays error:', err);
    return [];
  }
}

/**
 * Fetch private client notes maintained by the Pro
 */
export async function getClientNotes(proUid, clientUid) {
  if (!proUid || !clientUid) return '';
  try {
    const noteRef = doc(db, `dietitians/${proUid}/clientNotes/${clientUid}`);
    const snap = await getDoc(noteRef);
    if (snap.exists()) {
      return snap.data().notes || '';
    }
  } catch (err) {
    console.warn('[proService] getClientNotes error:', err);
  }
  return '';
}

/**
 * Save private client notes maintained by the Pro
 */
export async function saveClientNotes(proUid, clientUid, notesText) {
  if (!proUid || !clientUid) return;
  const noteRef = doc(db, `dietitians/${proUid}/clientNotes/${clientUid}`);
  await setDoc(noteRef, {
    notes: notesText,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Create a new single-use Invite
 */
export async function createInvite({
  proUid,
  proName,
  clinicName,
  proType = 'dietitian',
  clientLabel,
  plan,
  daysValid = 7
}) {
  const code = generateInviteCode(10);
  const inviteRef = doc(db, 'invites', code);

  const expiresMillis = Date.now() + (daysValid * 24 * 60 * 60 * 1000);
  const payload = {
    dietitianUid: proUid,
    dietitianName: proName || '',
    clinicName: clinicName || '',
    proType,
    clientLabel: clientLabel || 'New Client',
    plan,
    status: 'open',
    expiresAt: Timestamp.fromMillis(expiresMillis),
    createdAt: serverTimestamp(),
    redeemedBy: null,
    redeemedAt: null
  };

  await setDoc(inviteRef, payload);
  return { code, formattedCode: formatInviteCode(code), ...payload };
}

/**
 * Fetch an invite by its 10-char code
 */
export async function getInviteByCode(rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!code) return null;
  try {
    const inviteRef = doc(db, 'invites', code);
    const snap = await getDoc(inviteRef);
    if (snap.exists()) {
      return { code: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn('[proService] getInviteByCode error:', err);
  }
  return null;
}

/**
 * Client accepts invite and joins the Pro's plan (Atomic Batch)
 */
export async function redeemInviteAndLink({ inviteCode, clientUid, clientDisplayName }) {
  const code = normalizeInviteCode(inviteCode);
  const inviteRef = doc(db, 'invites', code);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Invite code not found. Please verify the link or ask your coach.');
  }

  const invite = inviteSnap.data();
  if (invite.status !== 'open') {
    throw new Error('This invite has already been redeemed or expired.');
  }

  if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
    throw new Error('This invite link has expired. Please request a new invite.');
  }

  const proUid = invite.dietitianUid;
  const linkId = `${proUid}_${clientUid}`;
  const linkRef = doc(db, 'links', linkId);
  const planRef = doc(db, `links/${linkId}/plan/current`);

  const batch = writeBatch(db);

  // 1. Mark invite redeemed
  batch.update(inviteRef, {
    status: 'redeemed',
    redeemedBy: clientUid,
    redeemedAt: serverTimestamp()
  });

  // 2. Create link document
  const linkPayload = {
    dietitianUid: proUid,
    clientUid: clientUid,
    dietitianName: invite.dietitianName || 'Coach',
    clinicName: invite.clinicName || '',
    proType: invite.proType || 'dietitian',
    clientDisplayName: clientDisplayName || invite.clientLabel || 'Client',
    status: 'active',
    inviteCode: code,
    consent: {
      version: '2026-10-v1',
      acceptedAt: serverTimestamp(),
      scopes: ['plan_habits', 'plan_scores', 'plan_metrics']
    },
    createdAt: serverTimestamp(),
    revokedAt: null,
    endedAt: null,
    summary: {
      lastLoggedDate: null,
      last7PlanScore: null,
      loggedDaysLast7: 0,
      missedLast3: false,
      planVersion: invite.plan?.version || 1,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
    }
  };
  batch.set(linkRef, linkPayload, { merge: true });

  // 3. Create active plan copy
  const planPayload = {
    version: invite.plan?.version || 1,
    effectiveFrom: new Date().toISOString().split('T')[0],
    source: 'invite',
    habits: invite.plan?.habits || [],
    metrics: invite.plan?.metrics || [],
    updatedAt: serverTimestamp()
  };
  batch.set(planRef, planPayload);

  await batch.commit();

  return { linkId, linkPayload, planPayload };
}

/**
 * Save Client Shared Day Log (called when client saves progress in Today/Dashboard)
 */
export async function saveClientSharedDay({
  linkId,
  date,
  planScore,
  habitsData,
  metricsData,
  engineVersion = 'scoring-1.0',
  planVersion = 1,
  backfilled = false
}) {
  if (!linkId || !date) return;

  const dayRef = doc(db, `links/${linkId}/days/${date}`);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  const dayPayload = {
    date,
    planScore: planScore !== undefined ? planScore : null,
    habits: habitsData || {},
    metrics: metricsData || {},
    engineVersion,
    planVersion,
    tz,
    backfilled: Boolean(backfilled),
    updatedAt: serverTimestamp()
  };

  // Update day doc
  await setDoc(dayRef, dayPayload, { merge: true });

  // Update link summary map for fast 1-read dashboard inspection
  try {
    const linkRef = doc(db, 'links', linkId);
    await updateDoc(linkRef, {
      'summary.lastLoggedDate': date,
      'summary.last7PlanScore': planScore !== undefined ? planScore : null,
      'summary.planVersion': planVersion,
      'summary.tz': tz
    });
  } catch (err) {
    console.warn('[proService] Failed to update link summary:', err);
  }
}

/**
 * Client revokes access (Stop sharing)
 */
export async function revokeClientLink(linkId, deleteSharedHistory = false) {
  if (!linkId) return;
  const linkRef = doc(db, 'links', linkId);
  await updateDoc(linkRef, {
    status: 'revoked_by_client',
    revokedAt: serverTimestamp()
  });

  if (deleteSharedHistory) {
    // Delete up to 100 days records
    try {
      const daysRef = collection(db, `links/${linkId}/days`);
      const snap = await getDocs(daysRef);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn('[proService] Error clearing shared days:', err);
    }
  }
}

/**
 * Pro ends relationship with client
 */
export async function endClientLinkByPro(linkId) {
  if (!linkId) return;
  const linkRef = doc(db, 'links', linkId);
  await updateDoc(linkRef, {
    status: 'ended_by_dietitian',
    endedAt: serverTimestamp()
  });
}

/**
 * Check if the active client has any linked Pro
 */
export async function getActiveClientLinkForUser(clientUid) {
  if (!clientUid) return null;
  try {
    const q = query(
      collection(db, 'links'), 
      where('clientUid', '==', clientUid),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const link = { id: docSnap.id, ...docSnap.data() };
      
      const planRef = doc(db, `links/${link.id}/plan/current`);
      const planSnap = await getDoc(planRef);
      const plan = planSnap.exists() ? planSnap.data() : null;

      return { link, plan };
    }
  } catch (err) {
    console.warn('[proService] getActiveClientLinkForUser error:', err);
  }
  return null;
}

/**
 * Provide rich synthetic sample clients for local testing and interactive demo
 */
export function getMockDemoClients(proType = 'dietitian') {
  const config = getProTypeConfig(proType);
  return [
    {
      id: 'mock_c1',
      clientDisplayName: 'Riya Malhotra',
      dietitianName: 'Dr. Sarah Sharma',
      proType,
      status: 'active',
      summary: {
        lastLoggedDate: new Date().toISOString().split('T')[0],
        last7PlanScore: 84.5,
        loggedDaysLast7: 6,
        missedLast3: false,
        planVersion: 1
      },
      needsAttention: false,
      sampleDays: [
        { date: '2026-10-11', planScore: 88, habits: { water: { value: 2.8, score: 93, status: 'done' }, veg: { value: 4, score: 80, status: 'done' }, sugary: { value: 0, score: 100, status: 'done' } }, metrics: { weight: 64.2 } },
        { date: '2026-10-10', planScore: 82, habits: { water: { value: 2.2, score: 73, status: 'partial' }, veg: { value: 5, score: 100, status: 'done' }, sugary: { value: 0, score: 100, status: 'done' } }, metrics: { weight: 64.5 } },
        { date: '2026-10-09', planScore: 85, habits: { water: { value: 2.5, score: 83, status: 'done' }, veg: { value: 4, score: 80, status: 'done' }, sugary: { value: 0, score: 100, status: 'done' } }, metrics: { weight: 64.6 } }
      ]
    },
    {
      id: 'mock_c2',
      clientDisplayName: 'Kavita Verma',
      dietitianName: 'Dr. Sarah Sharma',
      proType,
      status: 'active',
      summary: {
        lastLoggedDate: '2026-10-08',
        last7PlanScore: 48.0,
        loggedDaysLast7: 2,
        missedLast3: true,
        planVersion: 1
      },
      needsAttention: true,
      attentionReason: 'Missed logging for past 3 days & score dropped by 18 pts',
      sampleDays: [
        { date: '2026-10-08', planScore: 52, habits: { water: { value: 1.2, score: 40, status: 'missed' }, veg: { value: 2, score: 40, status: 'missed' }, sugary: { value: 2, score: 33, status: 'missed' } }, metrics: { weight: 72.1 } }
      ]
    },
    {
      id: 'mock_c3',
      clientDisplayName: 'Arjun Sen',
      dietitianName: 'Dr. Sarah Sharma',
      proType,
      status: 'active',
      summary: {
        lastLoggedDate: new Date().toISOString().split('T')[0],
        last7PlanScore: 92.0,
        loggedDaysLast7: 7,
        missedLast3: false,
        planVersion: 1
      },
      needsAttention: false,
      sampleDays: [
        { date: '2026-10-11', planScore: 95, habits: { water: { value: 3.2, score: 100, status: 'done' }, veg: { value: 5, score: 100, status: 'done' }, sugary: { value: 0, score: 100, status: 'done' } }, metrics: { weight: 78.4 } }
      ]
    }
  ];
}
