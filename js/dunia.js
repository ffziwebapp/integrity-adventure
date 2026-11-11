// Dunia game di layar panggung: tiap peserta punya karakter yang bergerak ke area pilihannya.
// Kanvas logis 1600 x 900 yang diskalakan mengikuti ukuran jendela.
import { HURUF, BENTUK, STAGE, esc, daftar, karakterSVG, warnaKe } from './umum.js';

const L = 1600, T = 900;
const KULIT = { 1: 'jungkat', 2: 'kartu', 3: 'timbang', 4: 'gerbang', 5: 'pulau' };

export class Dunia {
  constructor(wadah) {
    this.wadah = wadah;
    wadah.innerHTML = `<div class="d-skala">
      <div class="d-langit"></div>
      <div class="d-atas"></div>
      <div class="d-soal"></div>
      <div class="d-zona"></div>
      <div class="d-start"><b>🏁 Garis start</b></div>
      <div class="d-sel"><b>🚔 Penjara (<i>0</i>)</b></div>
      <div class="d-orang"></div></div>`;
    this.sk = wadah.firstElementChild;
    this.q = (s) => this.sk.querySelector(s);
    this.orang = new Map(); // uid -> { el, x, y }
    this.idSoal = null; this.urut = []; this.zona = []; this.terap = false; this.timer = null;
    const skala = () => {
      const s = Math.min(innerWidth / L, innerHeight / T);
      this.sk.style.transform = `translate(${(innerWidth - L * s) / 2}px, ${(innerHeight - T * s) / 2}px) scale(${s})`;
    };
    addEventListener('resize', skala); skala();
  }

  tampil(ya) { this.wadah.style.display = ya ? '' : 'none'; }

  /** Dipanggil tiap ada perubahan data. info = HTML cip hasil (saat jawaban dibuka). */
  atur(pub, peserta, gerak, info) {
    this.pub = pub; this.peserta = peserta; this.info = info;
    this.pilih = gerak && gerak.id === pub.soal?.id ? gerak.pilihan || {} : {};
    const kunci = `${pub.soal.id}|${pub.ronde}`;
    if (kunci !== this.idSoal) { this.idSoal = kunci; this.#bangun(); }
    const terbuka = pub.fase === 'buka';
    if (!terbuka) { clearTimeout(this.timer); this.terap = false; }
    else if (!this.terap && !this.timer) {
      // Arena: semua berlari serentak dulu, baru hasilnya dijatuhkan.
      this.timer = setTimeout(() => { this.timer = null; this.terap = true; this.#tata(); }, pub.stage === 5 ? 1100 : 250);
    }
    this.#kepala(); this.#kartuSoal(); this.#tata();
  }

  #bangun() {
    const p = this.pub; const s = p.soal; const opsi = daftar(s.opsi); const n = opsi.length;
    clearTimeout(this.timer); this.timer = null; this.terap = false;
    this.kulit = KULIT[p.stage] || 'kartu';
    this.sk.dataset.kulit = this.kulit;
    this.urut = opsi.map(() => []);
    const jungkat = this.kulit === 'jungkat';
    const x0 = jungkat ? 150 : 40, x1 = jungkat ? 1450 : 1560, celah = jungkat ? 60 : 24;
    const w = (x1 - x0 - celah * (n - 1)) / n;
    this.zona = opsi.map((o, i) => ({ x: x0 + i * (w + celah), w, dasar: jungkat ? 600 : 650 }));
    const warna = (i) => (s.tipe === 'benar_salah' ? (i === 0 ? 'hijau' : 'merah') : HURUF[i]);
    const tanda = (i) => (s.tipe === 'benar_salah' ? (i === 0 ? '✔' : '✖') : BENTUK[i]);
    this.q('.d-zona').innerHTML = (jungkat ? '<div class="papan"></div><div class="poros"></div>' : '')
      + (this.kulit === 'timbang' ? '<div class="palang"></div>' : '')
      + (this.kulit === 'pulau' ? '<div class="daratan"></div>' : '')
      + this.zona.map((z, i) => `<div class="zona" data-i="${i}" style="left:${z.x}px;width:${z.w}px;--k:var(--${warna(i)})">
          <div class="papan-nama"><span class="tanda">${tanda(i)}</span><span>${esc(opsi[i])}</span><b class="jml"></b></div><div class="lantai"></div></div>`).join('');
    const d = this.q('.daratan'); if (d) d.style.transform = `scale(${Math.max(0.74, 1 - (p.ronde || 1) * 0.03)})`;
  }

  #kepala() {
    const p = this.pub; const buka = p.fase === 'buka';
    const kiri = p.stage === 5 ? `⚔️ Arena Terakhir · Ronde ${p.ronde}` : `Stage ${p.stage} · ${STAGE[p.stage].nama} · Soal ${p.nomor}/${p.jumlah}`;
    const kanan = buka ? `<span class="pil">Tersisa ${p.sisa ?? '–'} pemain</span>`
      : `<span class="pil" id="terjawab">Sudah menjawab ${p.terjawab || 0}/${p.sisa ?? 0}</span><span class="jam-besar" id="jam">${p.durasi}</span>`;
    const html = `<span class="merek"><b>INTEGRITY ADVENTURE</b><small>Biro SDMO · Komdigi</small></span><span class="pil">${kiri}</span><span class="dorong"></span>${kanan}`;
    const a = this.q('.d-atas'); const k = `${this.idSoal}|${buka}`;
    if (a.dataset.k !== k) { a.dataset.k = k; a.innerHTML = html; }
    else if (!buka) { const t = a.querySelector('#terjawab'); if (t) t.textContent = `Sudah menjawab ${p.terjawab || 0}/${p.sisa ?? 0}`; }
  }

  #kartuSoal() {
    const p = this.pub; const b = p.buka || {}; const el = this.q('.d-soal');
    const buka = p.fase === 'buka'; const k = `${this.idSoal}|${buka}`;
    if (el.dataset.k === k) return; el.dataset.k = k;
    el.classList.toggle('terbuka', buka);
    el.innerHTML = buka
      ? `<p class="kecil">${esc(p.soal.pertanyaan)}</p><p class="jwb">✅ ${esc(daftar(p.soal.opsi)[HURUF.indexOf(b.kunci)])} <span>— ${esc(b.penjelasan)}</span></p><div class="p-info">${this.info || ''}</div>`
      : `<p>${esc(p.soal.pertanyaan)}</p>`;
  }

  #tata() {
    const p = this.pub; const buka = p.fase === 'buka'; const b = p.buka || {};
    const semua = Object.keys(this.peserta).sort();
    const idSoal = p.soal.id;
    // Peserta yang baru dipenjara pada soal ini tetap digambar di arena sampai hasil diterapkan.
    const baruSel = (u) => this.peserta[u].kejadian?.id === idSoal && this.peserta[u].status === 'penjara';
    const diSel = (u) => this.peserta[u].status === 'penjara' && !(baruSel(u) && !(buka && this.terap));
    const main = semua.filter((u) => !diSel(u)); const tahanan = semua.filter(diSel);
    const S = main.length <= 12 ? 86 : main.length <= 30 ? 66 : main.length <= 50 ? 54 : 46;
    const adaNama = main.length <= 10;

    // Urutan kedatangan di tiap zona (agar tempat berdiri stabil).
    const tampilPilih = p.stage < 5 || buka;
    for (const u of main) {
      const i = tampilPilih ? HURUF.indexOf(this.pilih[u]) : -1;
      this.urut.forEach((arr, j) => { const at = arr.indexOf(u); if (j === i && at < 0) arr.push(u); if (j !== i && at >= 0) arr.splice(at, 1); });
    }
    for (const arr of this.urut) for (let k = arr.length - 1; k >= 0; k--) if (!main.includes(arr[k])) arr.splice(k, 1);

    // Jungkat-jungkit: miring ke sisi yang lebih ramai; saat dibuka, sisi yang salah terjungkal.
    let sudut = 0;
    if (this.kulit === 'jungkat') {
      const kiri = this.urut[0].length, kanan = this.urut[1]?.length || 0;
      sudut = Math.max(-6, Math.min(6, ((kanan - kiri) / Math.max(4, kiri + kanan)) * 8));
      if (buka && this.terap) sudut = b.kunci === 'a' ? 8 : -8; // sisi yang salah turun
      this.q('.papan').style.transform = `rotate(${sudut}deg)`;
    }
    const miring = (x) => (this.kulit === 'jungkat' ? (x - L / 2) * Math.tan((sudut * Math.PI) / 180) : 0);

    const iKunci = HURUF.indexOf(b.kunci);
    this.sk.querySelectorAll('.zona').forEach((z, i) => {
      z.classList.toggle('runtuh', buka && this.terap && i !== iKunci);
      z.classList.toggle('benar', buka && this.terap && i === iKunci);
      z.querySelector('.jml').textContent = tampilPilih && this.urut[i].length ? this.urut[i].length : '';
    });

    const petak = (i, x, w, dasar, langkah) => {
      const kol = Math.max(1, Math.floor((w - 16) / langkah));
      const cx = x + 8 + (i % kol) * langkah + (Math.floor(i / kol) % 2 ? langkah / 2 : 0);
      return [cx, dasar - Math.floor(i / kol) * S * 0.4];
    };
    const tunggu = main.filter((u) => !this.urut.some((arr) => arr.includes(u)));
    const tempat = new Map();
    this.urut.forEach((arr, j) => arr.forEach((u, i) => {
      const z = this.zona[j]; const [x, y] = petak(i, z.x, z.w - S * 0.5, z.dasar, S * 0.72);
      tempat.set(u, [x, y + miring(x + S / 2), j]);
    }));
    tunggu.forEach((u, i) => { const [x, y] = petak(i, 60, 1090 - S * 0.5, 868, S * 0.72); tempat.set(u, [x, y, -1]); });
    tahanan.forEach((u, i) => { const [x, y] = petak(i, 1232, 300, 868, 34); tempat.set(u, [x, y + 0, -2]); });
    this.q('.d-sel i').textContent = tahanan.length;

    for (const [uid, o] of this.orang) if (!this.peserta[uid]) { o.el.remove(); this.orang.delete(uid); }
    const wadah = this.q('.d-orang');
    for (const u of semua) {
      const d = this.peserta[u]; let o = this.orang.get(u);
      if (!o) {
        const el = document.createElement('div'); el.className = 'k';
        el.innerHTML = `<div class="badan">${karakterSVG(d.avatar || 0)}</div><b class="cap"></b><span class="nm">${esc(d.nama)}</span>`;
        el.style.setProperty('--w', warnaKe(d.warna));
        wadah.appendChild(el); o = { el, x: null, y: null }; this.orang.set(u, o);
      }
      const [x, y, zi] = tempat.get(u); const sel = zi === -2; const ukuran = sel ? 30 : S;
      const kiri = Math.round(x), atas = Math.round(y - ukuran * 1.18);
      if (o.x !== kiri || o.y !== atas) {
        const pertama = o.x === null; o.x = kiri; o.y = atas;
        if (pertama) { o.el.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { o.el.style.transition = ''; })); }
        o.el.style.transform = `translate(${kiri}px, ${atas}px)`;
        if (!pertama) { o.el.classList.add('jalan'); clearTimeout(o.t); o.t = setTimeout(() => o.el.classList.remove('jalan'), 750); }
      }
      o.el.style.setProperty('--u', ukuran + 'px'); o.el.style.zIndex = Math.round(y);
      const jenis = buka && this.terap && d.kejadian?.id === idSoal ? d.kejadian.jenis : '';
      const salahTempat = buka && this.terap && !sel && zi !== iKunci && jenis !== 'ulang';
      o.el.className = ['k', o.el.classList.contains('jalan') ? 'jalan' : '', sel ? 'tahanan' : '', adaNama && !sel ? 'bernama' : '',
        salahTempat ? 'ambles' : '', jenis === 'benar' || jenis === 'bonus' ? 'sorak' : '', jenis === 'bonus' ? 'bonus' : ''].join(' ');
      const cap = o.el.querySelector('.cap');
      const teks = sel || p.stage === 5 ? '' : d.status === 'sp1' ? 'SP 1' : d.status === 'sp2' ? 'SP 2' : '';
      if (cap.textContent !== teks) { cap.textContent = teks; cap.className = teks ? `cap ${d.status} baru` : 'cap'; }
    }
  }
}
