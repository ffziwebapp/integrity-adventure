// Layar panggung (dibagikan di Zoom). Bila dibuka oleh akun pemandu, layar ini juga yang menjalankan permainan:
// tombol MULAI ada di lobi, lalu soal dan stage berganti sendiri.
import { siapkan } from './toko.js';
import { STAGE, WARNA, esc, daftar, avatarHTML, hitungMundur, bunyi, pasangIkon, hidupkanKarakter, Musik } from './umum.js';
import { Wasit } from './wasit.js';
import { Dunia } from './dunia.js';

const akar = document.getElementById('akar');
pasangIkon();
hidupkanKarakter();
const el = (id) => document.getElementById(id);
const q = new URLSearchParams(location.search);
const kode = (q.get('r') || '').toUpperCase();
let toko, pub, peserta = {}, gerak = null, dunia = null, kunciLama = '', stopJam = null, wasit = null, pesan = '';
const dipenjara = new Set(); let pertama = true; const dikenal = new Set();

async function aksi(nama, tombol) {
  pesan = '';
  try {
    if (nama === 'salin') {
      await navigator.clipboard.writeText(urlMasuk());
      if (tombol) { const asli = tombol.textContent; tombol.textContent = 'Tautan tersalin ✓'; setTimeout(() => { tombol.textContent = asli; }, 1800); }
      return;
    }
    if (nama === 'musik') { Musik.alih(); gambarDok(); return; }
    if (!wasit?.pengemudi) return;
    if (nama === 'mulai') { Musik.mulai(); await wasit.perintah('lanjut'); }
    else if (nama === 'ganti') { if (confirm('Batalkan soal ini dan pakai soal pengganti?')) await wasit.perintah('ganti'); }
    else await wasit.perintah(nama);
  } catch (e) { console.error(e); pesan = e.message || String(e); }
  gambarDok(); if (pub?.fase === 'lobi') gambar(true);
}

// Kendali kecil untuk pemandu. Di tengah kuis hanya muncul saat kursor mendekat ke pojok kanan bawah.
function gambarDok() {
  const d = el('dok'); if (!d) return;
  el('jeda').hidden = !pub?.jeda;
  if (!wasit?.pengemudi || !pub) { d.hidden = !pesan; d.innerHTML = pesan ? `<span class="dok-pesan">${esc(pesan)}</span>` : ''; return; }
  const f = pub.fase; d.hidden = false;
  d.className = ['lobi', 'podium', 'tersulit'].includes(f) || pesan ? 'tampak' : '';
  const lanjut = f === 'podium' ? 'Soal paling menjebak' : f === 'tersulit' ? 'Selesai' : f === 'soal' ? 'Tutup soal' : 'Lewati tunggu';
  d.innerHTML = (pesan ? `<span class="dok-pesan">${esc(pesan)}</span>` : '')
    + (f === 'lobi' || f === 'selesai' ? '' : `<button data-a="lanjut" title="Spasi">${lanjut}</button>`)
    + (['lobi', 'podium', 'tersulit', 'selesai'].includes(f) ? '' : `<button data-a="jeda" title="P">${pub.jeda ? 'Lanjutkan' : 'Jeda'}</button>`)
    + (['soal', 'buka'].includes(f) ? '<button data-a="ganti" title="G">Ganti soal</button>' : '')
    + `<button data-a="musik" title="M">Musik: ${Musik.hidup ? 'nyala' : 'mati'}</button>`;
}

const urlMasuk = () => new URL(`index.html?r=${kode}${q.has('uji') ? '&uji' : ''}`, location.href).href;

function qrSVG(teks) {
  try { const g = window.qrcode(0, 'M'); g.addData(teks); g.make(); return g.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); } catch { return ''; }
}

function gambarAtas() {
  if (!pub) return;
  const f = pub.fase; let tengah = '';
  if (['soal', 'buka'].includes(f)) {
    tengah = pub.stage === 5 ? `<span class="pil">⚔️ Arena Terakhir · Ronde ${pub.ronde}</span>` : `<span class="pil">Stage ${pub.stage} · ${STAGE[pub.stage].nama}</span><span class="pil">Soal ${pub.nomor} dari ${pub.jumlah}</span>`;
  }
  const kanan = f === 'soal' ? `<span class="pil" id="terjawab">Sudah menjawab ${pub.terjawab || 0}/${pub.sisa ?? 0}</span><span class="jam-besar" id="jam">${pub.durasi}</span>`
    : f === 'lobi' ? '' : `<span class="pil">Tersisa ${pub.sisa ?? '–'} pemain</span>`;
  el('atas').innerHTML = `<span class="merek"><b>INTEGRITY ADVENTURE</b><small>Biro SDMO · Komdigi</small></span>${tengah}<span class="dorong"></span>${kanan}`;
}

function gambar(paksa) {
  if (pub === null) { akar.querySelector('#utama').innerHTML = '<div class="kartu"><h2>Ruang tidak ditemukan atau sudah dihapus.</h2></div>'; return; }
  if (!pub) return;
  const kunci = [pub.fase, pub.soal?.id, pub.stage, pub.ronde, pub.nomor].join('|') + (pub.fase === 'lobi' ? '|' + Object.keys(peserta).length + '|' + pub.terkunci : '');
  const diDunia = ['soal', 'buka'].includes(pub.fase) && !!pub.soal;
  dunia.tampil(diDunia); akar.firstElementChild?.classList.toggle('tertutup', diDunia); if (el('jeda')) el('jeda').hidden = !pub.jeda;
  if (diDunia) aturDunia();
  if (pub.fase === 'soal' && kunci === kunciLama) return;
  if (kunci === kunciLama && !paksa) return;
  kunciLama = kunci;
  if (stopJam) { stopJam(); stopJam = null; }
  gambarAtas(); gambarDok();
  const u = el('utama'); const f = pub.fase;
  Musik.tempo(pub.stage === 5 && ['intro', 'soal', 'buka'].includes(f) ? 136 : 112);
  el('bawah').style.display = ['lobi', 'podium', 'tersulit', 'selesai'].includes(f) ? 'none' : '';
  el('konfeti').innerHTML = '';
  if (f === 'lobi') u.innerHTML = vLobi();
  else if (f === 'intro') { u.innerHTML = vIntro(); bunyi('benar'); }
  else if (f === 'soal') { u.innerHTML = ''; pasangJam(); }
  else if (f === 'buka') { u.innerHTML = ''; bunyi('benar'); }
  else if (f === 'rekap') u.innerHTML = vRekap();
  else if (f === 'podium' || f === 'selesai') { u.innerHTML = vPodium(); konfeti(); bunyi('menang'); }
  else if (f === 'tersulit') u.innerHTML = vSulit();
  gambarBawah();
}

function vLobi() {
  const entri = Object.entries(peserta).sort((a, b) => (a[1].masukPada || 0) - (b[1].masukPada || 0));
  const semua = entri.map((e) => e[1]); const baru = new Set(entri.filter(([u]) => !dikenal.has(u)).map((e) => e[1]));
  entri.forEach(([u]) => dikenal.add(u));
  const url = urlMasuk();
  return `<div class="p-lobi"><div class="kartu kiri"><span class="pita">Kuis 9 Nilai Integritas</span><h2>Pindai untuk bergabung!</h2>
    <p class="sub">Pakai kamera HP, tanpa memasang aplikasi</p><div class="qr">${qrSVG(url)}</div>
    <div class="kotak-kode"><small>KODE RUANG</small><div class="kode">${esc(kode)}</div></div><div class="tautan">${esc(url)}</div>
    <button class="tb kecil salin" data-a="salin">Salin tautan ruang</button>
    <div class="hitung">${semua.length} pemain ${pub.terkunci ? '· pintu terkunci 🔒' : 'sudah masuk'}</div>
    ${wasit?.pengemudi ? `<button class="tb mulai" data-a="mulai" ${semua.length < 2 || wasit.jumlahBank === 0 ? 'disabled' : ''}>MULAI PERMAINAN</button><p class="sub">${wasit.jumlahBank === 0 ? 'Bank soal belum dimuat di panel pemandu.' : semua.length < 2 ? 'Menunggu minimal 2 pemain.' : 'Soal dan stage berjalan otomatis setelah dimulai.'}</p>` : ''}</div>
    <div class="dinding ${semua.length > 40 ? 'padat' : ''}">${semua.map((p) => `<div class="orang ${baru.has(p) ? 'baru' : ''}">${avatarHTML(p, 'lambai')}<span>${esc(p.nama)}</span></div>`).join('') || '<p class="kosong">Menunggu pemain pertama…</p>'}</div>
    <div class="p-aturan"><div class="a1">❤️<span><small>MODAL AWAL</small>3 nyawa</span></div><div class="a2">⚠️<span><small>SALAH 1× DAN 2×</small>SP 1, lalu SP 2</span></div>
    <div class="a3">🚔<span><small>SALAH 3×</small>Masuk penjara</span></div><div class="a4">🔥<span><small>5 BENAR BERUNTUN</small>+1 nyawa</span></div></div></div>`;
}

function vIntro() {
  const s = STAGE[pub.stage];
  return `<div class="p-intro"><span class="no">${pub.stage === 5 ? 'STAGE FINAL' : 'STAGE ' + pub.stage}</span><h1>${s.nama}</h1><p>${s.ket}</p>
    ${pub.stage === 5 ? '<p>Nyawa dan SP tidak berlaku lagi. Tiap ronde minimal sepertiga tersingkir!</p>' : ''}</div>`;
}

function aturDunia() {
  if (!dunia || !pub || !pub.soal || !['soal', 'buka'].includes(pub.fase)) return;
  dunia.atur(pub, peserta, gerak, pub.fase === 'buka' ? cipHasil() : '');
}

function cipHasil() {
  const b = pub.buka || {}; const cip = [];
  if (pub.stage === 5) {
    if (b.ulang) cip.push('<span class="cip kuning">Semua salah! Ronde diulang</span>');
    else cip.push(`<span class="cip merah">🚔 ${b.penjara || 0} tersingkir${daftar(b.keluar).length ? ': ' + daftar(b.keluar).slice(0, 8).map(esc).join(', ') + (daftar(b.keluar).length > 8 ? '…' : '') : ''}</span>`);
  } else {
    if (b.sp1) cip.push(`<span class="cip kuning">📄 ${b.sp1} kena SP 1</span>`);
    if (b.sp2) cip.push(`<span class="cip kuning">📄 ${b.sp2} kena SP 2</span>`);
    if (b.penjara) cip.push(`<span class="cip merah">🚔 ${b.penjara} masuk penjara</span>`);
    if (b.bonus) cip.push(`<span class="cip pink">❤️ ${b.bonus} dapat +1 nyawa</span>`);
    if (b.semuaTumbang) cip.push('<span class="cip kuning">Semua tumbang bersamaan! Langsung ke Arena Terakhir</span>');
    if (!cip.length) cip.push('<span class="cip">Semua selamat 👏</span>');
  }
  if (b.tanpaJawab) cip.push(`<span class="cip">⏰ ${b.tanpaJawab} tidak menjawab</span>`);
  return cip.join('');
}

function pasangJam() {
  const jam = document.querySelector('#dunia #jam'); let lalu = null; if (!jam) return;
  stopJam = hitungMundur(toko, pub.mulaiPada || toko.sekarang(), pub.durasi, (dtk) => {
    if (!jam.isConnected) return; jam.textContent = dtk; jam.classList.toggle('genting', dtk <= 3);
    if (dtk !== lalu && dtk <= 3 && dtk > 0) bunyi('tik'); lalu = dtk;
  });
}

function vRekap() {
  const r = pub.rekap || {};
  return `<div class="p-rekap"><h1>Stage ${pub.stage} selesai!</h1>
    <div class="empat"><div><b>${r.bersih || 0}</b><span>BERSIH</span><small>belum pernah kena SP</small></div>
    <div><b>${r.sp1 || 0}</b><span>SP 1</span><small>sisa 2 nyawa</small></div>
    <div><b>${r.sp2 || 0}</b><span>SP 2</span><small>sisa 1 nyawa</small></div>
    <div><b>${r.penjara || 0}</b><span>PENJARA</span><small>+${r.penjaraBaru || 0} di stage ini</small></div></div>
    <p class="sub-rekap">Peringkat poin sementara (benar + kecepatan)</p><div class="p-top">${daftar(r.top).map((p, i) => `<div>${avatarHTML(p, 'e-senang')}<span>${i + 1}. ${esc(p.nama)}</span><span>${p.poin || 0} poin</span></div>`).join('')}</div></div>`;
}

function vPodium() {
  const pd = daftar(pub.podium); const tk = (i) => pd[i] ? `<div class="tk k${i + 1}">${i === 0 ? '<div class="mahkota">👑</div>' : ''}${avatarHTML(pd[i], 'e-senang lompat')}<span>${esc(pd[i].nama)}</span><div class="balok">${i + 1}<small>${pd[i].poin || 0} poin</small></div></div>` : '';
  const pr = daftar(pub.peringkat);
  return `<div style="height:100%;width:100%;display:grid;grid-template-rows:auto 1fr;text-align:center"><h1 class="judul-podium">🏆 PEMENANG UTAMA</h1><div class="p-podium">${tk(1)}${tk(0)}${tk(2)}${pr.length ? `<div class="papan-poin"><h3>Poin tertinggi</h3>${pr.map((x, i) => `<div><b>${i + 1}</b>${avatarHTML(x)}<span>${esc(x.nama)}</span><i>${x.poin}</i></div>`).join('')}</div>` : ''}</div></div>`;
}

function vSulit() {
  const t = daftar(pub.tersulit);
  return `<div class="p-sulit"><h1>🧐 Soal Paling Menjebak</h1>${t.map((x) => `<div class="butir"><p>${esc(x.pertanyaan)}</p><b>${x.persen}% salah</b><small>✅ ${esc(x.jawaban)} — ${esc(x.penjelasan)}</small></div>`).join('') || '<div class="butir"><p>Tidak ada soal yang dijawab salah. Luar biasa!</p></div>'}</div>`;
}

function gambarBawah() {
  const b = el('bawah'); if (!b || !pub || pub.fase === 'lobi') return;
  const entri = Object.entries(peserta);
  const hidup = entri.filter(([, p]) => p.status !== 'penjara'); const sel = entri.filter(([, p]) => p.status === 'penjara');
  const idSoal = pub.soal?.id; const baruBuka = pub.fase === 'buka';
  const av = ([uid, p], kelas) => `<span title="${esc(p.nama)}">${avatarHTML(p, kelas)}</span>`;
  const htmlHidup = hidup.map((e) => av(e, baruBuka && e[1].kejadian?.id === idSoal && ['sp1', 'sp2'].includes(e[1].kejadian.jenis) ? 'kena' : '')).join('');
  const htmlSel = sel.map((e) => { const baru = !pertama && !dipenjara.has(e[0]); return av(e, (baru ? 'baru-jatuh ' : '') + 'e-tangis'); }).join('');
  sel.forEach(([u]) => dipenjara.add(u)); pertama = false;
  const arena = pub.stage === 5; const susut = arena ? Math.min(30, (pub.ronde || 0) * 4) : 0;
  b.innerHTML = `<div class="pulau" style="margin:0 ${susut}%"><h4>${arena ? '🏝️ Arena' : '🏃 Masih bertahan'} (${hidup.length})</h4><div class="gerombol ${hidup.length > 45 ? 'padat' : ''}">${htmlHidup}</div></div>
    <div class="penjara"><h4>🚔 Penjara (${sel.length})</h4><div class="gerombol ${sel.length > 24 ? 'padat' : ''}">${htmlSel}</div></div>`;
}

function konfeti() {
  el('konfeti').innerHTML = Array.from({ length: 60 }, (_, i) => `<i style="left:${Math.random() * 100}%;--w:${WARNA[i % 8]};animation-duration:${2.5 + Math.random() * 3}s;animation-delay:${Math.random() * 3}s"></i>`).join('');
}

// Mulai paling akhir, setelah semua fungsi dan konstanta di atas siap.
if (!kode) akar.innerHTML = '<div class="tengah"><div class="kartu"><h2>Kode ruang tidak ada di alamat.</h2><p>Buka panggung dari panel pemandu.</p></div></div>';
else {
  toko = await siapkan();
  const pemandu = await toko.penggunaPemandu();
  if (!pemandu) await toko.masukAnonim();
  akar.innerHTML = `<div class="panggung"><div class="p-atas" id="atas"></div><div class="p-utama" id="utama"></div><div class="p-bawah" id="bawah"></div></div><div id="dunia" style="display:none"></div><div class="konfeti" id="konfeti"></div><div id="jeda" hidden>Jeda · tekan P untuk lanjut</div><div id="dok" hidden></div>`;
  dunia = new Dunia(document.getElementById('dunia'));
  toko.pantau(`ruang/${kode}/publik`, (v) => { pub = v; gambar(); });
  toko.pantau(`ruang/${kode}/peserta`, (v) => { peserta = v || {}; gambarBawah(); if (pub?.fase === 'lobi') gambar(true); aturDunia(); });
  toko.pantau(`ruang/${kode}/gerak`, (v) => { gerak = v; aturDunia(); });
  if (pemandu) {
    wasit = new Wasit(toko, kode, () => { if (wasit?.galat) { pesan = wasit.galat; wasit.galat = ''; } gambarDok(); if (pub?.fase === 'lobi') gambar(true); }, { pengemudi: true });
    try { await wasit.mulai(); } catch (e) { console.error(e); pesan = 'Akun ini tidak punya hak pemandu.'; wasit = null; }
    if (wasit && !wasit.pengemudi) pesan = 'Panggung lain sedang mengendalikan permainan. Layar ini hanya menonton.';
    gambarDok(); gambar(true);
    if (q.has('uji')) window.__wasit = wasit;
  }
  akar.addEventListener('click', (e) => { const t = e.target.closest('[data-a]'); if (t) aksi(t.dataset.a, t); });
  addEventListener('keydown', (e) => {
    if (!wasit?.pengemudi || e.repeat || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
    const peta = { Space: pub?.fase === 'lobi' ? null : 'lanjut', KeyP: 'jeda', KeyM: 'musik', KeyG: 'ganti' };
    if (peta[e.code]) { e.preventDefault(); aksi(peta[e.code]); }
  });
}
