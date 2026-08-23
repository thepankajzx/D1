/**
 * In-memory / LocalStorage mock for Firebase Firestore.
 * Used exclusively during local development to prevent polluting the production database.
 */

// Load initial state from LocalStorage
let mockDb = JSON.parse(localStorage.getItem('mock_firestore_db') || '{}');

const saveDb = () => {
  localStorage.setItem('mock_firestore_db', JSON.stringify(mockDb));
  notifyListeners();
};

const listeners = [];
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const getPathData = (path) => mockDb[path] || {};
const setPathData = (path, data) => {
  mockDb[path] = data;
  saveDb();
};

export const documentId = () => '__name__';
export const getFirestore = () => ({ type: 'firestore' });
export const serverTimestamp = () => Date.now();

export const collection = (db, ...pathSegments) => ({ type: 'collection', path: pathSegments.join('/') });

export const doc = (dbOrCol, ...pathSegments) => {
  let path = dbOrCol && dbOrCol.type === 'collection' ? dbOrCol.path + '/' + pathSegments.join('/') : pathSegments.join('/');
  return { type: 'doc', path };
};

export const getDoc = async (docRef) => {
  const parts = docRef.path.split('/');
  const docId = parts.pop();
  const colPath = parts.join('/');
  const data = getPathData(colPath)[docId];
  return { id: docId, exists: () => !!data, data: () => data };
};

export const getDocs = async (queryOrCol) => {
  const colPath = queryOrCol.path;
  const colData = getPathData(colPath);
  let results = Object.keys(colData).map(id => ({ id, data: () => colData[id] }));

  if (queryOrCol.type === 'query') {
    for (const filter of queryOrCol.filters) {
      if (filter.type === 'where') {
        results = results.filter(item => {
          const val = filter.field === '__name__' ? item.id : item.data()[filter.field];
          if (filter.op === '==') return val === filter.val;
          if (filter.op === '>=') return val >= filter.val;
          if (filter.op === '<=') return val <= filter.val;
          if (filter.op === 'in') return filter.val.includes(val);
          return true;
        });
      }
    }
    for (const order of queryOrCol.orders) {
      results.sort((a, b) => {
        const valA = a.data()[order.field];
        const valB = b.data()[order.field];
        if (valA < valB) return order.dir === 'asc' ? -1 : 1;
        if (valA > valB) return order.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    if (queryOrCol.limit) results = results.slice(0, queryOrCol.limit);
  }

  return { docs: results, forEach: (cb) => results.forEach(cb), empty: results.length === 0, size: results.length };
};

export const addDoc = async (colRef, data) => {
  const colPath = colRef.path;
  const colData = getPathData(colPath);
  // Generate random id
  const docId = Math.random().toString(36).substring(2, 15);
  colData[docId] = data;
  setPathData(colPath, colData);
  return { id: docId, path: colPath + '/' + docId };
};

export const setDoc = async (docRef, data, options = {}) => {
  const parts = docRef.path.split('/');
  const docId = parts.pop();
  const colPath = parts.join('/');
  const colData = getPathData(colPath);
  colData[docId] = options.merge ? { ...(colData[docId] || {}), ...data } : data;
  setPathData(colPath, colData);
};

export const updateDoc = async (docRef, data) => {
  const parts = docRef.path.split('/');
  const docId = parts.pop();
  const colPath = parts.join('/');
  const colData = getPathData(colPath);
  if (!colData[docId]) throw new Error("Document not found");
  colData[docId] = { ...colData[docId], ...data };
  setPathData(colPath, colData);
};

export const deleteDoc = async (docRef) => {
  const parts = docRef.path.split('/');
  const docId = parts.pop();
  const colPath = parts.join('/');
  const colData = getPathData(colPath);
  delete colData[docId];
  setPathData(colPath, colData);
};

export const query = (col, ...ops) => {
  const q = { type: 'query', path: col.path, filters: [], orders: [], limit: null };
  ops.forEach(op => {
    if (op.type === 'where') q.filters.push(op);
    if (op.type === 'orderBy') q.orders.push(op);
    if (op.type === 'limit') q.limit = op.val;
  });
  return q;
};

export const where = (field, op, val) => ({ type: 'where', field, op, val });
export const orderBy = (field, dir = 'asc') => ({ type: 'orderBy', field, dir });
export const limit = (val) => ({ type: 'limit', val });

export const onSnapshot = (queryOrCol, onNext, onError) => {
  const emit = async () => { try { onNext(await getDocs(queryOrCol)); } catch (e) { if (onError) onError(e); } };
  emit();
  listeners.push(emit);
  return () => { const idx = listeners.indexOf(emit); if (idx > -1) listeners.splice(idx, 1); };
};

export const writeBatch = () => {
  const ops = [];
  return {
    set: (docRef, data, options) => ops.push(() => setDoc(docRef, data, options)),
    update: (docRef, data) => ops.push(() => updateDoc(docRef, data)),
    delete: (docRef) => ops.push(() => deleteDoc(docRef)),
    commit: async () => { for (const op of ops) await op(); }
  };
};
