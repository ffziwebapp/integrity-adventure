// Hal-hal yang dipakai bersama oleh halaman peserta, panggung, dan pemandu.
export const JUMLAH_AVATAR = 16;
export const WARNA = ['#FF5D8F', '#33B8FF', '#FFB703', '#2FD08A', '#8B5CF6', '#FF9F1C', '#FF4D5E', '#14B8A6'];
export const HURUF = ['a', 'b', 'c', 'd'];
export const BENTUK = ['●', '▲', '■', '◆'];

export const STAGE = {
  1: { nama: 'Pintu Jujur', ket: 'Benar atau salah? Pilih pintunya.', durasi: 10, jumlah: 5 },
  2: { nama: 'Tebak Nilai', ket: 'Baca kasusnya, tebak nilai integritasnya.', durasi: 15, jumlah: 5 },
  3: { nama: 'Timbangan Adil', ket: 'Adil, tidak adil, atau sekadar sama rata?', durasi: 20, jumlah: 5 },
  4: { nama: 'Lari Kilat', ket: 'Pilihan ganda. Makin sulit, makin cepat.', durasi: 12, jumlah: 4 },
  5: { nama: 'Arena Terakhir', ket: 'Semua sama rata. Satu kesalahan = penjara. Sampai tersisa satu.' },
};

export const LABEL_STATUS = { aktif: 'BERSIH', sp1: 'SP 1', sp2: 'SP 2', penjara: 'PENJARA', juara: 'JUARA' };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const daftar = (v) => (v == null ? [] : Array.isArray(v) ? v : Object.values(v));

// Karakter gambar sendiri (SVG) supaya tampil sama di semua perangkat.
// 16 wajah = 4 bentuk mata x 4 bentuk mulut.
const TINTA = '#26124D';
const MATA = [
  `<circle cx="22" cy="30" r="3.6"/><circle cx="38" cy="30" r="3.6"/>`,
  `<path d="M17 31q5-7 10 0M33 31q5-7 10 0" fill="none" stroke="${TINTA}" stroke-width="3.2" stroke-linecap="round"/>`,
  `<circle cx="22" cy="30" r="6.4" fill="#fff"/><circle cx="38" cy="30" r="6.4" fill="#fff"/><circle cx="23" cy="31" r="3"/><circle cx="37" cy="31" r="3"/>`,
  `<circle cx="22" cy="30" r="3.6"/><path d="M33 31h10" fill="none" stroke="${TINTA}" stroke-width="3.2" stroke-linecap="round"/>`,
];
const MULUT = [
  `<path d="M23 41q7 7 14 0" fill="none" stroke="${TINTA}" stroke-width="3.2" stroke-linecap="round"/>`,
  `<ellipse cx="30" cy="43" rx="4" ry="5"/>`,
  `<path d="M24 43h12" fill="none" stroke="${TINTA}" stroke-width="3.2" stroke-linecap="round"/>`,
  `<path d="M21 40h18q-1 10-9 10t-9-10z"/><path d="M24 41h12v3H24z" fill="#fff"/>`,
];
export function karakterSVG(avatar = 0) {
  const a = ((avatar % JUMLAH_AVATAR) + JUMLAH_AVATAR) % JUMLAH_AVATAR;
  return `<svg viewBox="0 0 60 72" aria-hidden="true" focusable="false"><rect x="13" y="62" width="13" height="8" rx="4" fill="${TINTA}"/><rect x="34" y="62" width="13" height="8" rx="4" fill="${TINTA}"/>`
    + `<rect x="4" y="2" width="52" height="64" rx="26" fill="var(--w,#ccc)"/><path d="M4 44v-4q26 12 52 0v4a26 22 0 0 1-52 0z" fill="#000" opacity=".13"/>`
    + `<ellipse cx="20" cy="15" rx="9" ry="5" fill="#fff" opacity=".4" transform="rotate(-24 20 15)"/><g fill="${TINTA}">${MATA[a % 4]}${MULUT[Math.floor(a / 4) % 4]}</g></svg>`;
}
export const warnaKe = (i) => WARNA[(((i || 0) % WARNA.length) + WARNA.length) % WARNA.length];
export function avatarHTML(p, kelas = '') {
  return `<span class="av ${kelas}" style="--w:${warnaKe(p.warna)}">${karakterSVG(p.avatar || 0)}</span>`;
}

// Ikon SVG. Emoji di dalam teks antarmuka diganti otomatis menjadi ikon ini (lihat pasangIkon).
const G = (isi, garis) => `<svg class="ik" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${garis ? 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"' : 'fill="currentColor"'}>${isi}</svg>`;
const IKON = {
  hati: G('<path d="M12 21s-7.5-4.7-9.6-9.3C.9 8.300 3 4.500 6.800 4.500c2.100 0 3.800 1.100 5.200 2.900 1.400-1.800 3.100-2.900 5.200-2.900 3.800 0 5.900 3.800 4.400 7.200C19.500 16.300 12 21 12 21z"/>'),
  hatiKosong: G('<path d="M12 20s-6.700-4.300-8.600-8.400C2.100 8.800 3.900 5.700 6.900 5.700c2 0 3.600 1.200 5.100 3.300 1.500-2.100 3.100-3.300 5.100-3.300 3 0 4.800 3.100 3.500 5.900C18.700 15.700 12 20 12 20z"/>', 1),
  api: G('<path d="M12.500 2c.6 3.400 5.500 5.800 5.500 11.500a6 6 0 0 1-12 0c0-2.400 1.100-3.900 2.300-5.200.2 2 1 3.200 2.200 3.700C10 8.500 10.500 5 12.500 2z"/>'),
  sel: G('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M12 4v16M16 4v16"/>', 1),
  bendera: G('<path d="M5 21V4"/><path d="M5 5h12l-2.500 4 2.500 4H5" fill="currentColor"/>', 1),
  surat: G('<path d="M7 3h8l4 4v14H7z"/><path d="M10 12h6M10 16h6M10 8h3"/>', 1),
  jam: G('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>', 1),
  lampu: G('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.6.500 1 1.200 1 2.100h5c0-.9.400-1.600 1-2.100A6 6 0 0 0 12 3z"/>', 1),
  centang: G('<circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/>', 1),
  bintang: G('<path d="M12 2.500l2.900 6.100 6.600.8-4.900 4.500 1.300 6.600L12 17.300 6.100 20.500l1.300-6.600L2.500 9.400l6.600-.8z"/>'),
  mata: G('<path d="M2 12s3.600-6.500 10-6.500S22 12 22 12s-3.600 6.500-10 6.500S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 1),
  perisai: G('<path d="M12 2.500l8 3v6c0 5-3.400 8.700-8 10-4.600-1.300-8-5-8-10v-6z"/><path d="M8.500 12l2.500 2.500 4.500-5"/>', 1),
  lari: G('<path d="M4 12h15M13 6l6 6-6 6"/>', 1),
  mahkota: G('<path d="M3 19l-1.500-11 5.500 4.500L12 4l5 8.500L22.500 8 21 19z"/>'),
  piala: G('<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v1.500A3.500 3.500 0 0 0 6.500 10M17 5h4v1.500A3.500 3.500 0 0 1 17.500 10M12 13v4M8 21h8M9.500 17h5v4h-5z"/>', 1),
  cari: G('<circle cx="11" cy="11" r="7"/><path d="M16.500 16.500L21 21"/>', 1),
  kunci: G('<rect x="5" y="11" width="14" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 1),
  kunciBuka: G('<rect x="5" y="11" width="14" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 7.500-2"/>', 1),
  awas: G('<path d="M12 3.500L22 20H2z"/><path d="M12 10v4.500M12 17.500v.1"/>', 1),
  pulau: G('<path d="M3 19c3-2 6-2 9 0s6 2 9 0"/><path d="M12 17V8M12 8c-3-3-6-2-7 0M12 8c3-3 6-2 7 0M12 8c0-3 2-4 4-4"/>', 1),
};
const PETA = { '❤': 'hati', '🤍': 'hatiKosong', '🔥': 'api', '🚔': 'sel', '🏁': 'bendera', '📄': 'surat', '⏰': 'jam', '💡': 'lampu', '✅': 'centang', '🎉': 'bintang', '👏': 'bintang', '🙌': 'bintang', '👀': 'mata', '⚔': 'perisai', '🏃': 'lari', '👑': 'mahkota', '🏆': 'piala', '🧐': 'cari', '🔒': 'kunci', '🔓': 'kunciBuka', '⚠': 'awas', '🏝': 'pulau' };
const POLA = new RegExp('(' + Object.keys(PETA).join('|') + ')\\uFE0F?', 'gu');
export const ik = (nama) => IKON[nama].replace('class="ik"', `class="ik ik-${nama}"`);

/** Mengganti emoji di teks halaman dengan ikon SVG, juga untuk isi yang ditambahkan kemudian. */
export function pasangIkon(akar = document.body) {
  const ganti = (simpul) => {
    const w = document.createTreeWalker(simpul, NodeFilter.SHOW_TEXT); const daftarTeks = [];
    while (w.nextNode()) { POLA.lastIndex = 0; if (POLA.test(w.currentNode.nodeValue) && !w.currentNode.parentElement?.closest('input,textarea,svg')) daftarTeks.push(w.currentNode); }
    for (const t of daftarTeks) {
      POLA.lastIndex = 0;
      const sp = document.createElement('span'); sp.className = 'ikt';
      sp.innerHTML = esc(t.nodeValue).replace(POLA, (m, e) => ik(PETA[e]));
      t.replaceWith(...sp.childNodes);
    }
  };
  ganti(akar);
  new MutationObserver((mm) => { for (const m of mm) for (const n of m.addedNodes) { if (n.nodeType === 1) ganti(n); else if (n.nodeType === 3 && n.parentNode) ganti(n.parentNode); } })
    .observe(akar, { childList: true, subtree: true });
}

export function acakUrut(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Pembaca CSV sederhana (mendukung tanda kutip, koma, dan baris baru di dalam sel). */
export function bacaCSV(teks) {
  teks = teks.replace(/^﻿/, '');
  const baris = []; let sel = ''; let brs = []; let kutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) {
      if (c === '"' && teks[i + 1] === '"') { sel += '"'; i++; } else if (c === '"') kutip = false; else sel += c;
    } else if (c === '"') kutip = true;
    else if (c === ',') { brs.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && teks[i + 1] === '\n') i++;
      brs.push(sel); sel = ''; if (brs.some((x) => x !== '')) baris.push(brs); brs = [];
    } else sel += c;
  }
  brs.push(sel); if (brs.some((x) => x !== '')) baris.push(brs);
  const kepala = baris.shift().map((k) => k.trim().toLowerCase());
  return baris.map((b) => Object.fromEntries(kepala.map((k, i) => [k, (b[i] ?? '').trim()])));
}

/** Mengubah baris CSV bank soal menjadi objek soal. Mengembalikan { soal: {id: …}, galat: [] }. */
export function susunBank(barisCSV) {
  const soal = {}; const galat = [];
  for (const b of barisCSV) {
    if ((b.aktif || 'YA').toUpperCase() !== 'YA') continue;
    const opsi = [b.opsi_a, b.opsi_b, b.opsi_c, b.opsi_d].filter((x) => x);
    const stage = Number(b.stage); const kunci = (b.kunci || '').toLowerCase();
    if (!b.id || !/^[\w-]+$/.test(b.id)) { galat.push(`id tidak sah: "${b.id}"`); continue; }
    if (!(stage >= 1 && stage <= 5)) { galat.push(`${b.id}: stage harus 1–5`); continue; }
    if (opsi.length < 2 || HURUF.indexOf(kunci) < 0 || HURUF.indexOf(kunci) >= opsi.length) { galat.push(`${b.id}: opsi atau kunci tidak sah`); continue; }
    soal[b.id] = { id: b.id, stage, nilai: b.nilai || '', tipe: b.tipe || 'pilihan_ganda', pertanyaan: b.pertanyaan, opsi, kunci, penjelasan: b.penjelasan || '' };
  }
  return { soal, galat };
}

/** Hitung mundur yang diselaraskan dengan jam server. cb(sisaDetik, porsi 0..1). */
export function hitungMundur(toko, mulaiPada, durasi, cb) {
  let hidup = true;
  const langkah = () => {
    if (!hidup) return;
    const sisa = Math.max(0, mulaiPada + durasi * 1000 - toko.sekarang());
    cb(Math.ceil(sisa / 1000), sisa / (durasi * 1000));
    if (sisa > 0) setTimeout(langkah, 100);
  };
  langkah();
  return () => { hidup = false; };
}

const audio = { ctx: null };
/** Bunyi pendek tanpa berkas suara. jenis: 'tik' | 'benar' | 'salah' | 'menang' */
export function bunyi(jenis) {
  try {
    audio.ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
    const nada = { tik: [[880, 0.05]], benar: [[660, 0.1], [990, 0.16]], salah: [[220, 0.25]], menang: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]] }[jenis] || [];
    let t = audio.ctx.currentTime;
    for (const [f, d] of nada) {
      const o = audio.ctx.createOscillator(); const g = audio.ctx.createGain();
      o.frequency.value = f; o.type = jenis === 'salah' ? 'sawtooth' : 'triangle';
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g).connect(audio.ctx.destination); o.start(t); o.stop(t + d); t += d;
    }
  } catch { /* suara tidak wajib */ }
}
