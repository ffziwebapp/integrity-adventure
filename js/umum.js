// Hal-hal yang dipakai bersama oleh halaman peserta, panggung, dan pemandu.
export const JUMLAH_AVATAR = 16;
export const WARNA = ['#FF3D9A', '#2AA8FF', '#FFA51A', '#3FCF5E', '#8B5CF6', '#FF7A1A', '#FF4D5E', '#14B8A6'];
// Warna lengan dan kaki (lebih gelap) dihitung sekali di sini, bukan dengan filter CSS yang mahal.
const LENGAN = ['#CD3286', '#2685D5', '#CD8322', '#37A457', '#724ACE', '#CD6222', '#CD3E57', '#159290'];
const KAKI = ['#A32976', '#2469B3', '#A36729', '#308152', '#5E3CAD', '#A34E29', '#A33352', '#16737D'];
export const HURUF = ['a', 'b', 'c', 'd'];
export const BENTUK = ['●', '▲', '■', '◆'];

export const STAGE = {
  1: { nama: 'Pintu Jujur', ket: 'Benar atau salah? Pilih pintunya.', durasi: 7, jumlah: 5 },
  2: { nama: 'Tebak Nilai', ket: 'Baca kasusnya, tebak nilai integritasnya.', durasi: 10, jumlah: 5 },
  3: { nama: 'Timbangan Adil', ket: 'Adil, tidak adil, atau sekadar sama rata?', durasi: 12, jumlah: 5 },
  4: { nama: 'Lari Kilat', ket: 'Pilihan ganda. Makin sulit, makin cepat.', durasi: 9, jumlah: 4 },
  5: { nama: 'Arena Terakhir', ket: 'Semua sama rata. Satu kesalahan = penjara. Sampai tersisa satu.' },
};

export const LABEL_STATUS = { aktif: 'BERSIH', sp1: 'SP 1', sp2: 'SP 2', penjara: 'PENJARA', juara: 'JUARA' };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const daftar = (v) => (v == null ? [] : Array.isArray(v) ? v : Object.values(v));

// Karakter gambar sendiri (SVG) supaya tampil sama di semua perangkat.
// 16 wajah = 4 bentuk mata x 4 bentuk mulut. Semi-3D tanpa garis tepi: gradien kilap, sisi gelap, bayangan lantai.
const TINTA = '#1D1458';
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
const G2 = `fill="none" stroke="var(--w2,#999)" stroke-width="6.5" stroke-linecap="round"`;

// Gradien kilap dipasang sekali untuk seluruh halaman, lalu dirujuk oleh semua karakter.
if (typeof document !== 'undefined' && !document.getElementById('ia-kilap')) {
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('aria-hidden', 'true'); defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
  defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  defs.innerHTML = '<defs><radialGradient id="ia-kilap" cx="34%" cy="24%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/>'
    + '<stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient></defs>';
  (document.body || document.documentElement).prepend(defs);
}

/** Karakter berlengan dengan beberapa ekspresi. Ekspresi dipilih lewat kelas CSS pada pembungkusnya:
 *  e-senang, e-sedih, e-kaget, e-tangis; kelas "lambai" menandai karakter yang sesekali melambai
 *  (digerakkan oleh hidupkanKarakter, bukan animasi CSS terus-menerus). */
export function karakterSVG(avatar = 0) {
  const a = ((avatar % JUMLAH_AVATAR) + JUMLAH_AVATAR) % JUMLAH_AVATAR;
  return `<svg viewBox="0 0 60 72" aria-hidden="true" focusable="false">`
    + `<ellipse cx="30" cy="69.5" rx="20" ry="3" fill="#12063c" opacity=".28"/>`
    + `<g class="tg tg-kiri"><path d="M7 37q-10 5-9 16" ${G2}/></g><g class="tg tg-kanan"><path d="M53 37q10 5 9 16" ${G2}/></g>`
    + `<rect x="13" y="60" width="14" height="9" rx="4.5" fill="var(--w3,#777)"/><rect x="33" y="60" width="14" height="9" rx="4.5" fill="var(--w3,#777)"/>`
    + `<rect x="4" y="2" width="52" height="63" rx="26" fill="var(--w,#ccc)"/><rect x="4" y="2" width="52" height="63" rx="26" fill="url(#ia-kilap)"/>`
    + `<ellipse cx="20" cy="14" rx="8" ry="4.2" fill="#fff" opacity=".7" transform="rotate(-24 20 14)"/>`
    + `<g class="mata" fill="${TINTA}">${MATA[a % 4]}</g>`
    + `<g class="mt mt-biasa" fill="${TINTA}">${MULUT[Math.floor(a / 4) % 4]}</g>`
    + `<g class="mt mt-senang" fill="${TINTA}"><path d="M19 39h22q-1 12-11 12T19 39z"/><path d="M23 40h14v3H23z" fill="#fff"/></g>`
    + `<g class="mt mt-sedih"><path d="M23 46q7-7 14 0" fill="none" stroke="${TINTA}" stroke-width="3.200" stroke-linecap="round"/></g>`
    + `<g class="mt mt-kaget" fill="${TINTA}"><ellipse cx="30" cy="45" rx="5" ry="6.500"/></g>`
    + `<g class="alis"><path d="M15 25l9-4M45 25l-9-4" fill="none" stroke="${TINTA}" stroke-width="2.800" stroke-linecap="round"/></g>`
    + `<g class="air" fill="#4cc9f0" stroke="${TINTA}" stroke-width="1"><path d="M19 36q-4 6 0 8q4-2 0-8z"/><path d="M41 36q-4 6 0 8q4-2 0-8z"/></g></svg>`;
}
const nomorWarna = (i) => (((i || 0) % WARNA.length) + WARNA.length) % WARNA.length;
export const warnaKe = (i) => WARNA[nomorWarna(i)];
/** Variabel CSS warna karakter (badan, lengan, kaki). */
export const gayaWarna = (i) => { const n = nomorWarna(i); return `--w:${WARNA[n]};--w2:${LENGAN[n]};--w3:${KAKI[n]}`; };
export function avatarHTML(p, kelas = '') {
  return `<span class="av ${kelas}" style="${gayaWarna(p.warna)}">${karakterSVG(p.avatar || 0)}</span>`;
}

/**
 * Menghidupkan karakter dengan biaya kecil: satu pewaktu memilih beberapa karakter secara acak untuk berkedip,
 * dan sesekali membuat karakter bertanda "lambai" melambaikan tangan. Tidak ada animasi CSS yang berjalan
 * terus-menerus pada puluhan karakter, jadi panggung tetap ringan walau berisi 70 orang.
 * Karakter di dalam elemen ber-kelas "tertutup" (tidak terlihat) dilewati.
 */
export function hidupkanKarakter(akar = document.body) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const acak = (arr) => arr[Math.floor(Math.random() * arr.length)];
  let ayun = 0;
  setInterval(() => {
    if (document.hidden) return;
    const semua = [...akar.querySelectorAll('.av, .k')].filter((e) => !e.closest('.tertutup'));
    if (!semua.length) return;
    // Rata-rata tiap karakter berkedip sekali per ±3,5 detik.
    const nKedip = Math.min(semua.length, Math.floor(semua.length / 23 + Math.random()));
    for (let i = 0; i < nKedip; i++) {
      const e = acak(semua); if (e.classList.contains('kedip')) continue;
      e.classList.add('kedip'); setTimeout(() => e.classList.remove('kedip'), 160);
    }
    // Lambaian: paling banyak sekitar seperdelapan dari yang boleh melambai, bergiliran.
    const boleh = semua.filter((e) => e.classList.contains('lambai') && !e.classList.contains('ayun'));
    if (boleh.length && ayun < Math.max(1, Math.ceil(boleh.length / 8)) && Math.random() < (boleh.length > 3 ? 0.5 : 0.07)) {
      const e = acak(boleh); ayun += 1; e.classList.add('ayun');
      setTimeout(() => { e.classList.remove('ayun'); ayun -= 1; }, 1700);
    }
  }, 150);
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

// ---------- Musik latar (dibangkitkan langsung, tanpa berkas suara) ----------
// Lagu pendek buatan sendiri: empat akor berulang, bas, iringan, dan melodi.
export const Musik = (() => {
  const AKOR = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]]; // C Am F G
  const MELODI = [0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 1, 2, 2, 1, 0]; // indeks nada akor per ketukan seperdelapan
  let ctx = null, keluaran = null, tm = null, langkah = 0, kapan = 0, tempo = 112, hidup = false;
  const nada = (f, t, lama, jenis, keras) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = jenis; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(keras, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + lama);
    o.connect(g).connect(keluaran); o.start(t); o.stop(t + lama + 0.02);
  };
  const jadwal = () => {
    const d8 = 60 / tempo / 2;
    while (kapan < ctx.currentTime + 0.25) {
      const birama = Math.floor(langkah / 8) % 4, k = langkah % 8, ak = AKOR[birama];
      if (k % 4 === 0) nada(ak[0] / 2, kapan, d8 * 3.4, 'triangle', 0.22);          // bas
      if (k % 2 === 1) { nada(ak[1], kapan, d8 * 0.8, 'triangle', 0.07); nada(ak[2], kapan, d8 * 0.8, 'triangle', 0.07); } // iringan
      const m = MELODI[(langkah % 16)]; const oktaf = Math.floor(langkah / 16) % 2 ? 2 : 1;
      if (k !== 3) nada(ak[m] * 2 * (oktaf === 2 && k > 5 ? 2 : 1), kapan, d8 * 0.9, 'square', 0.045);   // melodi
      if (k % 2 === 0) { const n = ctx.createOscillator(), g = ctx.createGain(); n.type = 'square'; n.frequency.setValueAtTime(k % 4 ? 180 : 90, kapan); n.frequency.exponentialRampToValueAtTime(40, kapan + 0.08);
        g.gain.setValueAtTime(0.09, kapan); g.gain.exponentialRampToValueAtTime(0.0001, kapan + 0.09); n.connect(g).connect(keluaran); n.start(kapan); n.stop(kapan + 0.1); } // ketukan
      kapan += d8; langkah += 1;
    }
  };
  return {
    get hidup() { return hidup; },
    mulai() {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (!keluaran) { keluaran = ctx.createGain(); keluaran.gain.value = 0.5; keluaran.connect(ctx.destination); }
        ctx.resume(); if (hidup) return; hidup = true; kapan = ctx.currentTime + 0.05; tm = setInterval(jadwal, 60); jadwal();
      } catch { hidup = false; }
    },
    berhenti() { hidup = false; clearInterval(tm); },
    alih() { if (hidup) this.berhenti(); else this.mulai(); return hidup; },
    tempo(bpm) { tempo = bpm; },
    volume(v) { if (keluaran) keluaran.gain.value = v; },
  };
})();
