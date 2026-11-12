// Integrity Adventure — aturan permainan (fungsi murni, tanpa Firebase).
// Dipakai laptop pemandu sebagai wasit. Lihat PRD v1.2 bagian 5.1.

export const ATURAN = {
  nyawaAwal: 3,
  nyawaMaks: 5,
  syaratBeruntun: 5,
  durasiArena: [10, 9, 8, 7], // detik; ronde ke-4 dst. tetap 7 (soal arena paling panjang, perlu waktu membaca)
  porsiTersingkir: 1 / 3,     // arena: tiap ronde minimal sepertiga tersingkir
  // Poin dipotong saat gugur (masuk penjara): makin awal gugur, makin besar potongannya.
  // Pemenang tetap yang bertahan sampai akhir; potongan ini menjaga poin agar sejalan dengan itu.
  potongGugur: { 1: 0.5, 2: 0.4, 3: 0.3, 4: 0.2, 5: 0.1 },
};

/** Memotong poin peserta yang baru gugur; mencatat rinciannya untuk ditampilkan di HP. */
function potongPoin(p, stage, idSoal) {
  const persen = ATURAN.potongGugur[stage] || 0;
  const dari = p.poin || 0; const jadi = Math.round(dari * (1 - persen));
  p.poin = jadi; p.potong = { id: idSoal ?? null, stage, persen: Math.round(persen * 100), dari, jadi };
}

export function buatPeserta(nama, avatar) {
  return {
    nama, avatar,
    nyawa: ATURAN.nyawaAwal,
    beruntun: 0,
    status: 'aktif',      // aktif | sp1 | sp2 | penjara | juara
    benar: 0,
    poin: 0,              // 100 per jawaban benar + bonus kecepatan sampai 100
    waktu: 0,             // total milidetik menjawab
    stagePenjara: null,
    keluarPada: null,     // urutan soal saat keluar; makin besar makin akhir
  };
}

export function statusDariNyawa(nyawa) {
  if (nyawa <= 0) return 'penjara';
  if (nyawa === 1) return 'sp2';
  if (nyawa === 2) return 'sp1';
  return 'aktif';
}

const masihMain = (p) => p.status !== 'penjara';
export const uidAktif = (peserta) => Object.keys(peserta).filter((u) => masihMain(peserta[u]));

/**
 * Menilai satu soal Stage 1–4.
 * peserta : { uid: Peserta }   (tidak diubah; hasil berupa salinan baru)
 * jawaban : { uid: { pilihan, ms } }   ms = lama menjawab
 * Hasil   : { peserta, kejadian: { uid: 'benar'|'sp1'|'sp2'|'penjara'|'bonus' }, rekap, juara, semuaTumbang }
 */
export const poinJawaban = (ms, durasiMs) => 100 + Math.round(100 * Math.max(0, Math.min(1, 1 - ms / durasiMs)));

export function nilaiSoal(peserta, jawaban, kunci, stage, hitung = 0, durasiMs = 10000, idSoal = null) {
  const baru = structuredClone(peserta);
  const kejadian = {};
  const main = uidAktif(baru);

  for (const uid of main) {
    const p = baru[uid];
    const j = jawaban[uid];
    if (j && j.pilihan === kunci) {
      p.benar += 1;
      p.waktu += j.ms;
      p.poin = (p.poin || 0) + poinJawaban(j.ms, durasiMs);
      p.beruntun += 1;
      kejadian[uid] = 'benar';
      if (p.beruntun >= ATURAN.syaratBeruntun) {
        p.beruntun = 0;
        if (p.nyawa < ATURAN.nyawaMaks) { p.nyawa += 1; kejadian[uid] = 'bonus'; }
      }
    } else {
      p.nyawa -= 1;
      p.beruntun = 0;
      if (p.nyawa <= 0) { p.nyawa = 0; p.stagePenjara = stage; p.keluarPada = hitung; potongPoin(p, stage, idSoal); }
    }
    p.status = statusDariNyawa(p.nyawa);
    if (kejadian[uid] === undefined) kejadian[uid] = p.status; // sp1 | sp2 | penjara
  }

  // Keadaan khusus: semua yang tersisa tumbang pada soal yang sama → hidupkan lagi, langsung ke arena.
  let semuaTumbang = false;
  if (main.length > 0 && uidAktif(baru).length === 0) {
    semuaTumbang = true;
    for (const uid of main) {
      baru[uid].nyawa = 1; baru[uid].status = 'sp2'; baru[uid].stagePenjara = null; baru[uid].keluarPada = null;
      if (baru[uid].potong?.id === idSoal && baru[uid].potong) { baru[uid].poin = baru[uid].potong.dari; delete baru[uid].potong; } // batal gugur → poin utuh
      kejadian[uid] = 'sp2';
    }
  }

  const sisa = uidAktif(baru);
  let juara = null;
  if (sisa.length === 1) { juara = sisa[0]; baru[juara].status = 'juara'; }

  return { peserta: baru, kejadian, rekap: rekapStatus(baru), juara, semuaTumbang };
}

/** Empat angka untuk rekap akhir stage. */
export function rekapStatus(peserta) {
  const r = { bersih: 0, sp1: 0, sp2: 0, penjara: 0 };
  for (const p of Object.values(peserta)) {
    if (p.status === 'penjara') r.penjara += 1;
    else if (p.status === 'sp1') r.sp1 += 1;
    else if (p.status === 'sp2') r.sp2 += 1;
    else r.bersih += 1;
  }
  return r;
}

export const durasiArena = (ronde) =>
  ATURAN.durasiArena[Math.min(ronde - 1, ATURAN.durasiArena.length - 1)];

/**
 * Menilai satu ronde Arena Terakhir (Stage 5). Semua masuk sama rata; salah = penjara.
 * Hasil: { peserta, keluar: [uid… urut dari peringkat terbaik], ulang, juara }
 */
export function nilaiArena(peserta, jawaban, kunci, ronde, hitung = ronde, durasiMs = 10000, idSoal = null) {
  const baru = structuredClone(peserta);
  const main = uidAktif(baru);
  const benar = main.filter((u) => jawaban[u] && jawaban[u].pilihan === kunci);
  const salah = main.filter((u) => !benar.includes(u));
  const ms = (u) => (jawaban[u] ? jawaban[u].ms : Infinity);

  // Semua salah → tidak ada yang keluar, ronde diulang dengan soal baru.
  if (benar.length === 0) return { peserta: baru, keluar: [], lambat: [], ulang: true, juara: null };

  // Tiap ronde minimal sepertiga tersingkir: yang salah dulu, lalu yang benar tetapi paling lambat.
  const target = Math.min(main.length - 1, Math.max(1, Math.ceil(main.length * ATURAN.porsiTersingkir)));
  const benarUrut = [...benar].sort((x, y) => ms(x) - ms(y)); // tercepat dulu
  const tambahan = Math.min(Math.max(0, target - salah.length), benarUrut.length - 1);
  const lambat = tambahan > 0 ? benarUrut.slice(benarUrut.length - tambahan) : [];
  // Urutan peringkat di antara yang keluar: benar-tapi-lambat di atas yang salah.
  const keluar = [...lambat, ...[...salah].sort((x, y) => ms(x) - ms(y))];

  for (const uid of benar) { baru[uid].benar += 1; baru[uid].waktu += ms(uid); baru[uid].poin = (baru[uid].poin || 0) + poinJawaban(ms(uid), durasiMs); }
  keluar.forEach((uid, i) => {
    const p = baru[uid];
    p.nyawa = 0; p.status = 'penjara'; p.stagePenjara = 5; potongPoin(p, 5, idSoal);
    p.keluarPada = hitung + (keluar.length - i) / (keluar.length + 1); // peringkat lebih baik = nilai lebih besar
  });

  const sisa = uidAktif(baru);
  let juara = null;
  if (sisa.length === 1) { juara = sisa[0]; baru[juara].status = 'juara'; }
  return { peserta: baru, keluar, lambat, ulang: false, juara };
}

/** Peringkat akhir: juara (bertahan sampai akhir), lalu yang gugur paling akhir; gugur bersamaan → poin, lalu tercepat. */
export function podium(peserta) {
  const semua = Object.entries(peserta).map(([uid, p]) => ({ uid, ...p }));
  const juara = semua.filter((p) => p.status === 'juara');
  const lain = semua
    .filter((p) => p.status !== 'juara')
    .sort((a, b) => (b.keluarPada ?? 1e9) - (a.keluarPada ?? 1e9) || (b.poin || 0) - (a.poin || 0) || a.waktu - b.waktu);
  return [...juara, ...lain].slice(0, 3);
}

/** Pemegang mahkota: peserta berpoin tertinggi yang MASIH BERTAHAN (seri → total waktu menjawab tercepat).
 *  Yang sudah di penjara tidak bisa memegang mahkota, jadi di akhir permainan mahkota selalu milik juara.
 *  Belum ada yang berpoin → tidak ada mahkota. */
export function pemegangMahkota(peserta) {
  let uid = null; let p = null;
  for (const [u, x] of Object.entries(peserta || {})) {
    if (!(x.poin > 0) || x.status === 'penjara') continue;
    if (!p || x.poin > p.poin || (x.poin === p.poin && (x.waktu || 0) < (p.waktu || 0))) { uid = u; p = x; }
  }
  return p ? { uid, nama: p.nama, avatar: p.avatar, warna: p.warna, poin: p.poin } : null;
}

/** Papan peringkat poin (benar + kecepatan), untuk rekap dan layar akhir. */
export function peringkatPoin(peserta, n = 5) {
  return Object.values(peserta).sort((a, b) => (b.poin || 0) - (a.poin || 0) || a.waktu - b.waktu).slice(0, n);
}
