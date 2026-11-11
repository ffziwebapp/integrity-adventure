// Halaman peserta (HP).
import { siapkan, TS, UJI } from './toko.js';
import { JUMLAH_AVATAR, WARNA, HURUF, BENTUK, STAGE, LABEL_STATUS, esc, daftar, avatarHTML, hitungMundur, bunyi, pasangIkon } from './umum.js';

const akar = document.getElementById('akar');
pasangIkon();
const q = new URLSearchParams(location.search);
let toko, uid, kode = (q.get('r') || localStorage.getItem('ia-kode') || '').toUpperCase();
let pub, saya, lepas = [], kunciLama = '', stopJam = null, dikeluarkan = false, pernahAda = false;
const pilihan = JSON.parse(sessionStorage.getItem('ia-pilih') || '{}');
const form = { avatar: Math.floor(Math.random() * 16), warna: Math.floor(Math.random() * 8), nama: '', galat: '' };

function pasang() {
  lepas.forEach((f) => f()); lepas = []; pub = undefined; saya = undefined; kunciLama = '';
  if (!kode) return gambar();
  localStorage.setItem('ia-kode', kode);
  lepas.push(toko.pantau(`ruang/${kode}/publik`, (v) => { pub = v; gambar(); }, () => { pub = null; gambar(); }));
  lepas.push(toko.pantau(`ruang/${kode}/peserta/${uid}`, (v) => {
    if (v) pernahAda = true; else if (pernahAda && pub && pub.fase !== 'selesai') dikeluarkan = true;
    saya = v; gambar();
  }));
}

function bilah() {
  if (!saya) return `<div class="bilah"><span class="nama">👀 Penonton</span><span class="runtun">Tersisa ${pub.sisa ?? '–'}</span></div>`;
  const arena = pub.stage === 5 && saya.status !== 'penjara' && pub.fase !== 'lobi';
  const hati = saya.status === 'penjara' ? '' : arena ? '⚔️' : '❤️'.repeat(Math.min(saya.nyawa, 5)) + '🤍'.repeat(Math.max(0, 3 - saya.nyawa));
  const lenc = arena ? '<span class="lencana juara">ARENA</span>' : `<span class="lencana ${saya.status}">${LABEL_STATUS[saya.status] || ''}</span>`;
  const runtun = arena || saya.status === 'penjara' ? `Tersisa ${pub.sisa ?? '–'}` : `🔥 ${saya.beruntun || 0}/5`;
  return `<div class="bilah">${avatarHTML(saya, 'mini')}<span class="nama">${esc(saya.nama)}</span><span class="hati">${hati}</span>${lenc}<span class="runtun">${runtun}</span></div>`;
}

function tampilan() {
  if (!kode) return 'kode';
  if (pub === undefined || saya === undefined) return 'muat';
  if (pub === null) return 'tiada';
  if (dikeluarkan) return 'keluar';
  if (!saya && pub.fase === 'lobi' && !pub.terkunci) return 'masuk';
  return pub.fase;
}

function gambar() {
  const t = tampilan();
  const idSoal = pub?.soal?.id || '';
  const kunciBaru = [t, idSoal, pub?.stage, pub?.ronde, saya?.status, saya?.nyawa, saya?.kejadian?.id, pilihan[idSoal], !!saya, pub?.jumlahPemain, t === 'masuk' ? 'f' : ''].join('|');
  if (kunciBaru === kunciLama) return;
  const viewLama = kunciLama.split('|')[0]; kunciLama = kunciBaru;
  if (t === 'masuk' && viewLama === 'masuk') return; // jangan timpa isian yang sedang diketik
  if (stopJam) { stopJam(); stopJam = null; }
  akar.innerHTML = ({ kode: vKode, muat: vMuat, tiada: vTiada, keluar: vKeluar, masuk: vMasuk, lobi: vLobi, intro: vIntro, soal: vSoal, buka: vBuka, rekap: vRekap, podium: vAkhir, tersulit: vAkhir, selesai: vAkhir }[t] || vMuat)();
  ikat(t);
}

const vMuat = () => '<div class="tengah"><p class="ket">Memuat<span class="titik3"></span></p></div>';
const vKode = () => `<h1 class="judul">Integrity Adventure</h1><div class="kartu"><label class="lb" for="k">Kode Ruang</label>
  <input class="isian" id="k" maxlength="5" autocapitalize="characters" autocomplete="off" placeholder="5 huruf/angka">
  <p class="galat"></p><button class="tb" id="ok">LANJUT</button></div>`;
const vTiada = () => `<h1 class="judul">Integrity Adventure</h1><div class="kartu"><h2>Ruang "${esc(kode)}" tidak ditemukan</h2>
  <p>Periksa lagi kode dari pemandu.</p><br><button class="tb" id="ganti">GANTI KODE</button></div>`;
const vKeluar = () => `<div class="tengah"><div class="kartu"><h2>Kamu dikeluarkan dari ruang oleh pemandu.</h2></div></div>`;

function vMasuk() {
  return `<h1 class="judul">Integrity Adventure</h1><p class="sub-judul">Kuis 9 Nilai Integritas</p>
  <div class="kartu">
    <div class="kepala-kartu"><h2>Registrasi Peserta</h2><span class="cip-ruang">Ruang ${esc(kode)}</span></div>
    <label class="lb" for="nama">Nama Panggilan</label>
    <input class="isian" id="nama" maxlength="14" autocomplete="off" placeholder="2–14 karakter" value="${esc(form.nama)}">
    <label class="lb">Pilih Karakter</label>
    <div class="kisi-av">${Array.from({ length: JUMLAH_AVATAR }, (_, i) => `<button type="button" data-av="${i}" class="${i === form.avatar ? 'pilih' : ''}" aria-label="Karakter ${i + 1}" aria-pressed="${i === form.avatar}">${avatarHTML({ avatar: i, warna: form.warna })}</button>`).join('')}</div>
    <label class="lb">Warna Karakter</label>
    <div class="baris-warna">${WARNA.map((w, i) => `<button type="button" data-w="${i}" class="${i === form.warna ? 'pilih' : ''}" aria-label="Warna ${i + 1}"><i style="--w:${w}"></i></button>`).join('')}</div>
    <p class="galat" id="galat">${esc(form.galat)}</p>
    <button class="tb" id="masuk">MASUK KE PERMAINAN</button>
    <p class="kecil-abu" style="text-align:center;margin-top:10px">Buka di satu tab saja ya.</p>
  </div>`;
}

function vLobi() {
  return `${bilah()}<div class="tengah">${avatarHTML(saya, 'super')}
    <h1 class="judul">${esc(saya.nama)}</h1>
    <p class="ket">${pub.jumlahPemain || 1} pemain sudah masuk</p>
    <div class="kartu aturan"><span>❤️ Kamu punya 3 nyawa</span><span>📄 Salah 1× = SP 1, salah 2× = SP 2</span><span>🚔 Salah 3× = masuk penjara</span><span>🔥 5 benar beruntun = +1 nyawa</span><span>⚔️ Stage terakhir: satu salah langsung penjara</span></div>
    <p class="ket">Menunggu pemandu memulai<span class="titik3"></span></p></div>`;
}

function vIntro() {
  const s = STAGE[pub.stage];
  return `${bilah()}<div class="tengah"><span class="lencana juara" style="font-size:18px">STAGE ${pub.stage}</span>
    <h1 class="judul" style="font-size:44px">${s.nama}</h1><p class="ket">${s.ket}</p>
    ${pub.stage === 5 && saya && saya.status !== 'penjara' ? '<div class="spanduk">Nyawa dan SP tidak berlaku lagi. Jawab benar DAN cepat!</div>' : ''}
    <p class="ket">Bersiap<span class="titik3"></span></p></div>`;
}

const penonton = () => !saya || saya.status === 'penjara';

function tombolOpsi(soal, terpilih) {
  const pintu = soal.tipe === 'benar_salah';
  const pendek = !pintu && daftar(soal.opsi).every((o) => o.length <= 16);
  return `<div class="opsi ${pintu ? 'pintu' : ''} ${pendek ? 'kisi' : ''} ${terpilih ? 'kunci-sudah' : ''}">${daftar(soal.opsi).map((o, i) =>
    `<button data-p="${HURUF[i]}" style="--k:var(--${HURUF[i]})" class="${terpilih === HURUF[i] ? 'pilih' : ''}" ${terpilih ? 'disabled' : ''}>
      <span class="tanda">${pintu ? (i === 0 ? '✔' : '✖') : BENTUK[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
}

function vSoal() {
  const s = pub.soal; const arena = pub.stage === 5; const terpilih = pilihan[s.id];
  const label = arena ? `Arena Terakhir · Ronde ${pub.ronde}` : `Stage ${pub.stage} · ${STAGE[pub.stage].nama} · Soal ${pub.nomor}/${pub.jumlah}`;
  return `${bilah()}
    ${arena && !penonton() ? '<div class="spanduk">ARENA TERAKHIR — satu kesalahan = penjara</div>' : ''}
    ${penonton() ? '<p class="label-stage">👀 Kamu menonton. Tebakanmu tidak dihitung.</p>' : ''}
    <p class="label-stage">${label}</p>
    <div class="jam" id="jam"><span>${pub.durasi}</span></div>
    <div class="kartu soal">${esc(s.pertanyaan)}</div>
    <p class="terkirim" id="terkirim">${terpilih ? (penonton() ? 'Tebakan dicatat ✓' : 'Terkirim ✓ Lihat karaktermu di layar!') : ''}</p>
    ${tombolOpsi(s, terpilih)}`;
}

function vBuka() {
  const s = pub.soal; const b = pub.buka || {}; const terpilih = pilihan[s.id];
  const iKunci = HURUF.indexOf(b.kunci);
  const jenis = saya?.kejadian?.id === s.id ? saya.kejadian.jenis : null;
  let atas;
  if (jenis === 'benar') atas = '<p class="vonis">BENAR! 🎉</p>';
  else if (jenis === 'bonus') atas = '<p class="vonis">BENAR! 🎉</p><div class="bonus">❤️ +1 NYAWA · 5 BERUNTUN!</div>';
  else if (jenis === 'sp1') atas = `<p class="vonis salah">${terpilih ? 'SALAH' : 'WAKTU HABIS'}</p><div class="surat">SP 1<small>Surat Peringatan Pertama</small></div>`;
  else if (jenis === 'sp2') atas = `<p class="vonis salah">${terpilih ? 'SALAH' : 'WAKTU HABIS'}</p><div class="surat sp2">SP 2<small>Satu lagi masuk penjara!</small></div>`;
  else if (jenis === 'penjara') atas = `<p class="vonis salah">${terpilih ? 'SALAH' : 'WAKTU HABIS'}</p><div class="sel">${avatarHTML(saya, 'besar')}</div><p class="ket">Kamu masuk PENJARA 🚔</p>`;
  else if (jenis === 'lambat') atas = `<p class="vonis salah">BENAR, TAPI…</p><div class="sel">${avatarHTML(saya, 'besar')}</div><p class="ket">Kamu termasuk yang paling lambat. Zona menyempit!</p>`;
  else if (jenis === 'ulang') atas = '<p class="vonis salah">SEMUA SALAH!</p><p class="ket">Tidak ada yang tersingkir. Ronde diulang.</p>';
  else atas = `<p class="vonis ${terpilih === b.kunci ? '' : 'salah'}">${!terpilih ? 'Jawabannya…' : terpilih === b.kunci ? 'Tebakanmu benar' : 'Tebakanmu salah'}</p>`;
  const bagus = ['benar', 'bonus'].includes(jenis) || (!jenis && terpilih === b.kunci);
  return `${bilah()}<div class="hero ${bagus ? '' : jenis === 'ulang' || !terpilih && !jenis ? 'netral' : 'salah'}">${atas}</div>
    <div class="kunci-jwb"><small>KUNCI JAWABAN</small><b>${esc(daftar(s.opsi)[iKunci])}</b><p>${esc(b.penjelasan)}</p></div>
    <p class="tunggu">Menunggu soal berikutnya<span class="titik3"></span></p>`;
}

function vRekap() {
  if (penonton()) return `${bilah()}<div class="tengah">${saya ? `<div class="sel">${avatarHTML(saya, 'besar')}</div>` : ''}<p class="ket">Stage ${pub.stage} selesai. Tersisa ${pub.sisa} pemain.</p></div>`;
  const lanjut = pub.stage >= 4 ? 'ARENA TERAKHIR' : `Stage ${pub.stage + 1}`;
  return `${bilah()}<div class="tengah"><p class="vonis">LANJUT! 🏃</p>${avatarHTML(saya, 'super')}
    <p class="ket">Kamu maju ke ${lanjut}</p>
    <div class="kartu aturan"><span>Status: ${LABEL_STATUS[saya.status]}</span><span>Nyawa: ${saya.nyawa}</span><span>Total benar: ${saya.benar}</span></div></div>`;
}

function vAkhir() {
  const juara = saya?.status === 'juara';
  const pd = daftar(pub.podium);
  return `${bilah()}<div class="tengah">${juara ? `<div style="font-size:70px">👑</div>${avatarHTML(saya, 'super')}<p class="vonis">KAMU JUARANYA!</p>`
    : `<p class="vonis">Selesai!</p><p class="ket">Pemenang utama:</p>${pd[0] ? `${avatarHTML(pd[0], 'besar')}<h1 class="judul">${esc(pd[0].nama)}</h1>` : ''}`}
    ${saya ? `<div class="kartu aturan"><span>Total jawaban benarmu: ${saya.benar}</span></div>` : ''}
    <p class="ket">Terima kasih sudah ikut bermain 🙌</p></div>`;
}

function ikat(t) {
  if (t === 'kode') {
    const k = akar.querySelector('#k'); const kirim = () => { const v = k.value.trim().toUpperCase(); if (v.length < 4) { akar.querySelector('.galat').textContent = 'Kode belum lengkap.'; return; } kode = v; pasang(); };
    akar.querySelector('#ok').onclick = kirim; k.onkeydown = (e) => { if (e.key === 'Enter') kirim(); };
  }
  if (t === 'tiada') akar.querySelector('#ganti').onclick = () => { kode = ''; localStorage.removeItem('ia-kode'); pasang(); };
  if (t === 'masuk') {
    const nama = akar.querySelector('#nama'); nama.oninput = () => { form.nama = nama.value; };
    akar.querySelectorAll('[data-av]').forEach((b) => { b.onclick = () => { form.avatar = +b.dataset.av; akar.querySelectorAll('[data-av]').forEach((x) => { x.classList.toggle('pilih', x === b); x.setAttribute('aria-pressed', x === b); }); }; });
    akar.querySelectorAll('[data-w]').forEach((b) => { b.onclick = () => {
      form.warna = +b.dataset.w; akar.querySelectorAll('[data-w]').forEach((x) => x.classList.toggle('pilih', x === b));
      akar.querySelectorAll('[data-av] .av').forEach((a) => a.style.setProperty('--w', WARNA[form.warna]));
    }; });
    akar.querySelector('#masuk').onclick = async (e) => {
      const n = form.nama.trim().replace(/\s+/g, ' ');
      const g = akar.querySelector('#galat');
      if (n.length < 2 || n.length > 14) { g.textContent = 'Nama panggilan 2–14 karakter.'; return; }
      e.target.disabled = true; g.textContent = '';
      try {
        await toko.tulis(`ruang/${kode}/peserta/${uid}`, { nama: n, avatar: form.avatar, warna: form.warna, nyawa: 3, beruntun: 0, status: 'aktif', benar: 0, waktu: 0, masukPada: TS });
      } catch (err) { console.error(err); g.textContent = 'Gagal masuk. Mungkin permainan sudah dimulai.'; e.target.disabled = false; }
    };
  }
  if (t === 'soal') {
    const s = pub.soal; const jam = akar.querySelector('#jam'); let detikLalu = null;
    stopJam = hitungMundur(toko, pub.mulaiPada || toko.sekarang(), pub.durasi, (dtk, porsi) => {
      jam.style.setProperty('--p', porsi); jam.firstElementChild.textContent = dtk; jam.classList.toggle('genting', dtk <= 3);
      if (dtk !== detikLalu && dtk <= 3 && dtk > 0) bunyi('tik'); detikLalu = dtk;
      if (dtk === 0) akar.querySelectorAll('.opsi button').forEach((b) => { b.disabled = true; });
    });
    akar.querySelectorAll('.opsi button').forEach((b) => { b.onclick = () => jawab(s.id, b.dataset.p); });
  }
  if (t === 'buka') {
    const j = saya?.kejadian?.id === pub.soal.id ? saya.kejadian.jenis : null;
    bunyi(j === 'benar' || j === 'bonus' ? 'benar' : j ? 'salah' : 'tik');
    if (navigator.vibrate && j && j !== 'benar' && j !== 'bonus') navigator.vibrate(200);
  }
}

async function jawab(id, huruf) {
  if (pilihan[id] || pub?.fase !== 'soal' || pub.soal.id !== id) return;
  pilihan[id] = huruf; sessionStorage.setItem('ia-pilih', JSON.stringify(pilihan));
  gambar();
  if (penonton()) return;
  for (let coba = 0; coba < 4; coba++) {
    try { await toko.tulis(`ruang/${kode}/jawaban/${id}/${uid}`, { pilihan: huruf, pada: TS }); return; } catch (e) {
      console.warn('kirim ulang', e);
      if (pub?.fase !== 'soal' || pub.soal?.id !== id) break;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  const el = akar.querySelector('#terkirim'); if (el) el.textContent = '⚠️ Gagal terkirim. Periksa koneksi.';
}

// Mulai paling akhir, setelah semua fungsi tampilan di atas siap dipakai.
akar.innerHTML = '<div class="tengah"><p class="ket">Menyambungkan<span class="titik3"></span></p></div>';
try {
  toko = await siapkan(); uid = await toko.masukAnonim();
  pasang();
} catch (e) {
  console.error(e);
  akar.innerHTML = `<div class="tengah"><div class="kartu"><h2>Gagal tersambung</h2><p>Periksa koneksi internet, lalu muat ulang halaman ini.</p><p class="kecil-abu" style="margin-top:10px;word-break:break-word">Rincian: ${esc(e?.code || '')} ${esc(e?.message || e)}</p></div></div>`;
}

if (UJI) window.__ia = { get pub() { return pub; }, get saya() { return saya; }, jawab };
