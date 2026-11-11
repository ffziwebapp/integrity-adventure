// Lapisan data. Mode biasa memakai Firebase; tambahkan ?uji pada alamat untuk
// mode tiruan (localStorage, tanpa internet) yang dipakai saat pengujian.
import { firebaseConfig, VERSI_SDK } from './config.js';

export const UJI = new URLSearchParams(location.search).has('uji');
export const TS = { '.sv': 'timestamp' }; // diganti jam server saat disimpan

export async function siapkan() {
  return UJI ? buatTiruan() : buatFirebase();
}

async function buatFirebase() {
  const dasar = `https://www.gstatic.com/firebasejs/${VERSI_SDK}/`;
  const [A, U, D] = await Promise.all([
    import(dasar + 'firebase-app.js'),
    import(dasar + 'firebase-auth.js'),
    import(dasar + 'firebase-database.js'),
  ]);
  const app = A.initializeApp(firebaseConfig);
  const auth = U.getAuth(app);
  const db = D.getDatabase(app);
  let selisih = 0;
  D.onValue(D.ref(db, '.info/serverTimeOffset'), (s) => { selisih = s.val() || 0; });
  const r = (path) => D.ref(db, path);

  return {
    async masukAnonim() {
      await auth.authStateReady();
      if (!auth.currentUser) await U.signInAnonymously(auth);
      return auth.currentUser.uid;
    },
    async penggunaPemandu() {
      await auth.authStateReady();
      const u = auth.currentUser;
      return u && !u.isAnonymous ? u.uid : null;
    },
    async masukPemandu(email, sandi) {
      const c = await U.signInWithEmailAndPassword(auth, email, sandi);
      return c.user.uid;
    },
    keluar: () => U.signOut(auth),
    pantau: (path, cb, salah) => D.onValue(r(path), (s) => cb(s.val()), (e) => (salah ? salah(e) : console.error(path, e))),
    baca: async (path) => (await D.get(r(path))).val(),
    tulis: (path, nilai) => D.set(r(path), nilai),
    perbarui: (obj) => D.update(D.ref(db), obj),
    hapus: (path) => D.remove(r(path)),
    sekarang: () => Date.now() + selisih,
  };
}

function buatTiruan() {
  const K = 'ia-uji';
  const bc = new BroadcastChannel(K);
  const pendengar = new Set();
  const muat = () => JSON.parse(localStorage.getItem(K) || '{}');
  const kunci = (path) => path.split('/').filter(Boolean);
  const ambil = (t, path) => kunci(path).reduce((o, k) => (o == null ? undefined : o[k]), t);
  const isi = (v) => {
    if (v === null || typeof v !== 'object') return v;
    if (v['.sv'] === 'timestamp') return Date.now();
    if (Array.isArray(v)) return v.map(isi);
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x != null).map(([k, x]) => [k, isi(x)]));
  };
  const pasang = (t, path, nilai) => {
    const ks = kunci(path); const akhir = ks.pop(); let o = t;
    for (const k of ks) { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }
    if (nilai == null) delete o[akhir]; else o[akhir] = isi(nilai);
  };
  const kabari = () => pendengar.forEach((l) => l());
  bc.onmessage = kabari;
  window.addEventListener('storage', kabari); // perubahan dari tab lain bisa tiba sedikit terlambat
  setInterval(kabari, 400);
  const simpan = (t) => { localStorage.setItem(K, JSON.stringify(t)); bc.postMessage(1); kabari(); };
  let uid = sessionStorage.getItem('ia-uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 9); sessionStorage.setItem('ia-uid', uid); }

  return {
    masukAnonim: async () => uid,
    penggunaPemandu: async () => (localStorage.getItem('ia-host') ? 'HOST' : null),
    masukPemandu: async () => { localStorage.setItem('ia-host', '1'); return 'HOST'; },
    keluar: async () => localStorage.removeItem('ia-host'),
    pantau(path, cb) {
      let lalu;
      const l = () => { const v = ambil(muat(), path) ?? null; const s = JSON.stringify(v); if (s !== lalu) { lalu = s; cb(JSON.parse(s)); } };
      pendengar.add(l); queueMicrotask(l);
      return () => pendengar.delete(l);
    },
    baca: async (path) => ambil(muat(), path) ?? null,
    // Web Locks membuat baca-ubah-tulis antar-tab tidak saling menimpa.
    tulis: (path, nilai) => navigator.locks.request(K, () => { const t = muat(); pasang(t, path, nilai); simpan(t); }),
    perbarui: (obj) => navigator.locks.request(K, () => { const t = muat(); for (const [p, v] of Object.entries(obj)) pasang(t, p, v); simpan(t); }),
    hapus: (path) => navigator.locks.request(K, () => { const t = muat(); pasang(t, path, null); simpan(t); }),
    sekarang: () => Date.now(),
  };
}
