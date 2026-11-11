// Hal-hal yang dipakai bersama oleh halaman peserta, panggung, dan pemandu.
export const AVATAR = ['🦊', '🐼', '🐸', '🐯', '🐵', '🐧', '🐨', '🦁', '🐰', '🐶', '🐱', '🐮', '🐷', '🐙', '🦄', '🐔'];
export const WARNA = ['#ff5d8f', '#ff9f1c', '#ffd23f', '#3ddc97', '#2ec4b6', '#4cc9f0', '#7b6cff', '#c77dff'];
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

export function avatarHTML(p, kelas = '') {
  const w = WARNA[(p.warna || 0) % WARNA.length];
  return `<span class="av ${kelas}" style="--w:${w}">${AVATAR[(p.avatar || 0) % AVATAR.length]}</span>`;
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
