// Panel pemandu.
import { siapkan, UJI } from './toko.js';
import { Wasit } from './wasit.js';
import { HURUF, STAGE, LABEL_STATUS, esc, daftar, avatarHTML, bacaCSV, susunBank } from './umum.js';

const akar = document.getElementById('akar');
const q = new URLSearchParams(location.search);
const akhiran = q.has('uji') ? '&uji' : '';
let toko, wasit = null, pesan = '';
let kode = (q.get('r') || localStorage.getItem('ia-kode-pemandu') || '').toUpperCase();

toko = await siapkan();
if (await toko.penggunaPemandu()) await bukaRuang(); else vMasuk();

function vMasuk(galat = '') {
  akar.innerHTML = `<div class="hp"><h1 class="judul">Integrity Adventure</h1><div class="kartu"><h2>Masuk Pemandu</h2>
    <label class="lb" for="em">Email</label><input class="isian" id="em" type="email" autocomplete="username">
    <label class="lb" for="sd">Kata Sandi</label><input class="isian" id="sd" type="password" autocomplete="current-password">
    <p class="galat">${esc(galat)}</p><button class="tb" id="ok">MASUK</button></div></div>`;
  const kirim = async () => {
    const tb = akar.querySelector('#ok'); const g = akar.querySelector('.galat');
    const email = akar.querySelector('#em').value.trim(); const sandi = akar.querySelector('#sd').value;
    if (!email || !sandi) { g.textContent = 'Isi email dan kata sandi akun pemandu.'; return; }
    tb.disabled = true; g.textContent = '';
    try { await toko.masukPemandu(email, sandi); await bukaRuang(); }
    catch (e) {
      console.error(e); tb.disabled = false;
      const kode = e?.code || '';
      g.textContent = kode === 'auth/invalid-email' ? 'Format email tidak sah.'
        : kode === 'auth/too-many-requests' ? 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
        : kode === 'auth/network-request-failed' ? 'Tidak bisa menghubungi server. Periksa koneksi internet.'
        : 'Email atau kata sandi tidak cocok dengan akun pemandu di Firebase (Authentication → Users).';
      akar.querySelector('#sd').select();
    }
  };
  akar.querySelector('#ok').onclick = kirim;
  akar.querySelector('#sd').onkeydown = (e) => e.key === 'Enter' && kirim();
}

async function bukaRuang() {
  if (kode) {
    let ada = null;
    try { ada = await toko.baca(`ruang/${kode}/publik/fase`); } catch (e) { return vTolak(e); }
    if (!ada) { kode = ''; localStorage.removeItem('ia-kode-pemandu'); }
  }
  if (!kode) return vPilih();
  localStorage.setItem('ia-kode-pemandu', kode);
  wasit = new Wasit(toko, kode, gambar);
  try { await wasit.mulai(); } catch (e) { return vTolak(e); }
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); aksi('lanjut'); } });
  if (UJI) window.__wasit = wasit;
  gambar();
}

function vTolak(e) {
  console.error(e);
  akar.innerHTML = `<div class="hp"><div class="kartu"><h2>Akun ini tidak punya hak pemandu</h2><p>Pastikan UID akun pemandu sudah dimasukkan ke aturan database, lalu muat ulang.</p><br><button class="tb" id="klr">KELUAR</button></div></div>`;
  akar.querySelector('#klr').onclick = async () => { await toko.keluar(); location.reload(); };
}

function vPilih(galat = '') {
  akar.innerHTML = `<div class="hp"><h1 class="judul">Panel Pemandu</h1><div class="kartu"><h2>Ruang permainan</h2>
    <button class="tb" id="baru">BUAT RUANG BARU</button>
    <label class="lb" for="k">atau lanjutkan ruang yang sudah ada</label><input class="isian" id="k" maxlength="5" placeholder="Kode ruang">
    <p class="galat">${esc(galat)}</p><button class="tb kecil" id="buka">Buka ruang</button></div></div>`;
  akar.querySelector('#baru').onclick = async () => { try { kode = await Wasit.buatRuang(toko); await bukaRuang(); } catch (e) { vTolak(e); } };
  akar.querySelector('#buka').onclick = async () => { kode = akar.querySelector('#k').value.trim().toUpperCase(); await bukaRuang(); if (!kode) vPilih('Ruang tidak ditemukan.'); };
}

async function aksi(nama, arg) {
  pesan = '';
  try {
    if (nama === 'lanjut') await wasit.lanjut();
    else if (nama === 'ganti') { if (confirm('Batalkan soal ini dan pakai soal pengganti? Keadaan peserta dikembalikan seperti sebelum soal ini.')) await wasit.gantiSoal(); }
    else if (nama === 'kunci') await wasit.kunciPintu(!wasit.pub.terkunci);
    else if (nama === 'keluarkan') { if (confirm('Keluarkan peserta ini?')) await wasit.keluarkan(arg); }
    else if (nama === 'hapus') { if (confirm('Hapus ruang beserta seluruh datanya? Tindakan ini tidak bisa dibatalkan.')) { await wasit.hapusRuang(); localStorage.removeItem('ia-kode-pemandu'); location.href = location.pathname + (akhiran ? '?uji' : ''); } }
    else if (nama === 'keluarAkun') { await toko.keluar(); location.reload(); }
  } catch (e) { console.error(e); pesan = e.message || String(e); }
  gambar();
}

async function imporBank(berkas) {
  pesan = '';
  try {
    const { soal, galat } = susunBank(bacaCSV(await berkas.text()));
    const n = Object.keys(soal).length;
    if (n === 0) throw new Error('Tidak ada soal yang terbaca. Periksa nama kolom di baris pertama.');
    await wasit.muatBank(soal);
    const per = [1, 2, 3, 4, 5].map((s) => `S${s}: ${Object.values(soal).filter((x) => x.stage === s).length}`).join(', ');
    pesan = `${n} soal dimuat (${per}).` + (galat.length ? ` Dilewati ${galat.length}: ${galat.slice(0, 3).join('; ')}` : '');
  } catch (e) { console.error(e); pesan = 'Gagal memuat bank soal: ' + (e.message || e); }
  gambar();
}

function gambar() {
  if (!wasit) return;
  const p = wasit.pub;
  if (p === null) { akar.innerHTML = '<div class="hp"><div class="kartu"><h2>Ruang sudah dihapus.</h2></div></div>'; return; }
  if (!p) return;
  const semua = Object.entries(wasit.peserta).sort((a, b) => (a[1].status === 'penjara') - (b[1].status === 'penjara') || b[1].benar - a[1].benar);
  const aktif = semua.filter(([, x]) => x.status !== 'penjara').length;
  const urlMasuk = new URL(`index.html?r=${kode}${akhiran}`, location.href).href;
  const urlPanggung = new URL(`panggung.html?r=${kode}${akhiran}`, location.href).href;
  const nx = wasit.intip();
  const status = p.fase === 'lobi' ? 'Lobi' : p.fase === 'selesai' ? 'Selesai' : p.stage === 5 ? `Arena · Ronde ${p.ronde || 1} · ${p.fase}` : `Stage ${p.stage} ${STAGE[p.stage]?.nama || ''} · Soal ${p.nomor || '–'}/${p.jumlah || '–'} · ${p.fase}`;
  const bisaGanti = ['soal', 'buka'].includes(p.fase);
  const fokus = document.activeElement?.id;

  akar.innerHTML = `<div class="pemandu">
    <div class="kartu pm-atas"><span class="pm-kode">${esc(kode)}</span><span class="lencana juara">${esc(status)}</span>
      <span class="lencana">Aktif ${aktif}</span><span class="lencana penjara">Penjara ${semua.length - aktif}</span>
      <span style="margin-left:auto"></span>
      <a class="tb kecil" href="${esc(urlPanggung)}" target="_blank" rel="noopener">Buka Panggung ↗</a>
      <button class="tb kecil" data-a="keluarAkun">Keluar akun</button></div>
    <div class="dua">
      <div class="kartu">
        <button class="tb pm-lanjut" data-a="lanjut" ${p.fase === 'selesai' ? 'disabled' : ''}>${esc(wasit.labelLanjut())} <small style="font-size:14px">(Spasi)</small></button>
        <p class="galat">${esc(pesan)}</p>
        <div class="pm-baris">
          <button class="tb kecil" data-a="ganti" ${bisaGanti ? '' : 'disabled'}>Ganti / Ulang Soal</button>
          <button class="tb kecil" data-a="kunci">${p.terkunci ? '🔒 Buka pintu' : '🔓 Kunci pintu'}</button>
        </div>
        <div class="pm-intip" style="margin-top:14px"><span class="kecil-abu">${p.fase === 'soal' ? 'Soal yang sedang tampil' : 'Soal berikutnya'}</span>
          ${nx ? `<p>${esc(nx.pertanyaan)}</p><ol type="A">${nx.opsi.map((o, i) => `<li class="${HURUF[i] === nx.kunci ? 'k' : ''}">${esc(o)}${HURUF[i] === nx.kunci ? ' ✔' : ''}</li>`).join('')}</ol><p class="kecil-abu">💡 ${esc(nx.penjelasan)}</p>` : '<p class="kecil-abu">—</p>'}</div>
        <div style="margin-top:14px"><h2>Bank soal: ${wasit.jumlahBank} soal</h2>
          <p class="kecil-abu">Muat dari berkas CSV (ekspor dari Google Sheets). Kunci jawaban hanya tersimpan di akun pemandu.</p>
          <input type="file" id="csv" accept=".csv,text/csv" ${p.fase === 'lobi' ? '' : 'disabled'}></div>
        <div style="margin-top:14px"><h2>Tautan peserta</h2><input class="isian" style="font-size:15px" readonly value="${esc(urlMasuk)}" onclick="this.select()"></div>
        <div class="pm-baris"><button class="tb kecil bahaya" data-a="hapus">Hapus Ruang</button></div>
      </div>
      <div class="kartu"><h2>Peserta (${semua.length})</h2><div class="pm-gulir"><table class="pm"><tr><th></th><th>Nama</th><th>❤️</th><th>Status</th><th>🔥</th><th>Benar</th><th></th></tr>
        ${semua.map(([uid, x]) => `<tr><td>${avatarHTML(x, 'mini')}</td><td>${esc(x.nama)}</td><td>${x.nyawa}</td><td><span class="lencana ${x.status}">${LABEL_STATUS[x.status] || x.status}</span></td><td>${x.beruntun || 0}</td><td>${x.benar || 0}</td><td><button class="tb kecil bahaya" data-a="keluarkan" data-u="${esc(uid)}">✕</button></td></tr>`).join('')}
      </table></div></div>
    </div></div>`;
  akar.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => aksi(b.dataset.a, b.dataset.u); });
  const csv = akar.querySelector('#csv'); csv.onchange = () => csv.files[0] && imporBank(csv.files[0]);
  if (fokus) document.getElementById(fokus)?.focus();
}
