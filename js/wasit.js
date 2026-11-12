// Wasit: logika pemandu. Berjalan di laptop pemandu, menilai jawaban dan menggerakkan permainan.
import { nilaiSoal, nilaiArena, uidAktif, rekapStatus, podium, durasiArena, peringkatPoin, pemegangMahkota } from './aturan.js';
import { TS } from './toko.js';
import { STAGE, HURUF, acakUrut, daftar } from './umum.js';

const TENGGANG = 1200; // ms kelonggaran jaringan setelah waktu habis
// Jeda otomatis antarlayar (ms). Tambahkan ?cepat pada alamat untuk pengujian.
const CEPAT = typeof location !== 'undefined' && new URLSearchParams(location.search).has('cepat') ? 0.12 : 1;
const TUNGGU = { intro: 4500, buka: 7500, bukaArena: 6000, rekap: 9000 };
const ringkas = (x) => ({ nama: x.nama, avatar: x.avatar, warna: x.warna, benar: x.benar || 0, poin: x.poin || 0 });

export class Wasit {
  /** opsi.pengemudi = true hanya untuk halaman panggung: di sanalah pewaktu dan penilaian berjalan. */
  constructor(toko, kode, onUbah, opsi = {}) {
    this.pengemudi = !!opsi.pengemudi; this.idSaya = Wasit.idTab(); this.kunciAuto = ''; this.perintahLalu = undefined;
    this.toko = toko; this.kode = kode; this.P = `ruang/${kode}`; this.onUbah = onUbah || (() => {});
    this.pub = null; this.peserta = {}; this.bank = {}; this.w = {};
    this.menilai = false; this.timer = null; this.lepasJawab = null; this.idPantau = null; this.jawabMentah = {};
  }

  async mulai() {
    const { toko, P } = this;
    this.bank = (await toko.baca('bank')) || {};
    this.w = (await toko.baca(`${P}/wasit`)) || {};
    toko.pantau(`${P}/peserta`, (v) => { this.peserta = v || {}; this.#catatJumlah(); this.onUbah(); });
    if (this.pengemudi) {
      // Hanya satu panggung yang boleh mengemudi. Yang lain menjadi penonton.
      const lain = await toko.baca(`${P}/pengemudi`);
      if (lain && lain.id !== this.idSaya && toko.sekarang() - (lain.t || 0) < 7000) this.pengemudi = false;
      else {
        const denyut = () => toko.tulis(`${P}/pengemudi`, { id: this.idSaya, t: TS }).catch(() => {});
        await denyut(); this.tDenyut = setInterval(denyut, 3000);
      }
    }
    toko.pantau(`${P}/publik`, (v) => { this.pub = v; this.#aturSoal(); this.#otomatis(); this.onUbah(); });
    if (this.pengemudi) {
      toko.pantau(`${P}/perintah`, (v) => {
        const id = v?.id || null;
        if (this.perintahLalu === undefined) { this.perintahLalu = id; return; } // abaikan perintah lama saat baru dibuka
        if (!id || id === this.perintahLalu) return;
        this.perintahLalu = id; this.#jalankan(v.aksi).catch((e) => { this.galat = e.message; this.onUbah(); });
      });
    }
  }

  /** Dipanggil dari tombol mana pun. Di panggung langsung dijalankan; di panel pemandu dikirim sebagai perintah. */
  async perintah(aksi) {
    this.galat = '';
    if (this.pengemudi) return this.#jalankan(aksi);
    return this.toko.tulis(`${this.P}/perintah`, { aksi, id: Math.random().toString(36).slice(2, 10), t: TS });
  }
  #jalankan(aksi) {
    if (aksi === 'lanjut') return this.lanjut();
    if (aksi === 'ganti') return this.gantiSoal();
    if (aksi === 'jeda') return this.toko.tulis(`${this.P}/publik/jeda`, !this.pub?.jeda);
    return Promise.resolve();
  }

  // Maju sendiri: intro → soal → buka → soal berikutnya → rekap → stage berikutnya. Podium menunggu pemandu.
  #otomatis() {
    if (!this.pengemudi) return;
    const p = this.pub;
    const kunci = p ? [p.fase, p.soal?.id, p.stage, p.ronde, !!p.jeda].join('|') : '';
    if (kunci === this.kunciAuto) return;
    this.kunciAuto = kunci; clearTimeout(this.tAuto);
    if (!p || p.jeda) return;
    const ms = p.fase === 'intro' ? TUNGGU.intro : p.fase === 'rekap' ? TUNGGU.rekap : p.fase === 'buka' ? (p.stage === 5 ? TUNGGU.bukaArena : TUNGGU.buka) : 0;
    if (ms) this.tAuto = setTimeout(() => this.lanjut().catch((e) => { this.galat = e.message; this.onUbah(); }), ms * CEPAT);
  }

  // Pengenal tab yang bertahan saat halaman dimuat ulang, supaya panggung yang sama bisa mengemudi lagi.
  static idTab() {
    try { let id = sessionStorage.getItem('ia-tab'); if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('ia-tab', id); } return id; }
    catch { return Math.random().toString(36).slice(2, 10); }
  }

  static async buatRuang(toko) {
    const abjad = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let coba = 0; coba < 20; coba++) {
      const kode = Array.from({ length: 5 }, () => abjad[Math.floor(Math.random() * abjad.length)]).join('');
      if (await toko.baca(`ruang/${kode}/publik/fase`)) continue;
      await toko.tulis(`ruang/${kode}/publik`, { fase: 'lobi', terkunci: false, jumlahPemain: 0, dibuat: TS });
      return kode;
    }
    throw new Error('Gagal membuat kode ruang');
  }

  async muatBank(soal) { await this.toko.tulis('bank', soal); this.bank = soal; this.onUbah(); }
  get jumlahBank() { return Object.keys(this.bank).length; }
  get aktif() { return uidAktif(this.peserta); }

  #catatJumlah() {
    if (!this.pub || this.pub.fase !== 'lobi') return;
    const n = Object.keys(this.peserta).length;
    if (n !== this.pub.jumlahPemain) this.toko.tulis(`${this.P}/publik/jumlahPemain`, n);
  }

  // --- Tombol utama ---
  async lanjut() {
    const p = this.pub; if (!p || this.sibuk || !this.pengemudi) return;
    this.sibuk = true; clearTimeout(this.tAuto);
    try {
      if (p.fase === 'lobi') await this.#mulaiKuis();
      else if (p.fase === 'intro') await this.#kirimSoal(p.stage, 1, 1);
      else if (p.fase === 'soal') await this.tutupSoal();
      else if (p.fase === 'buka') await this.#setelahBuka();
      else if (p.fase === 'rekap') await this.#intro(p.stage >= 4 ? 5 : p.stage + 1);
      else if (p.fase === 'podium') await this.toko.tulis(`${this.P}/publik/fase`, 'tersulit');
      else if (p.fase === 'tersulit') await this.toko.tulis(`${this.P}/publik/fase`, 'selesai');
    } finally { this.sibuk = false; }
  }

  labelLanjut() {
    const p = this.pub; if (!p) return '…';
    const b = p.buka || {};
    return ({
      lobi: 'MULAI KUIS', intro: 'TAMPILKAN SOAL', soal: 'TUTUP SOAL SEKARANG',
      buka: p.juaraUid ? 'KE PODIUM' : p.stage === 5 ? (b.ulang ? 'ULANGI RONDE' : 'RONDE BERIKUTNYA')
        : this.w.langsungArena ? 'KE ARENA TERAKHIR' : p.nomor < p.jumlah ? 'SOAL BERIKUTNYA' : 'REKAP STAGE',
      rekap: p.stage >= 4 ? 'KE ARENA TERAKHIR' : `KE STAGE ${p.stage + 1}`,
      podium: 'SOAL PALING MENJEBAK', tersulit: 'SELESAI', selesai: 'PERMAINAN SELESAI',
    })[p.fase] || '…';
  }

  async #mulaiKuis() {
    if (this.jumlahBank === 0) throw new Error('Bank soal belum dimuat.');
    if (Object.keys(this.peserta).length < 2) throw new Error('Minimal 2 peserta untuk memulai.');
    const urutan = {}; const cadangan = {};
    for (let s = 1; s <= 5; s++) {
      const ids = acakUrut(Object.values(this.bank).filter((q) => q.stage === s).map((q) => q.id));
      const n = s === 5 ? ids.length : Math.min(STAGE[s].jumlah, ids.length);
      if (n === 0) throw new Error(`Bank soal tidak punya soal untuk stage ${s}.`);
      urutan['s' + s] = ids.slice(0, n); cadangan['s' + s] = ids.slice(n);
    }
    this.w = { urutan, cadangan, hitung: 0, posArena: 0, statistik: {}, langsungArena: false };
    await this.toko.perbarui({ [`${this.P}/wasit`]: this.w, [`${this.P}/publik/terkunci`]: true, [`${this.P}/publik/mahkota`]: null });
    await this.#intro(1);
  }

  #intro(stage) {
    this.w.langsungArena = false;
    return this.toko.perbarui({
      [`${this.P}/wasit/langsungArena`]: false,
      [`${this.P}/publik/fase`]: 'intro', [`${this.P}/publik/stage`]: stage,
      [`${this.P}/publik/soal`]: null, [`${this.P}/publik/buka`]: null, [`${this.P}/publik/rekap`]: null,
      [`${this.P}/publik/sisa`]: this.aktif.length,
    });
  }

  #idBerikut(stage, nomor) {
    if (stage < 5) return daftar(this.w.urutan['s' + stage])[nomor - 1];
    const arena = daftar(this.w.urutan.s5);
    const lain = [1, 2, 3, 4].flatMap((s) => daftar(this.w.cadangan?.['s' + s]));
    const semua = [...arena, ...lain];
    return semua[(this.w.posArena || 0) % semua.length];
  }

  /** Soal yang akan tampil berikutnya (untuk pratinjau pemandu), lengkap dengan kunci. */
  intip() {
    const p = this.pub; if (!p || !this.w.urutan) return null;
    let id = null;
    if (p.fase === 'intro') id = this.#idBerikut(p.stage, 1);
    else if (p.fase === 'soal') id = p.soal?.id;
    else if (p.fase === 'buka' && !p.juaraUid) {
      if (p.stage === 5) id = this.#idBerikut(5);
      else if (!this.w.langsungArena && p.nomor < p.jumlah) id = this.#idBerikut(p.stage, p.nomor + 1);
    }
    return id ? this.bank[id] : null;
  }

  async #kirimSoal(stage, nomor, ronde, idPaksa) {
    const id = idPaksa || this.#idBerikut(stage, nomor);
    const q = this.bank[id]; if (!q) throw new Error('Soal tidak ditemukan: ' + id);
    if (stage === 5) this.w.posArena = (this.w.posArena || 0) + 1;
    this.w.snapshot = this.peserta; this.w.soalAktif = id;
    this.menilai = false;
    const durasi = stage === 5 ? durasiArena(ronde) : STAGE[stage].durasi;
    const B = `${this.P}/publik`;
    await this.toko.perbarui({
      [`${this.P}/wasit`]: this.w,
      [`${B}/fase`]: 'soal', [`${B}/stage`]: stage, [`${B}/nomor`]: nomor,
      [`${B}/jumlah`]: stage === 5 ? 0 : daftar(this.w.urutan['s' + stage]).length,
      [`${B}/ronde`]: ronde,
      [`${B}/soal`]: { id: q.id, tipe: q.tipe, pertanyaan: q.pertanyaan, opsi: q.opsi },
      [`${B}/mulaiPada`]: TS, [`${B}/durasi`]: durasi, [`${B}/buka`]: null, [`${B}/terjawab`]: 0,
      [`${this.P}/gerak`]: null,
      [`${B}/sisa`]: this.aktif.length,
    });
  }

  // Dipanggil tiap publik berubah: pasang pewaktu & pemantau jawaban untuk soal aktif.
  #aturSoal() {
    if (!this.pengemudi) return;
    const p = this.pub;
    clearTimeout(this.timer);
    if (!p || p.fase !== 'soal' || !p.soal || typeof p.mulaiPada !== 'number') {
      if (this.lepasJawab) { this.lepasJawab(); this.lepasJawab = null; this.idPantau = null; }
      return;
    }
    const sisa = p.mulaiPada + p.durasi * 1000 + TENGGANG - this.toko.sekarang();
    this.timer = setTimeout(() => this.tutupSoal(), Math.max(0, sisa));
    if (this.idPantau !== p.soal.id) {
      if (this.lepasJawab) this.lepasJawab();
      this.idPantau = p.soal.id; this.jawabMentah = {};
      let terakhir = 0;
      this.lepasJawab = this.toko.pantau(`${this.P}/jawaban/${p.soal.id}`, (v) => {
        this.jawabMentah = v || {};
        const aktif = this.aktif; const n = aktif.filter((u) => this.jawabMentah[u]).length;
        if (this.pub?.fase !== 'soal' || this.pub.soal?.id !== this.idPantau) return;
        const kini = Date.now();
        if (n !== this.pub.terjawab && (kini - terakhir > 600 || n === aktif.length)) {
          terakhir = kini; this.toko.tulis(`${this.P}/publik/terjawab`, n);
        }
        this.#siarGerak();
        if (aktif.length > 0 && n === aktif.length) setTimeout(() => this.tutupSoal(), 500);
      });
    }
  }

  // Stage 1–4: pilihan peserta disiarkan ke panggung supaya karakternya langsung bergerak.
  // Arena (stage 5): tidak disiarkan sampai waktu habis, agar tidak bisa ikut-ikutan.
  #siarGerak() {
    const p = this.pub; if (!p || p.fase !== 'soal' || p.stage === 5) return;
    const kirim = () => {
      this.tGerak = null; this.gerakAkhir = Date.now();
      if (this.pub?.fase !== 'soal' || this.pub.soal?.id !== this.idPantau) return;
      const pilihan = {};
      for (const [u, j] of Object.entries(this.jawabMentah)) if (HURUF.includes(j.pilihan)) pilihan[u] = j.pilihan;
      this.toko.tulis(`${this.P}/gerak`, { id: this.idPantau, pilihan });
    };
    if (this.tGerak) return;
    const jeda = 350 - (Date.now() - (this.gerakAkhir || 0));
    this.tGerak = setTimeout(kirim, Math.max(0, jeda));
  }

  async tutupSoal() {
    const p = this.pub;
    if (!this.pengemudi || this.menilai || !p || p.fase !== 'soal') return;
    this.menilai = true; clearTimeout(this.timer);
    try {
      const q = this.bank[p.soal.id];
      const mentah = (await this.toko.baca(`${this.P}/jawaban/${q.id}`)) || {};
      const batas = p.durasi * 1000 + TENGGANG;
      const jawaban = {};
      for (const [uid, j] of Object.entries(mentah)) {
        const ms = (j.pada || 0) - p.mulaiPada;
        if (ms <= batas && HURUF.includes(j.pilihan)) jawaban[uid] = { pilihan: j.pilihan, ms: Math.max(0, ms) };
      }
      const main = this.aktif; const arena = p.stage === 5;
      this.w.hitung = (this.w.hitung || 0) + 1;
      const r = arena ? nilaiArena(this.peserta, jawaban, q.kunci, p.ronde, this.w.hitung, p.durasi * 1000)
        : nilaiSoal(this.peserta, jawaban, q.kunci, p.stage, this.w.hitung, p.durasi * 1000);

      const sebaran = q.opsi.map((_, i) => main.filter((u) => jawaban[u]?.pilihan === HURUF[i]).length);
      const salah = main.filter((u) => jawaban[u]?.pilihan !== q.kunci).length;
      this.w.statistik = this.w.statistik || {};
      this.w.statistik[q.id] = { s: salah, t: main.length };
      if (!arena && r.semuaTumbang) this.w.langsungArena = true;

      const ubah = {}; const hit = { sp1: 0, sp2: 0, penjara: 0, bonus: 0 };
      for (const uid of main) {
        let jenis;
        if (arena) {
          const benar = jawaban[uid]?.pilihan === q.kunci;
          jenis = r.ulang ? 'ulang' : r.keluar.includes(uid) ? (benar ? 'lambat' : 'penjara') : 'benar';
          if (r.keluar.includes(uid)) hit.penjara += 1;
        } else { jenis = r.kejadian[uid]; if (hit[jenis] !== undefined) hit[jenis] += 1; }
        ubah[`${this.P}/peserta/${uid}`] = { ...r.peserta[uid], kejadian: { id: q.id, jenis } };
      }
      const B = `${this.P}/publik`;
      ubah[`${B}/fase`] = 'buka';
      ubah[`${B}/buka`] = {
        kunci: q.kunci, penjelasan: q.penjelasan, sebaran, tanpaJawab: main.filter((u) => !jawaban[u]).length,
        ...hit, ulang: arena ? !!r.ulang : false, semuaTumbang: !arena && !!r.semuaTumbang,
        keluar: arena ? r.keluar.map((u) => this.peserta[u].nama) : [],
      };
      ubah[`${B}/sisa`] = uidAktif(r.peserta).length;
      ubah[`${B}/juaraUid`] = r.juara || null;
      const mk = pemegangMahkota(r.peserta);
      ubah[`${B}/mahkota`] = mk ? { ...mk, pindah: mk.uid !== (p.mahkota?.uid ?? null) } : null;
      ubah[`${this.P}/gerak`] = { id: q.id, pilihan: Object.fromEntries(Object.entries(jawaban).map(([u, j]) => [u, j.pilihan])) };
      ubah[`${this.P}/wasit`] = this.w;
      await this.toko.perbarui(ubah);
    } finally { this.menilai = false; }
  }

  async #setelahBuka() {
    const p = this.pub; const b = p.buka || {};
    if (p.juaraUid) return this.#podium();
    if (p.stage === 5) return this.#kirimSoal(5, 0, b.ulang ? p.ronde : p.ronde + 1);
    if (this.w.langsungArena) return this.#intro(5);
    if (p.nomor < p.jumlah) return this.#kirimSoal(p.stage, p.nomor + 1, 0);
    const r = rekapStatus(this.peserta);
    const semua = Object.values(this.peserta);
    const top = peringkatPoin(this.peserta, 5).map(ringkas);
    return this.toko.perbarui({
      [`${this.P}/publik/fase`]: 'rekap',
      [`${this.P}/publik/rekap`]: { ...r, penjaraBaru: semua.filter((x) => x.stagePenjara === p.stage).length, top },
    });
  }

  #podium() {
    const pd = podium(this.peserta).map(ringkas);
    const tersulit = Object.entries(this.w.statistik || {})
      .filter(([, v]) => v.t > 0 && v.s > 0)
      .sort((a, c) => c[1].s / c[1].t - a[1].s / a[1].t).slice(0, 3)
      .map(([id, v]) => {
        const q = this.bank[id];
        return { pertanyaan: q.pertanyaan, jawaban: q.opsi[HURUF.indexOf(q.kunci)], penjelasan: q.penjelasan, persen: Math.round((v.s / v.t) * 100) };
      });
    return this.toko.perbarui({
      [`${this.P}/publik/fase`]: 'podium', [`${this.P}/publik/podium`]: pd, [`${this.P}/publik/tersulit`]: tersulit,
      [`${this.P}/publik/peringkat`]: peringkatPoin(this.peserta, 5).map(ringkas),
    });
  }

  // --- Tombol darurat ---
  /** Membatalkan soal yang sedang tampil/baru dinilai, mengembalikan keadaan peserta, memakai soal pengganti. */
  async gantiSoal() {
    const p = this.pub; if (!this.pengemudi || !p || !['soal', 'buka'].includes(p.fase) || this.menilai) return;
    clearTimeout(this.timer); clearTimeout(this.tAuto);
    const sudahDinilai = p.fase === 'buka';
    if (sudahDinilai) {
      this.w.hitung = Math.max(0, (this.w.hitung || 1) - 1);
      if (this.w.statistik) delete this.w.statistik[p.soal.id];
      this.w.langsungArena = false;
      const mk = pemegangMahkota(this.w.snapshot || this.peserta);
      await this.toko.perbarui({ [`${this.P}/peserta`]: this.w.snapshot || this.peserta, [`${this.P}/publik/juaraUid`]: null,
        [`${this.P}/publik/mahkota`]: mk ? { ...mk, pindah: false } : null });
      this.peserta = this.w.snapshot || this.peserta;
    }
    let id;
    if (p.stage === 5) id = this.#idBerikut(5);
    else {
      const cad = daftar(this.w.cadangan?.['s' + p.stage]);
      if (cad.length === 0) throw new Error('Tidak ada soal cadangan untuk stage ini.');
      id = cad.shift(); this.w.cadangan['s' + p.stage] = cad;
      const urut = daftar(this.w.urutan['s' + p.stage]); urut[p.nomor - 1] = id; this.w.urutan['s' + p.stage] = urut;
    }
    await this.#kirimSoal(p.stage, p.nomor, p.ronde, id);
  }

  kunciPintu(nilai) { return this.toko.tulis(`${this.P}/publik/terkunci`, !!nilai); }
  keluarkan(uid) { return this.toko.hapus(`${this.P}/peserta/${uid}`); }
  hapusRuang() { clearTimeout(this.timer); clearTimeout(this.tAuto); clearInterval(this.tDenyut); return this.toko.hapus(this.P); }
}
