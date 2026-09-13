/* ---------- 0. GERBANG LOGIN (Nama, No. Absen, Kelas) ---------- */
(() => {
  const STUDENT_KEY = 'statlearn_student';
  const overlay = document.getElementById('loginOverlay');
  const siteApp = document.getElementById('siteApp');
  const form = document.getElementById('loginForm');
  const namaInput = document.getElementById('loginNama');
  const absenInput = document.getElementById('loginAbsen');
  const kelasBtns = document.querySelectorAll('.login-kelas-btn');
  const errorEl = document.getElementById('loginError');
  const studentChip = document.getElementById('studentChip');
  const studentChipText = document.getElementById('studentChipText');
  if (!overlay || !siteApp || !form) return;

  let selectedKelas = null;

  kelasBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedKelas = btn.dataset.kelas;
      kelasBtns.forEach(b => b.classList.toggle('active', b === btn));
      if (errorEl) errorEl.textContent = '';
    });
  });

  function getStudent() {
    try {
      const raw = sessionStorage.getItem(STUDENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStudent(student) {
    try { sessionStorage.setItem(STUDENT_KEY, JSON.stringify(student)); } catch (e) { /* abaikan */ }
  }

  function clearStudent() {
    try { sessionStorage.removeItem(STUDENT_KEY); } catch (e) { /* abaikan */ }
  }

  function showApp(student) {
    overlay.hidden = true;
    siteApp.hidden = false;
    document.body.style.overflow = '';
    if (studentChipText) {
      studentChipText.textContent = student.nama;
    }
  }

  function showLogin() {
    siteApp.hidden = true;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  const existing = getStudent();
  if (existing && existing.nama && existing.kelas && existing.absen) {
    showApp(existing);
  } else {
    showLogin();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = (namaInput.value || '').trim();
    const absen = (absenInput.value || '').trim();

    if (!nama) {
      errorEl.textContent = 'Nama tidak boleh kosong.';
      namaInput.focus();
      return;
    }
    if (!absen || Number(absen) <= 0) {
      errorEl.textContent = 'Nomor absen tidak valid.';
      absenInput.focus();
      return;
    }
    if (!selectedKelas) {
      errorEl.textContent = 'Pilih kelasmu dulu (7, 8, atau 9).';
      return;
    }

    const student = { nama, absen, kelas: selectedKelas };
    saveStudent(student);
    errorEl.textContent = '';
    showApp(student);
  });

  if (studentChip) {
    studentChip.addEventListener('click', () => {
      const ok = window.confirm('Ganti data siswa? Kamu akan diminta mengisi ulang nama, nomor absen, dan kelas.');
      if (!ok) return;
      clearStudent();
      form.reset();
      selectedKelas = null;
      kelasBtns.forEach(b => b.classList.remove('active'));
      if (typeof goTo === 'function') goTo('beranda');
      showLogin();
      namaInput.focus();
    });
  }
})();

const pages = document.querySelectorAll('.page');

function showPage(id) {
  if (!id) id = 'beranda';
  let found = false;
  pages.forEach(p => {
    const match = p.dataset.page === id;
    p.classList.toggle('active', match);
    if (match) found = true;
  });
  if (!found) {
    document.getElementById('page-beranda').classList.add('active');
    id = 'beranda';
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  return id;
}

function goTo(id) {
  const resolved = showPage(id);
  history.replaceState(null, '', '#' + resolved);
}

function currentHashId() {
  return (location.hash || '#beranda').replace('#', '');
}

window.addEventListener('hashchange', () => showPage(currentHashId()));
showPage(currentHashId());

/* Delegasi klik: semua elemen dengan [data-goto] akan berpindah halaman.
   Jika elemen juga punya [data-tab], setelah pindah halaman kita otomatis
   memilih slide/tab yang dituju (dipakai oleh tombol "Kalkulator & Diagram"
   di dalam Materi / Penyajian Data / Studi Kasus). */
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-goto]');
  if (!trigger) return;
  e.preventDefault();
  goTo(trigger.dataset.goto);
  const wantedTab = trigger.dataset.tab;
  if (wantedTab) {
    requestAnimationFrame(() => {
      const page = document.getElementById('page-' + trigger.dataset.goto);
      if (!page) return;
      const tabBtn = page.querySelector(`[data-tab-target="${wantedTab}"]`);
      if (tabBtn) tabBtn.click();
    });
  }
});

/* ---------- 1b. TAB / SLIDE SWITCHER (dipakai di beberapa halaman) ---------- */
document.querySelectorAll('.page').forEach(page => {
  const tabButtons = page.querySelectorAll('[data-tab-target]');
  if (!tabButtons.length) return;
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tabTarget;
      page.querySelectorAll('[data-tab-target]').forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      page.querySelectorAll('[data-tab-panel]').forEach(p => {
        p.classList.toggle('active', p.dataset.tabPanel === target);
      });
    });
  });
});

/* ---------- 2b. DATA 5 AKTIVITAS PBL (satu aktivitas per TP) ---------- */
const ACTIVITIES = [
  {
    tp: 'TP.1',
    badge: 'PBL · Merumuskan Pertanyaan & Mengumpulkan Data',
    title: 'Survei Camilan Favorit Sekelas',
    summary: 'Rumuskan pertanyaan penelitian sederhana, lalu kumpulkan &amp; susun datanya ke tabel frekuensi.',
    icon: 'fa-solid fa-clipboard-question',
    color: 'blue',
    stages: {
      orientasi: {
        bar: 'bar-amber', icon: 'fa-solid fa-lightbulb',
        html: `<p>Panitia acara buka bersama/akhir tahun kelas ingin menyediakan camilan, tapi belum tahu <strong>camilan apa yang paling disukai teman-teman sekelas</strong>. Selama ini mereka cuma menebak-nebak, dan camilannya sering tidak habis atau malah kurang.</p>
        <p><strong>Pertanyaan besar:</strong> Bagaimana cara mengumpulkan data camilan favorit sekelas secara rapi, lalu menyajikannya supaya panitia bisa mengambil keputusan?</p>
        <p class="hint" style="margin-top:14px;"><i class="fa-solid fa-lightbulb hint-icon" aria-hidden="true"></i> Coba pikirkan dulu: pertanyaan survei seperti apa yang paling pas untuk ditanyakan ke teman-teman?</p>`
      },
      organisasi: {
        bar: 'bar-green', icon: 'fa-solid fa-people-group',
        html: `<p>Ikuti arahan guru untuk berkumpul dalam kelompok kecil (<strong>4 anggota</strong>).</p>
        <ul class="materi-list">
          <li>Duduklah bersama kelompokmu.</li>
          <li>Tunjuk satu orang sebagai <strong>juru bicara</strong> yang akan presentasi di tahap akhir.</li>
          <li>Tunjuk satu orang sebagai <strong>pencatat</strong> yang menuliskan hasil survei.</li>
        </ul>`
      },
      bimbingan: {
        bar: 'bar-blue', icon: 'fa-solid fa-compass',
        html: `<p>Bersama kelompokmu, kerjakan langkah berikut. Guru akan berkeliling membimbing tiap kelompok:</p>
        <ol class="steps-list">
          <li>Rumuskan <strong>satu pertanyaan survei</strong> yang jelas, misalnya "Apa camilan favoritmu di antara: keripik, biskuit, cokelat, atau buah?".</li>
          <li>Tanyakan ke minimal <strong>15 teman sekelas</strong> (boleh lintas kelompok), catat jawabannya dengan turus.</li>
          <li>Susun hasilnya ke dalam <strong>tabel frekuensi</strong> (kategori camilan &amp; jumlah pemilih).</li>
        </ol>`
      },
      pengembangan: {
        bar: 'bar-purple', icon: 'fa-brands fa-google-drive',
        html: `<p>Tuliskan pertanyaan survei, tabel frekuensi, dan kesimpulan kelompokmu pada lembar kerja di Google Drive berikut. Cantumkan nama kelompok dan nama anggota di bagian atas.</p>
        <a class="btn-primary pbl-drive-btn" href="https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_KELAS" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-google-drive" aria-hidden="true"></i> Buka Lembar Kerja Kelompok (Google Drive)
        </a>
        <p class="hint" style="margin-top:14px;"><i class="fa-solid fa-lightbulb hint-icon" aria-hidden="true"></i> Link belum aktif? Minta link folder Google Drive kelasmu dari guru.</p>`
      },
      evaluasi: {
        bar: 'bar-teal', icon: 'fa-solid fa-clipboard-check',
        html: `<p>Beberapa kelompok akan ditunjuk secara acak oleh guru untuk mempresentasikan tabel frekuensi hasil surveinya. Kelompok lain menanggapi dan membandingkan hasil.</p>
        <p>Setelah presentasi selesai, lanjutkan mengerjakan soal evaluasi secara individu untuk mengecek pemahamanmu.</p>`
      }
    }
  },
  {
    tp: 'TP.2',
    badge: 'PBL · Menyajikan Data dalam Diagram',
    title: 'Dari Tabel ke Diagram: Ekstrakurikuler Sekolah',
    summary: 'Ubah data tabel menjadi diagram batang &amp; diagram lingkaran yang tepat dan mudah dibaca.',
    icon: 'fa-solid fa-chart-column',
    color: 'green',
    stages: {
      orientasi: {
        bar: 'bar-amber', icon: 'fa-solid fa-lightbulb',
        html: `<p>OSIS mengumpulkan data jumlah siswa kelas VIII yang mengikuti tiap ekstrakurikuler:</p>
        <p class="case-data">Bola: 24, Musik: 16, Tari: 10, Paskibra: 20, PMR: 14</p>
        <p>Data ini masih berupa daftar angka biasa dan sulit dipahami sekilas mata saat rapat OSIS. Mereka juga ingin tahu <strong>berapa persen</strong> siswa yang memilih tiap ekstrakurikuler dari total keseluruhan.</p>
        <p><strong>Pertanyaan besar:</strong> Diagram apa yang paling pas untuk membandingkan jumlah tiap ekstrakurikuler, dan diagram apa yang paling pas untuk menunjukkan persentasenya?</p>`
      },
      organisasi: {
        bar: 'bar-green', icon: 'fa-solid fa-people-group',
        html: `<p>Berkumpullah dengan kelompokmu (<strong>4 anggota</strong>). Tunjuk satu juru bicara dan satu pencatat/penggambar diagram.</p>`
      },
      bimbingan: {
        bar: 'bar-blue', icon: 'fa-solid fa-compass',
        html: `<ol class="steps-list">
          <li>Hitung <strong>total</strong> seluruh siswa dari data di atas, lalu hitung persentase tiap ekstrakurikuler.</li>
          <li>Gambar data tersebut sebagai <strong>diagram batang</strong> (boleh manual di kertas, boleh pakai slide <button type="button" class="link-btn" data-goto="materi-penyajian" data-tab="kalkulator">Kalkulator &amp; Diagram</button>).</li>
          <li>Gambar ulang data yang sama sebagai <strong>diagram lingkaran</strong>, lalu bandingkan: cerita apa yang lebih jelas ditangkap dari tiap jenis diagram?</li>
        </ol>`
      },
      pengembangan: {
        bar: 'bar-purple', icon: 'fa-brands fa-google-drive',
        html: `<p>Unggah foto/screenshot kedua diagram beserta kesimpulan kelompokmu ke lembar kerja Google Drive berikut.</p>
        <a class="btn-primary pbl-drive-btn" href="https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_KELAS" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-google-drive" aria-hidden="true"></i> Buka Lembar Kerja Kelompok (Google Drive)
        </a>`
      },
      evaluasi: {
        bar: 'bar-teal', icon: 'fa-solid fa-clipboard-check',
        html: `<p>Beberapa kelompok mempresentasikan diagramnya di depan kelas. Diskusikan bersama: kapan sebaiknya memakai diagram batang, kapan diagram lingkaran?</p>
        <p>Lanjutkan dengan mengerjakan soal evaluasi secara individu.</p>`
      }
    }
  },
  {
    tp: 'TP.3',
    badge: 'PBL · Mean, Median, Modus, Jangkauan',
    title: 'Uang Jajan Sekelompok Teman',
    summary: 'Hitung mean, median, modus, dan jangkauan dari data uang jajan, lalu tentukan mana yang paling mewakili.',
    icon: 'fa-solid fa-sack-dollar',
    color: 'amber',
    stages: {
      orientasi: {
        bar: 'bar-amber', icon: 'fa-solid fa-lightbulb',
        html: `<p>Selama satu minggu, tujuh siswa mencatat uang jajan harian mereka (dalam ribuan rupiah):</p>
        <p class="case-data">10, 12, 10, 11, 50, 10, 12</p>
        <p>Salah satu siswa mendapat uang saku ekstra 50 ribu di hari Sabtu karena diajak pamannya jalan-jalan. Wali kelas ingin tahu <strong>berapa kira-kira uang jajan harian "khas"</strong> anak-anak di kelompok ini, untuk dijadikan patokan saat merencanakan tabungan kelas.</p>
        <p><strong>Pertanyaan besar:</strong> Ukuran pemusatan mana — mean, median, atau modus — yang paling tepat mewakili kebiasaan uang jajan kelompok ini? Kenapa?</p>
        <p class="hint" style="margin-top:14px;"><i class="fa-solid fa-lightbulb hint-icon" aria-hidden="true"></i> Coba pikirkan dulu jawabanmu sendiri, sebelum lanjut ke tahap "Mengorganisasikan".</p>`
      },
      organisasi: {
        bar: 'bar-green', icon: 'fa-solid fa-people-group',
        html: `<p>Ikuti arahan guru untuk berkumpul dalam kelompok kecil. Setiap kelompok terdiri dari <strong>4 anggota</strong>.</p>
        <ul class="materi-list">
          <li>Duduklah bersama kelompokmu.</li>
          <li>Tunjuk satu orang sebagai <strong>juru bicara</strong> yang akan presentasi di tahap akhir.</li>
          <li>Tunjuk satu orang sebagai <strong>pencatat</strong> yang menuliskan hasil diskusi.</li>
        </ul>`
      },
      bimbingan: {
        bar: 'bar-blue', icon: 'fa-solid fa-compass',
        html: `<p>Bersama tiga teman sekelompok, diskusikan masalah pada tahap <strong>Orientasi Masalah</strong>. Guru akan berkeliling membimbing tiap kelompok — jangan ragu bertanya bila bingung. Gunakan panduan berikut saat berdiskusi:</p>
        <ul class="materi-list">
          <li>Hitung mean, median, dan modus dari data uang jajan tersebut.</li>
          <li>Bandingkan ketiga hasilnya — apakah nilainya berbeda jauh?</li>
          <li>Tentukan angka mana yang paling wajar mewakili "uang jajan sehari-hari" kelompok ini, dan jelaskan alasannya.</li>
        </ul>`
      },
      pengembangan: {
        bar: 'bar-purple', icon: 'fa-brands fa-google-drive',
        html: `<p>Tuliskan hasil perhitungan dan kesimpulan kelompokmu pada lembar kerja di Google Drive berikut. Cantumkan nama kelompok dan nama anggota di bagian atas lembar kerja.</p>
        <a class="btn-primary pbl-drive-btn" href="https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_KELAS" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-google-drive" aria-hidden="true"></i> Buka Lembar Kerja Kelompok (Google Drive)
        </a>
        <p class="hint" style="margin-top:14px;"><i class="fa-solid fa-lightbulb hint-icon" aria-hidden="true"></i> Link belum aktif? Minta link folder Google Drive kelasmu dari guru.</p>`
      },
      evaluasi: {
        bar: 'bar-teal', icon: 'fa-solid fa-clipboard-check',
        html: `<p>Beberapa kelompok akan ditunjuk secara acak oleh guru untuk mempresentasikan hasil diskusinya di depan kelas. Kelompok lain menanggapi dan membandingkan jawaban.</p>
        <p>Setelah sesi presentasi selesai, lanjutkan sendiri-sendiri mengerjakan soal evaluasi untuk mengecek pemahamanmu secara individu.</p>`
      }
    }
  },
  {
    tp: 'TP.4',
    badge: 'PBL · Menafsirkan Hasil dalam Konteks Nyata',
    title: 'Membaca Hasil Try Out Matematika',
    summary: 'Hitung ukuran pemusatan lalu tafsirkan maknanya untuk mengambil keputusan nyata.',
    icon: 'fa-solid fa-file-signature',
    color: 'purple',
    stages: {
      orientasi: {
        bar: 'bar-amber', icon: 'fa-solid fa-lightbulb',
        html: `<p>Nilai try out matematika 9 siswa kelas VIII adalah:</p>
        <p class="case-data">40, 45, 50, 48, 52, 47, 46, 95, 49</p>
        <p>Wali kelas ingin melaporkan ke orang tua "nilai khas" kelas ini, dan memutuskan apakah perlu mengadakan <strong>kelas remedial</strong> untuk sebagian besar siswa. Salah satu nilai (95) sangat tinggi dibanding yang lain.</p>
        <p><strong>Pertanyaan besar:</strong> Kalau wali kelas memakai mean untuk melapor, apakah itu menggambarkan kondisi sebenarnya? Keputusan apa yang sebaiknya diambil?</p>`
      },
      organisasi: {
        bar: 'bar-green', icon: 'fa-solid fa-people-group',
        html: `<p>Berkumpullah dalam kelompok (<strong>4 anggota</strong>), tunjuk juru bicara dan pencatat.</p>`
      },
      bimbingan: {
        bar: 'bar-blue', icon: 'fa-solid fa-compass',
        html: `<ol class="steps-list">
          <li>Hitung mean, median, dan modus dari data nilai try out.</li>
          <li>Identifikasi: nilai mana yang berperan sebagai <strong>outlier</strong>?</li>
          <li>Diskusikan: kalau wali kelas hanya melihat mean, kesimpulan apa yang bisa keliru? Ukuran pemusatan mana yang lebih tepat dipakai untuk memutuskan perlu-tidaknya remedial, dan untuk siswa mana saja?</li>
        </ol>`
      },
      pengembangan: {
        bar: 'bar-purple', icon: 'fa-brands fa-google-drive',
        html: `<p>Tuliskan hasil perhitungan, identifikasi outlier, dan rekomendasi keputusan kelompokmu ke lembar kerja Google Drive berikut.</p>
        <a class="btn-primary pbl-drive-btn" href="https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_KELAS" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-google-drive" aria-hidden="true"></i> Buka Lembar Kerja Kelompok (Google Drive)
        </a>`
      },
      evaluasi: {
        bar: 'bar-teal', icon: 'fa-solid fa-clipboard-check',
        html: `<p>Presentasikan rekomendasi kelompokmu. Bandingkan dengan kelompok lain — apakah semua sepakat pada kesimpulan yang sama?</p>
        <p>Lanjutkan dengan mengerjakan soal evaluasi secara individu.</p>`
      }
    }
  },
  {
    tp: 'TP.5',
    badge: 'PBL · Memilih Ukuran Pemusatan yang Tepat',
    title: 'Gaji Karyawan Toko Kelontong: Waspada Outlier',
    summary: 'Bandingkan beberapa situasi data lalu tentukan ukuran pemusatan paling tepat, termasuk saat ada outlier.',
    icon: 'fa-solid fa-scale-balanced',
    color: 'teal',
    stages: {
      orientasi: {
        bar: 'bar-amber', icon: 'fa-solid fa-lightbulb',
        html: `<p>Sebuah toko kelontong kecil punya 6 karyawan dengan gaji bulanan (dalam juta rupiah):</p>
        <p class="case-data">3, 3, 3.5, 3, 20 (pemilik toko), 3</p>
        <p>Pemilik toko ingin memasang iklan lowongan kerja dengan mencantumkan "gaji rata-rata karyawan toko ini". Ia berencana menuliskan angka mean.</p>
        <p><strong>Pertanyaan besar:</strong> Apakah menampilkan mean sebagai "gaji khas karyawan" itu jujur? Ukuran pemusatan apa yang lebih adil digunakan di sini?</p>`
      },
      organisasi: {
        bar: 'bar-green', icon: 'fa-solid fa-people-group',
        html: `<p>Berkumpullah dalam kelompok (<strong>4 anggota</strong>), tunjuk juru bicara dan pencatat.</p>`
      },
      bimbingan: {
        bar: 'bar-blue', icon: 'fa-solid fa-compass',
        html: `<ol class="steps-list">
          <li>Hitung mean, median, dan modus dari data gaji tersebut.</li>
          <li>Tentukan nilai mana yang merupakan <strong>outlier</strong>, dan jelaskan alasannya.</li>
          <li>Diskusikan: ukuran pemusatan mana yang paling adil dipakai untuk iklan lowongan kerja ini? Bandingkan juga dengan situasi lain — kapan sebaiknya memakai mean, median, atau modus secara umum?</li>
        </ol>`
      },
      pengembangan: {
        bar: 'bar-purple', icon: 'fa-brands fa-google-drive',
        html: `<p>Tuliskan hasil analisis dan rekomendasi kelompokmu (termasuk saran ukuran pemusatan mana yang seharusnya dicantumkan di iklan) ke lembar kerja Google Drive berikut.</p>
        <a class="btn-primary pbl-drive-btn" href="https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_KELAS" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-google-drive" aria-hidden="true"></i> Buka Lembar Kerja Kelompok (Google Drive)
        </a>`
      },
      evaluasi: {
        bar: 'bar-teal', icon: 'fa-solid fa-clipboard-check',
        html: `<p>Presentasikan hasil kelompokmu dan bandingkan dengan kelompok lain — apakah semua kelompok memilih ukuran pemusatan yang sama?</p>
        <p>Setelah presentasi, lanjutkan sendiri-sendiri mengerjakan soal evaluasi untuk mengecek pemahamanmu.</p>
        <button type="button" class="btn-primary" id="pblGotoEvaluasi">
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i> Kerjakan Soal Evaluasi
        </button>`
      }
    }
  }
];

const PBL_STAGE_ORDER = ['orientasi', 'organisasi', 'bimbingan', 'pengembangan', 'evaluasi'];
const PBL_STAGE_LABELS = [
  { key: 'orientasi', num: 1, label: 'Orientasi Masalah' },
  { key: 'organisasi', num: 2, label: 'Mengorganisasikan' },
  { key: 'bimbingan', num: 3, label: 'Membimbing' },
  { key: 'pengembangan', num: 4, label: 'Mengembangkan' },
  { key: 'evaluasi', num: 5, label: 'Menganalisis & Evaluasi' }
];

/* ---------- 2c. RENDER KARTU 5 AKTIVITAS ---------- */
const activityGrid = document.getElementById('activityGrid');
if (activityGrid) {
  activityGrid.innerHTML = ACTIVITIES.map((act, i) => `
    <button type="button" class="activity-card" data-activity-index="${i}" style="--card-c:var(--c-${act.color});--card-c-soft:var(--c-${act.color}-soft);">
      <span class="activity-tp">${act.tp}</span>
      <span class="activity-icon"><i class="${act.icon}" aria-hidden="true"></i></span>
      <span class="activity-title">${act.title}</span>
      <span class="activity-desc">${act.summary}</span>
      <span class="activity-open"><i class="fa-solid fa-play" aria-hidden="true"></i> Buka Aktivitas</span>
    </button>
  `).join('');
}

/* ---------- 2d. MODAL AKTIVITAS PBL (generik, dipakai oleh 5 aktivitas) ---------- */
(() => {
  const overlay = document.getElementById('pblModalOverlay');
  const closeBtn = document.getElementById('pblModalClose');
  const modal = overlay ? overlay.querySelector('.pbl-modal') : null;
  const tabsWrap = document.getElementById('pblTabs');
  const bodyWrap = document.getElementById('pblModalBody');
  const dotsWrap = document.getElementById('pblDots');
  const prevBtn = document.getElementById('pblPrevBtn');
  const nextBtn = document.getElementById('pblNextBtn');
  const titleEl = document.getElementById('pblModalTitle');
  const badgeEl = document.getElementById('pblModalBadge');
  if (!overlay || !tabsWrap || !bodyWrap) return;

  let lastFocused = null;
  let activeIndex = 0;
  let currentStageIndex = 0;

  function renderModalShell() {
    tabsWrap.innerHTML = PBL_STAGE_LABELS.map((s, i) => `
      <button class="pbl-tab${i === 0 ? ' active' : ''}" data-pbl-tab="${s.key}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}">
        <span class="pbl-tab-num">${s.num}</span> ${s.label}
      </button>`).join('');
    dotsWrap.innerHTML = PBL_STAGE_LABELS.map((s, i) => `<span class="pbl-dot${i === 0 ? ' active' : ''}"></span>`).join('');
  }

  function renderStageContent(activity) {
    bodyWrap.innerHTML = PBL_STAGE_LABELS.map((s, i) => {
      const stage = activity.stages[s.key];
      return `<div class="pbl-tab-panel${i === 0 ? ' active' : ''}" data-pbl-panel="${s.key}">
        <div class="pbl-label-bar ${stage.bar}"><i class="${stage.icon}" aria-hidden="true"></i> ${s.label}</div>
        <div class="pbl-panel-card">${stage.html}</div>
      </div>`;
    }).join('');
  }

  function activateStage(index) {
    const tabs = Array.from(tabsWrap.querySelectorAll('.pbl-tab'));
    const panels = Array.from(bodyWrap.querySelectorAll('.pbl-tab-panel'));
    const dots = Array.from(dotsWrap.querySelectorAll('.pbl-dot'));
    if (index < 0) index = 0;
    if (index >= tabs.length) index = tabs.length - 1;
    currentStageIndex = index;
    tabs.forEach((t, i) => {
      const active = i === index;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((p, i) => p.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) {
      const isLast = index === tabs.length - 1;
      nextBtn.innerHTML = isLast
        ? 'Selesai <i class="fa-solid fa-check" aria-hidden="true"></i>'
        : 'Selanjutnya <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    }
    bodyWrap.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function openModal(index) {
    activeIndex = index;
    const activity = ACTIVITIES[activeIndex];
    if (!activity) return;
    if (titleEl) titleEl.textContent = activity.title;
    if (badgeEl) badgeEl.textContent = activity.badge;
    renderModalShell();
    renderStageContent(activity);
    bindTabClicks();
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    activateStage(0);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function bindTabClicks() {
    Array.from(tabsWrap.querySelectorAll('.pbl-tab')).forEach((tab, i) => {
      tab.addEventListener('click', () => activateStage(i));
    });
    const gotoEvaluasiBtn = document.getElementById('pblGotoEvaluasi');
    if (gotoEvaluasiBtn) {
      gotoEvaluasiBtn.addEventListener('click', () => {
        closeModal();
        goTo('studi-evaluasi');
        requestAnimationFrame(() => {
          const page = document.getElementById('page-studi-evaluasi');
          const tabBtn = page ? page.querySelector('[data-tab-target="evaluasi"]') : null;
          if (tabBtn) tabBtn.click();
        });
      });
    }
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-activity-index]');
    if (card) {
      const idx = Number(card.dataset.activityIndex);
      if (!Number.isNaN(idx)) openModal(idx);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) closeModal(); });

  if (prevBtn) prevBtn.addEventListener('click', () => activateStage(currentStageIndex - 1));
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStageIndex === PBL_STAGE_LABELS.length - 1) {
        closeModal();
      } else {
        activateStage(currentStageIndex + 1);
      }
    });
  }
})();

/* ---------- 3. FORM JAWABAN STUDI KASUS ---------- */
/* User harus benar-benar MENGISI kotak jawaban dulu (tidak boleh kosong) baru
   pembahasan (case-answer) muncul saat tombol "Kirim Jawaban" diklik. Sebelum
   itu, tombol submit tidak melakukan apa-apa selain menampilkan pesan error. */
document.querySelectorAll('.case-card').forEach(card => {
  const toggleBtn = card.querySelector('.case-answer-toggle');
  const form = card.querySelector('.case-answer-form');
  const submitBtn = card.querySelector('.case-submit-btn');
  const textarea = card.querySelector('.case-answer-form textarea');
  const answerBox = card.querySelector('.case-answer');
  const errorEl = card.querySelector('.case-answer-error');
  if (!toggleBtn || !form || !submitBtn || !answerBox) return;

  toggleBtn.addEventListener('click', () => {
    form.classList.add('show');
    toggleBtn.setAttribute('hidden', '');
    if (textarea) textarea.focus();
  });

  submitBtn.addEventListener('click', () => {
    const isEmpty = !textarea || textarea.value.trim() === '';
    if (isEmpty) {
      if (errorEl) errorEl.hidden = false;
      if (textarea) textarea.focus();
      return;
    }
    if (errorEl) errorEl.hidden = true;
    form.classList.remove('show');
    answerBox.classList.add('show');
    card.classList.add('answered');
    answerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const judul = card.querySelector('h3')?.textContent?.trim() || '';
    const kategori = card.querySelector('.case-tag')?.textContent?.trim() || '';
    kirimStudiKasusKeSheets(judul, kategori, textarea.value.trim());
  });

  if (textarea && errorEl) {
    textarea.addEventListener('input', () => {
      if (textarea.value.trim() !== '') errorEl.hidden = true;
    });
  }
});

/* ---------- 3b. TOAST NOTIFIKASI KECIL (dipakai oleh rekap Google Sheets) ---------- */
function showToast(pesan, tipe) {
  let el = document.getElementById('stToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'stToast';
    el.className = 'st-toast';
    document.body.appendChild(el);
  }
  el.textContent = pesan;
  el.className = 'st-toast show' + (tipe ? ' ' + tipe : '');
  clearTimeout(el._timeoutId);
  el._timeoutId = setTimeout(() => { el.classList.remove('show'); }, 3000);
}

/* ---------- 3c. REKAP HASIL EVALUASI & STUDI KASUS KE GOOGLE SHEETS ----------
   Dikirim ke Google Apps Script (Code.gs) yang terhubung ke spreadsheet guru.
   GANTI nilai SHEETS_URL di bawah dengan URL Web App hasil deploy Code.gs
   (lihat langkah pemasangan lengkap di dalam file Code.gs). */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyLNWwYDwBBgGraQ34nm0nXdFU9yOxfiy4oKDyE4h2A7FXFYJkOgq8H_IpuEWaVdDfU/exec';

/** Sengaja TIDAK membandingkan SHEETS_URL dengan teks placeholder/dirinya sendiri —
 * itu gampang rusak kalau URL-nya ditempel ulang lewat copy-paste/tool lain (pernah
 * kejadian 2x). Di sini kita cukup cek bentuknya memang URL Apps Script yang valid. */
function sheetsUrlSudahDiisi() {
  return typeof SHEETS_URL === 'string' && SHEETS_URL.indexOf('script.google.com/macros/') !== -1;
}

function buatTimestampSheets() {
  return new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Ambil data siswa yang sedang login (kunci sessionStorage sama seperti
 * di bagian "0. GERBANG LOGIN" — STUDENT_KEY = 'statlearn_student'). */
function ambilDataSiswaSheets() {
  try {
    const raw = sessionStorage.getItem('statlearn_student');
    return raw ? JSON.parse(raw) : { nama: '', kelas: '', absen: '' };
  } catch (e) {
    return { nama: '', kelas: '', absen: '' };
  }
}

/** Kirim payload via POST (mode no-cors, body teks) supaya tidak kena
 * pemblokiran CORS — Apps Script tetap bisa mem-parse body-nya sebagai JSON. */
async function kirimPostKeSheets(payload) {
  return fetch(SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}

async function kirimEvaluasiKeSheets(skor, total, nilaiPersen) {
  const siswa = ambilDataSiswaSheets();
  if (!siswa.nama || !siswa.kelas) return;
  if (!sheetsUrlSudahDiisi()) {
    console.warn('SHEETS_URL belum diisi dengan benar — hasil evaluasi belum direkap ke Google Sheets. Lihat instruksi di Code.gs.');
    return;
  }
  const payload = {
    tipe: 'evaluasi', timestamp: buatTimestampSheets(),
    nama: siswa.nama, kelas: siswa.kelas, absen: siswa.absen,
    skor, total, nilai: nilaiPersen,
  };
  try {
    await kirimPostKeSheets(payload);
    showToast('Hasil evaluasi tersimpan ke rekap guru ✓', 'success');
  } catch (err) {
    console.error('Gagal mengirim hasil evaluasi ke Sheets:', err);
    showToast('Gagal menyimpan hasil ke rekap guru. Cek koneksi internet.', 'warn');
  }
}

async function kirimStudiKasusKeSheets(judul, kategori, jawaban) {
  const siswa = ambilDataSiswaSheets();
  if (!siswa.nama || !siswa.kelas) return;
  if (!sheetsUrlSudahDiisi()) {
    console.warn('SHEETS_URL belum diisi dengan benar — jawaban studi kasus belum direkap ke Google Sheets. Lihat instruksi di Code.gs.');
    return;
  }
  const payload = {
    tipe: 'studiKasus', timestamp: buatTimestampSheets(),
    nama: siswa.nama, kelas: siswa.kelas, absen: siswa.absen,
    judul, kategori, jawaban,
  };
  try {
    await kirimPostKeSheets(payload);
    showToast('Jawaban studi kasus tersimpan ke rekap guru ✓', 'success');
  } catch (err) {
    console.error('Gagal mengirim jawaban studi kasus ke Sheets:', err);
    showToast('Gagal menyimpan jawaban ke rekap guru. Cek koneksi internet.', 'warn');
  }
}

/* ---------- 4. KALKULATOR MEAN / MEDIAN / MODUS + DIAGRAM ---------- */
const dataInput = document.getElementById('dataInput');
const calcBtn = document.getElementById('calcBtn');
const calcError = document.getElementById('calcError');
const chartChips = document.querySelectorAll('.chart-type-group .chip');
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const axisXInput = document.getElementById('axisXLabel');
const axisYInput = document.getElementById('axisYLabel');
const downloadChartBtn = document.getElementById('downloadChartBtn');

let currentChartType = 'bar';

chartChips.forEach(chip => {
  chip.addEventListener('click', () => {
    chartChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentChartType = chip.dataset.chart;
    runCalculation();
  });
});

function parseData(raw) {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(Number);
}

function computeStats(nums) {
  const n = nums.length;
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const sorted = [...nums].sort((a, b) => a - b);
  let median;
  const mid = Math.floor(n / 2);
  median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const freq = {};
  nums.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq));
  let modus;
  if (maxFreq === 1) {
    modus = 'Tidak ada';
  } else {
    modus = Object.keys(freq)
      .filter(k => freq[k] === maxFreq)
      .map(Number)
      .sort((a, b) => a - b)
      .join(', ');
  }

  const range = Math.max(...nums) - Math.min(...nums);

  return { mean, median, modus, range, freq, sorted };
}

function fmt(n) {
  if (typeof n !== 'number') return n;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function runCalculation() {
  const raw = dataInput.value.trim();
  calcError.textContent = '';
  if (!raw) {
    calcError.textContent = 'Masukkan data terlebih dahulu, contoh: 78, 85, 90';
    clearResults();
    return;
  }
  const nums = parseData(raw);
  if (nums.some(isNaN) || nums.length === 0) {
    calcError.textContent = 'Pastikan semua data berupa angka, dipisahkan koma.';
    clearResults();
    return;
  }

  const stats = computeStats(nums);
  document.getElementById('resMean').textContent = fmt(stats.mean);
  document.getElementById('resMedian').textContent = fmt(stats.median);
  document.getElementById('resModus').textContent = stats.modus;
  document.getElementById('resRange').textContent = fmt(stats.range);

  const xLabel = (axisXInput.value || 'Data ke-').trim() || 'Data ke-';
  const yLabel = (axisYInput.value || 'Nilai Data').trim() || 'Nilai Data';

  drawChart(nums, stats, currentChartType, xLabel, yLabel);
  downloadChartBtn.disabled = false;
}

function clearResults() {
  ['resMean', 'resMedian', 'resModus', 'resRange'].forEach(id => {
    document.getElementById(id).textContent = '–';
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  downloadChartBtn.disabled = true;
}

calcBtn.addEventListener('click', runCalculation);
dataInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runCalculation();
});

/* --- unduh diagram sebagai gambar PNG --- */
downloadChartBtn.addEventListener('click', () => {
  if (downloadChartBtn.disabled) return;
  const link = document.createElement('a');
  link.download = 'diagram-statlearn.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

/* --- gambar diagram di canvas (native, tanpa library) --- */
const PALETTE = ['#4F6BFF', '#16A34A', '#F59E0B', '#8B5CF6', '#F43F5E', '#0EA5A4', '#EA580C', '#059669'];

function drawChart(nums, stats, type, xLabel, yLabel) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '13px Inter, sans-serif';

  if (type === 'bar') drawBar(nums, xLabel, yLabel);
  else if (type === 'line') drawLine(nums, xLabel, yLabel);
  else if (type === 'pie') drawPie(stats.freq, yLabel);
}

/* Menulis judul sumbu X (di bawah) dan sumbu Y (diputar 90°, di kiri)
   supaya jelas apa yang diukur pada tiap sumbu diagram. */
function drawAxisLabels(padding, w, h, xLabel, yLabel) {
  ctx.fillStyle = '#312C55';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';

  ctx.textAlign = 'center';
  ctx.fillText(xLabel, padding.left + w / 2, padding.top + h + 44);

  ctx.save();
  ctx.translate(18, padding.top + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  ctx.font = '13px Inter, sans-serif';
}

function drawBar(nums, xLabel, yLabel) {
  const padding = { top: 30, right: 20, bottom: 66, left: 66 };
  const w = canvas.width - padding.left - padding.right;
  const h = canvas.height - padding.top - padding.bottom;
  const maxVal = Math.max(...nums) * 1.15;
  const barGap = 14;
  const barW = Math.min(60, (w - barGap * (nums.length - 1)) / nums.length);

  ctx.strokeStyle = '#E7E4F5';
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + h);
  ctx.lineTo(padding.left + w, padding.top + h);
  ctx.stroke();

  nums.forEach((v, i) => {
    const barH = (v / maxVal) * h;
    const x = padding.left + i * (barW + barGap);
    const y = padding.top + h - barH;
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    roundRect(ctx, x, y, barW, barH, 6);
    ctx.fillStyle = '#161327';
    ctx.textAlign = 'center';
    ctx.fillText(v, x + barW / 2, y - 8);
    ctx.fillText('#' + (i + 1), x + barW / 2, padding.top + h + 18);
  });

  drawAxisLabels(padding, w, h, xLabel, yLabel);
}

function drawLine(nums, xLabel, yLabel) {
  const padding = { top: 30, right: 30, bottom: 66, left: 66 };
  const w = canvas.width - padding.left - padding.right;
  const h = canvas.height - padding.top - padding.bottom;
  const maxVal = Math.max(...nums) * 1.15;
  const minVal = Math.min(0, Math.min(...nums));
  const stepX = w / (nums.length - 1 || 1);

  ctx.strokeStyle = '#E7E4F5';
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + h);
  ctx.lineTo(padding.left + w, padding.top + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 3;
  nums.forEach((v, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + h - ((v - minVal) / (maxVal - minVal || 1)) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  nums.forEach((v, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + h - ((v - minVal) / (maxVal - minVal || 1)) * h;
    ctx.fillStyle = '#4F6BFF';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#161327';
    ctx.textAlign = 'center';
    ctx.fillText(v, x, y - 12);
  });
  ctx.lineWidth = 1;

  drawAxisLabels(padding, w, h, xLabel, yLabel);
}

function drawPie(freq) {
  const cx = canvas.width / 2 - 60;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 30;
  const entries = Object.entries(freq);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  let start = -Math.PI / 2;

  entries.forEach(([val, count], i) => {
    const slice = (count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fill();
    start += slice;
  });

  // legend
  const legendX = canvas.width - 130;
  let legendY = 50;
  ctx.textAlign = 'left';
  entries.forEach(([val, count], i) => {
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fillRect(legendX, legendY - 10, 12, 12);
    ctx.fillStyle = '#161327';
    const pct = ((count / total) * 100).toFixed(1);
    ctx.fillText(`${val} (${pct}%)`, legendX + 18, legendY);
    legendY += 20;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/* ---------- 5. EVALUASI (KUIS) ---------- */

/* --- helper: bangun diagram batang sebagai SVG inline (tanpa gambar eksternal) --- */
function svgBar(items, color) {
  const w = 340, h = 200, padL = 34, padB = 30, padT = 14, padR = 14;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const maxV = Math.max(...items.map(i => i.value)) * 1.15;
  const bw = chartW / items.length;
  let bars = '';
  items.forEach((it, i) => {
    const bh = (it.value / maxV) * chartH;
    const x = padL + i * bw + bw * 0.18;
    const y = padT + chartH - bh;
    const bwReal = bw * 0.64;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bwReal.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${color}"/>`;
    bars += `<text x="${(x + bwReal / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" font-size="11" text-anchor="middle" fill="#161327" font-family="Inter,sans-serif" font-weight="700">${it.value}</text>`;
    bars += `<text x="${(x + bwReal / 2).toFixed(1)}" y="${h - padB + 16}" font-size="10.5" text-anchor="middle" fill="#635E80" font-family="Inter,sans-serif">${it.label}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Diagram batang">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#E7E4F5" stroke-width="1.5"/>
    <line x1="${padL}" y1="${padT + chartH}" x2="${w - padR}" y2="${padT + chartH}" stroke="#E7E4F5" stroke-width="1.5"/>
    ${bars}
  </svg>`;
}

/* --- helper: bangun diagram garis sebagai SVG inline --- */
function svgLine(items, color) {
  const w = 340, h = 200, padL = 34, padB = 30, padT = 18, padR = 18;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const values = items.map(i => i.value);
  const maxV = Math.max(...values) * 1.1, minV = Math.min(...values) * 0.9;
  const stepX = chartW / (items.length - 1);
  const pts = items.map((it, i) => {
    const x = padL + i * stepX;
    const y = padT + chartH - ((it.value - minV) / (maxV - minV)) * chartH;
    return { x, y, v: it.value, label: it.label };
  });
  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  let dots = '';
  pts.forEach(p => {
    dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}"/>`;
    dots += `<text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" font-size="11" text-anchor="middle" fill="#161327" font-family="Inter,sans-serif" font-weight="700">${p.v}</text>`;
    dots += `<text x="${p.x.toFixed(1)}" y="${h - padB + 16}" font-size="10" text-anchor="middle" fill="#635E80" font-family="Inter,sans-serif">${p.label}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Diagram garis">
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#E7E4F5" stroke-width="1.5"/>
    <line x1="${padL}" y1="${padT + chartH}" x2="${w - padR}" y2="${padT + chartH}" stroke="#E7E4F5" stroke-width="1.5"/>
    <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
  </svg>`;
}

/* --- helper: bangun diagram lingkaran sebagai SVG inline --- */
function svgPie(items, colors) {
  const size = 200, r = 80, cx = 100, cy = 100;
  let angleStart = -Math.PI / 2;
  let slices = '';
  const total = items.reduce((s, i) => s + i.value, 0);
  items.forEach((it, i) => {
    const frac = it.value / total;
    const angleEnd = angleStart + frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(angleStart), y1 = cy + r * Math.sin(angleStart);
    const x2 = cx + r * Math.cos(angleEnd), y2 = cy + r * Math.sin(angleEnd);
    const largeArc = frac > 0.5 ? 1 : 0;
    slices += `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="2"/>`;
    angleStart = angleEnd;
  });
  let legend = '';
  items.forEach((it, i) => {
    const y = 24 + i * 20;
    legend += `<rect x="210" y="${y - 10}" width="12" height="12" rx="3" fill="${colors[i % colors.length]}"/>`;
    legend += `<text x="228" y="${y}" font-size="12" fill="#161327" font-family="Inter,sans-serif">${it.label} (${it.value}%)</text>`;
  });
  return `<svg viewBox="0 0 340 ${Math.max(size, items.length * 20 + 20)}" role="img" aria-label="Diagram lingkaran">
    ${slices}
    ${legend}
  </svg>`;
}

/* --- helper: bangun tabel frekuensi sebagai HTML --- */
function tableFreq(headers, rows) {
  const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  const tbody = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

const QUIZ = [
  {
    q: 'Data: 5, 7, 7, 9, 12. Berapa mean-nya?',
    opts: ['7', '8', '9', '7,5'],
    correct: 1,
    pembahasan: 'Mean = jumlah data ÷ banyak data = (5+7+7+9+12) ÷ 5 = 40 ÷ 5 = 8.'
  },
  {
    q: 'Data: 3, 8, 4, 8, 6, 8. Berapa modusnya?',
    opts: ['3', '6', '8', 'Tidak ada'],
    correct: 2,
    pembahasan: 'Modus adalah nilai yang paling sering muncul. Nilai 8 muncul 3 kali — paling banyak dibanding nilai lain — sehingga modusnya 8.'
  },
  {
    q: 'Data terurut: 2, 4, 6, 8. Berapa mediannya?',
    opts: ['4', '5', '6', '8'],
    correct: 1,
    pembahasan: 'Banyak data genap (4 data), jadi median = rata-rata dua data tengah = (4+6) ÷ 2 = 5.'
  },
  {
    q: 'Ukuran pemusatan mana yang paling tahan terhadap outlier (nilai ekstrem)?',
    opts: ['Mean', 'Median', 'Range', 'Jumlah data'],
    correct: 1,
    pembahasan: 'Median hanya melihat posisi tengah data terurut, jadi tidak "tertarik" oleh satu nilai yang sangat ekstrem seperti halnya mean.'
  },
  {
    q: 'Diagram apa yang paling tepat untuk menunjukkan tren suhu selama 7 hari?',
    opts: ['Diagram lingkaran', 'Diagram batang', 'Diagram garis', 'Tabel saja'],
    correct: 2,
    pembahasan: 'Diagram garis paling cocok untuk menunjukkan perubahan/tren suatu nilai dari waktu ke waktu, misalnya suhu harian.'
  },
  {
    q: 'Diagram lingkaran paling cocok digunakan untuk menunjukkan...',
    opts: ['Urutan waktu', 'Proporsi/persentase dari keseluruhan', 'Perbandingan dua angka acak', 'Data yang belum diolah'],
    correct: 1,
    pembahasan: 'Diagram lingkaran menampilkan bagaimana suatu keseluruhan (100%) terbagi menjadi beberapa bagian, jadi paling pas untuk proporsi/persentase.'
  },
  {
    q: 'Perhatikan diagram batang jumlah siswa per ekstrakurikuler berikut. Ekstrakurikuler mana yang jumlah siswanya paling banyak?',
    visual: svgBar([
      { label: 'Bola', value: 12 },
      { label: 'Musik', value: 8 },
      { label: 'Tari', value: 5 },
      { label: 'Paskibra', value: 10 }
    ], '#4F6BFF'),
    opts: ['Bola', 'Musik', 'Tari', 'Paskibra'],
    correct: 0,
    pembahasan: 'Batang "Bola" adalah yang tertinggi (12 siswa) dibanding Musik (8), Tari (5), dan Paskibra (10).'
  },
  {
    q: 'Perhatikan tabel frekuensi nilai ulangan berikut. Berapa modus dari data tersebut?',
    visual: tableFreq(['Nilai', 'Frekuensi'], [['70', '2'], ['80', '4'], ['90', '3'], ['100', '1']]),
    opts: ['70', '80', '90', '100'],
    correct: 1,
    pembahasan: 'Nilai 80 punya frekuensi terbesar (4 kali), jadi itulah modusnya.'
  },
  {
    q: 'Perhatikan diagram garis suhu harian berikut (Senin–Jumat). Suhu tertinggi terjadi pada hari...',
    visual: svgLine([
      { label: 'Sen', value: 28 },
      { label: 'Sel', value: 30 },
      { label: 'Rab', value: 29 },
      { label: 'Kam', value: 32 },
      { label: 'Jum', value: 31 }
    ], '#0EA5A4'),
    opts: ['Senin', 'Selasa', 'Kamis', 'Jumat'],
    correct: 2,
    pembahasan: 'Titik tertinggi pada garis ada di hari Kamis (32°), lebih tinggi dari hari-hari lainnya.'
  },
  {
    q: 'Perhatikan diagram lingkaran jenis buku di perpustakaan berikut. Kategori buku dengan proporsi terbesar adalah...',
    visual: svgPie([
      { label: 'Fiksi', value: 40 },
      { label: 'Sains', value: 30 },
      { label: 'Komik', value: 20 },
      { label: 'Lainnya', value: 10 }
    ], ['#4F6BFF', '#16A34A', '#F59E0B', '#8B5CF6']),
    opts: ['Fiksi', 'Sains', 'Komik', 'Lainnya'],
    correct: 0,
    pembahasan: 'Irisan "Fiksi" adalah yang terbesar (40%), lebih besar dari Sains (30%), Komik (20%), dan Lainnya (10%).'
  },
  {
    q: 'Data: 65, 70, 78, 90. Berapa jangkauan (range) data tersebut?',
    opts: ['15', '20', '25', '30'],
    correct: 2,
    pembahasan: 'Jangkauan = nilai maksimum − nilai minimum = 90 − 65 = 25.'
  },
  {
    q: 'Perhatikan tabel frekuensi berikut. Berapa mean dari data tersebut?',
    visual: tableFreq(['Nilai', 'Frekuensi'], [['6', '2'], ['7', '3'], ['8', '5']]),
    opts: ['7', '7,3', '7,5', '8'],
    correct: 1,
    pembahasan: 'Mean = ((6×2)+(7×3)+(8×5)) ÷ (2+3+5) = (12+21+40) ÷ 10 = 73 ÷ 10 = 7,3.'
  },
  {
    q: 'Perhatikan diagram batang jumlah pengunjung perpustakaan berikut (Senin–Jumat). Total pengunjung selama 5 hari tersebut adalah...',
    visual: svgBar([
      { label: 'Sen', value: 20 },
      { label: 'Sel', value: 25 },
      { label: 'Rab', value: 15 },
      { label: 'Kam', value: 30 },
      { label: 'Jum', value: 20 }
    ], '#F59E0B'),
    opts: ['100', '105', '110', '115'],
    correct: 2,
    pembahasan: 'Jumlahkan semua batang: 20+25+15+30+20 = 110 pengunjung.'
  },
  {
    q: 'Seorang peneliti ingin tahu rata-rata tinggi badan seluruh siswa kelas VIII se-Indonesia, tapi ia hanya mengukur 200 siswa dari beberapa sekolah. 200 siswa tersebut disebut...',
    opts: ['Populasi', 'Sampel', 'Variabel', 'Modus'],
    correct: 1,
    pembahasan: '200 siswa yang benar-benar diukur adalah sebagian dari keseluruhan siswa kelas VIII se-Indonesia (populasi), sehingga disebut sampel.'
  },
  {
    q: 'Data warna baju favorit siswa (merah, biru, hijau) termasuk jenis data...',
    opts: ['Data kuantitatif', 'Data kualitatif', 'Data tunggal', 'Data frekuensi'],
    correct: 1,
    pembahasan: 'Warna adalah kategori/label, bukan angka, sehingga termasuk data kualitatif.'
  },
  {
    q: 'Untuk membandingkan jumlah siswa antar beberapa ekstrakurikuler yang berbeda, diagram paling tepat digunakan adalah...',
    opts: ['Diagram garis', 'Diagram batang', 'Diagram lingkaran', 'Tabel turus saja'],
    correct: 1,
    pembahasan: 'Diagram batang paling cocok untuk membandingkan besar-kecil antar kategori yang berbeda, misalnya antar ekstrakurikuler.'
  },
  {
    q: 'Data: 2, 2, 3, 3, 5. Data ini memiliki...',
    opts: ['Satu modus, yaitu 5', 'Dua modus (multimodal), yaitu 2 dan 3', 'Tidak ada modus', 'Modus = 2,5'],
    correct: 1,
    pembahasan: 'Nilai 2 dan 3 sama-sama muncul 2 kali (frekuensi tertinggi yang sama), jadi datanya multimodal dengan modus 2 dan 3.'
  },
  {
    q: 'Nilai yang jauh berbeda (sangat tinggi atau sangat rendah) dibanding sebagian besar data lain disebut...',
    opts: ['Median', 'Modus', 'Outlier', 'Frekuensi'],
    correct: 2,
    pembahasan: 'Nilai yang menyimpang jauh dari sebagian besar data lain disebut outlier.'
  },
  {
    q: 'Data gaji karyawan (juta rupiah): 4, 5, 4, 5, 4, 50 (gaji bos). Ukuran pemusatan yang paling tepat mewakili gaji "khas" karyawan adalah...',
    opts: ['Mean, karena menghitung semua data', 'Median, karena tahan terhadap outlier', 'Modus, karena nilai tersering pasti benar', 'Jangkauan, karena menunjukkan rentang data'],
    correct: 1,
    pembahasan: 'Gaji bos (50) adalah outlier yang akan menarik mean jauh ke atas, sehingga median lebih jujur mewakili gaji "khas" mayoritas karyawan.'
  },
  {
    q: 'Perhatikan diagram garis jumlah pengunjung pameran sekolah berikut (Januari–Mei). Tren yang terlihat secara umum adalah...',
    visual: svgLine([
      { label: 'Jan', value: 20 },
      { label: 'Feb', value: 22 },
      { label: 'Mar', value: 25 },
      { label: 'Apr', value: 23 },
      { label: 'Mei', value: 28 }
    ], '#8B5CF6'),
    opts: ['Terus menurun', 'Cenderung meningkat meski sempat sedikit turun', 'Stabil tanpa perubahan', 'Naik turun tidak beraturan'],
    correct: 1,
    pembahasan: 'Dari Januari (20) ke Mei (28) garis naik secara umum, walau sempat turun sedikit dari Maret (25) ke April (23).'
  }
];

const quizForm = document.getElementById('quizForm');
const quizResult = document.getElementById('quizResult');

/* ---------- 5b. ACAK URUTAN SOAL ---------- */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
let ACTIVE_QUIZ = shuffleArray(QUIZ);

/* ---------- 5c. TIMER EVALUASI (20 MENIT) ---------- */
const QUIZ_TIME_LIMIT = 20 * 60; // detik
const quizTimerBar = document.getElementById('quizTimerBar');
const quizTimerText = document.getElementById('quizTimerText');
const quizTimerFill = document.getElementById('quizTimerFill');
let quizTimerInterval = null;
let quizSecondsLeft = QUIZ_TIME_LIMIT;
let quizTimerRunning = false;
let quizLocked = false;

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  if (!quizTimerText || !quizTimerFill) return;
  quizTimerText.textContent = formatMMSS(Math.max(0, quizSecondsLeft));
  const pct = Math.max(0, (quizSecondsLeft / QUIZ_TIME_LIMIT) * 100);
  quizTimerFill.style.width = pct + '%';
  if (quizTimerBar) quizTimerBar.classList.toggle('warning', quizSecondsLeft <= 60);
}

function lockQuiz() {
  quizLocked = true;
  quizForm.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = true; });
}

function unlockQuiz() {
  quizLocked = false;
  quizForm.querySelectorAll('input[type="radio"]').forEach(input => { input.disabled = false; });
}

function stopQuizTimer() {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  quizTimerInterval = null;
  quizTimerRunning = false;
}

function startQuizTimer() {
  if (quizTimerRunning) return;
  quizTimerRunning = true;
  quizSecondsLeft = QUIZ_TIME_LIMIT;
  updateTimerDisplay();
  quizTimerInterval = setInterval(() => {
    quizSecondsLeft--;
    updateTimerDisplay();
    if (quizSecondsLeft <= 0) {
      stopQuizTimer();
      if (!quizLocked) {
        gradeQuiz();
        const desc = document.getElementById('quizScoreDesc');
        if (desc) desc.textContent = '⏰ Waktu 20 menit habis — jawabanmu otomatis dikumpulkan. ' + desc.textContent;
      }
    }
  }, 1000);
}

function resetQuizTimer() {
  stopQuizTimer();
  quizSecondsLeft = QUIZ_TIME_LIMIT;
  updateTimerDisplay();
  if (quizTimerBar) quizTimerBar.classList.remove('warning');
}

document.querySelectorAll('[data-tab-target="evaluasi"]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!quizTimerRunning && !quizLocked) startQuizTimer();
  });
});

function renderQuiz() {
  quizForm.innerHTML = '';
  ACTIVE_QUIZ.forEach((item, qi) => {
    const wrap = document.createElement('div');
    wrap.className = 'quiz-q';
    wrap.dataset.index = qi;

    const qText = document.createElement('p');
    qText.className = 'q-text';
    qText.textContent = item.q;
    wrap.appendChild(qText);

    if (item.visual) {
      const visualWrap = document.createElement('div');
      visualWrap.className = 'quiz-visual';
      visualWrap.innerHTML = item.visual;
      wrap.appendChild(visualWrap);
    }

    const optsWrap = document.createElement('div');
    optsWrap.className = 'quiz-opts';
    item.opts.forEach((opt, oi) => {
      const label = document.createElement('label');
      label.className = 'quiz-opt';
      label.innerHTML = `<input type="radio" name="q${qi}" value="${oi}"> <span>${opt}</span>`;
      optsWrap.appendChild(label);
    });
    wrap.appendChild(optsWrap);

    // Catatan: teks "pembahasan" tiap soal (item.pembahasan) untuk sementara
    // TIDAK ditampilkan dulu di menu Evaluasi (lihat permintaan revisi).
    // Datanya tetap ada di QUIZ kalau suatu saat fitur ini diaktifkan lagi.

    quizForm.appendChild(wrap);
  });
}
renderQuiz();
updateTimerDisplay();

/* ---------- 5d. NAVIGASI SOAL SATU-PER-SATU (stepper) ---------- */
const quizPrevBtn = document.getElementById('quizPrevBtn');
const quizNextBtn = document.getElementById('quizNextBtn');
const quizProgressFill = document.getElementById('quizProgressFill');
const quizProgressText = document.getElementById('quizProgressText');
let quizStepIndex = 0;

function updateQuizNav() {
  const total = ACTIVE_QUIZ.length;
  const isLast = quizStepIndex === total - 1;

  if (quizProgressFill) quizProgressFill.style.width = `${((quizStepIndex + 1) / total) * 100}%`;
  if (quizProgressText) quizProgressText.textContent = `Soal ${quizStepIndex + 1} dari ${total}`;

  if (quizPrevBtn) quizPrevBtn.disabled = quizStepIndex === 0;
  if (quizNextBtn) {
    if (isLast) {
      quizNextBtn.innerHTML = quizLocked
        ? 'Lihat Skor <i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>'
        : 'Selesai &amp; Lihat Skor <i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>';
    } else {
      quizNextBtn.innerHTML = 'Selanjutnya <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    }
  }
}

function showQuizStep(index) {
  const total = ACTIVE_QUIZ.length;
  if (index < 0) index = 0;
  if (index > total - 1) index = total - 1;
  quizStepIndex = index;

  quizForm.querySelectorAll('.quiz-q').forEach((qEl) => {
    qEl.classList.toggle('active', Number(qEl.dataset.index) === quizStepIndex);
  });
  updateQuizNav();
  quizForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
showQuizStep(0);

if (quizPrevBtn) {
  quizPrevBtn.addEventListener('click', () => showQuizStep(quizStepIndex - 1));
}
if (quizNextBtn) {
  quizNextBtn.addEventListener('click', () => {
    const isLast = quizStepIndex === ACTIVE_QUIZ.length - 1;
    if (isLast) {
      if (!quizLocked) gradeQuiz();
      quizResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showQuizStep(quizStepIndex + 1);
    }
  });
}

function gradeQuiz() {
  let score = 0;
  ACTIVE_QUIZ.forEach((item, qi) => {
    const selected = quizForm.querySelector(`input[name="q${qi}"]:checked`);
    const optLabels = quizForm.querySelectorAll(`.quiz-q[data-index="${qi}"] .quiz-opt`);
    optLabels.forEach((label, oi) => {
      label.classList.remove('correct', 'wrong');
      if (oi === item.correct) label.classList.add('correct');
      if (selected && Number(selected.value) === oi && oi !== item.correct) label.classList.add('wrong');
    });
    if (selected && Number(selected.value) === item.correct) score++;
  });

  stopQuizTimer();
  lockQuiz();
  updateQuizNav();

  const pct = Math.round((score / ACTIVE_QUIZ.length) * 100);
  quizResult.hidden = false;
  const titleEl = document.getElementById('quizScoreTitle');
  titleEl.innerHTML = '';
  const trophyIcon = document.createElement('i');
  let msg;
  if (pct >= 80) {
    trophyIcon.className = 'fa-solid fa-trophy';
    msg = 'Mantap! Pemahamanmu tentang statistika sudah solid.';
  } else if (pct >= 50) {
    trophyIcon.className = 'fa-solid fa-book-open';
    msg = 'Lumayan! Coba baca ulang bagian Materi untuk memperkuat pemahaman.';
  } else {
    trophyIcon.className = 'fa-solid fa-dumbbell';
    msg = 'Yuk pelajari lagi bagian Materi dan Studi Kasus, lalu coba lagi.';
  }
  titleEl.appendChild(trophyIcon);
  titleEl.appendChild(document.createTextNode(` Skor kamu: ${score} / ${ACTIVE_QUIZ.length} (${pct}%)`));
  document.getElementById('quizScoreDesc').textContent = msg;
  quizResult.scrollIntoView({ behavior: 'smooth', block: 'center' });

  kirimEvaluasiKeSheets(score, ACTIVE_QUIZ.length, pct);
}

/* ---------- 5e. MENU PEMBAHASAN ----------
   Untuk sementara, tombol & tampilan "Lihat Pembahasan" di bawah hasil
   evaluasi belum ditampilkan dulu (lihat permintaan revisi). Fungsi
   showQuizStep/gradeQuiz di atas tidak bergantung pada bagian ini,
   jadi aman dihapus sementara tanpa mengubah alur evaluasi lainnya. */

/* ---------- 6. TANYA AI (fetch ke backend Flask app.py + Groq) ---------- */
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatLog = document.getElementById('chatLog');
const chatHeaderStatus = document.getElementById('chatHeaderStatus');
const suggestionChips = document.querySelectorAll('.chat-suggestions .chip');
const chatSubmitBtn = chatForm.querySelector('button[type="submit"]');

/* ---------- Pengaturan API key pribadi (opsional, tersimpan di browser saja) ---------- */
const KEY_STORAGE_NAME = 'statlearn_groq_key';
const chatSettingsBtn = document.getElementById('chatSettingsBtn');
const chatKeyPanel = document.getElementById('chatKeyPanel');
const chatKeyInput = document.getElementById('chatKeyInput');
const chatKeyToggle = document.getElementById('chatKeyToggle');
const chatKeySave = document.getElementById('chatKeySave');
const chatKeyClear = document.getElementById('chatKeyClear');
const chatKeyNote = document.getElementById('chatKeyNote');

function getStoredKey() {
  return (sessionStorage.getItem(KEY_STORAGE_NAME) || '').trim();
}

function showKeyNote(text, isError) {
  chatKeyNote.textContent = text;
  chatKeyNote.classList.toggle('error', !!isError);
}

chatSettingsBtn.addEventListener('click', () => {
  const willOpen = chatKeyPanel.hidden;
  chatKeyPanel.hidden = !willOpen;
  chatSettingsBtn.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) {
    chatKeyInput.value = getStoredKey();
    chatKeyInput.focus();
  }
});

chatKeyToggle.addEventListener('click', () => {
  const isPw = chatKeyInput.type === 'password';
  chatKeyInput.type = isPw ? 'text' : 'password';
  chatKeyToggle.innerHTML = `<i class="fa-solid ${isPw ? 'fa-eye-slash' : 'fa-eye'}" aria-hidden="true"></i>`;
});

chatKeySave.addEventListener('click', () => {
  const val = chatKeyInput.value.trim();
  if (!val) { showKeyNote('Isi dulu API key-nya, ya.', true); return; }
  if (!val.startsWith('gsk_')) { showKeyNote('Format key sepertinya salah (harus diawali "gsk_").', true); return; }
  sessionStorage.setItem(KEY_STORAGE_NAME, val);
  showKeyNote('Tersimpan! Sekarang Tanya AI memakai API key pribadimu.', false);
  checkServerStatus();
});

chatKeyClear.addEventListener('click', () => {
  sessionStorage.removeItem(KEY_STORAGE_NAME);
  chatKeyInput.value = '';
  showKeyNote('Key pribadi dihapus dari browser ini.', false);
  checkServerStatus();
});

/* logo Statlearn dipakai sebagai avatar bot di jendela chat (bukan ikon robot generik) */
const STATLEARN_LOGO_SVG = `<svg viewBox="0 0 48 48" width="19" height="19" aria-hidden="true">
  <circle cx="24" cy="24" r="24" fill="#4F6BFF"/>
  <path d="M13 30 L20 18 L26 25 L35 12" stroke="#fff" stroke-width="3.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="35" cy="12" r="3" fill="#fff"/>
</svg>`;

function nowLabel() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/* isi avatar bot bawaan (pesan sambutan) dengan logo saat halaman dimuat */
document.querySelectorAll('[data-bot-avatar]').forEach(el => { el.innerHTML = STATLEARN_LOGO_SVG; });
document.querySelectorAll('[data-now]').forEach(el => { el.textContent = nowLabel(); });

function addChatMessage(text, sender) {
  const row = document.createElement('div');
  row.className = `chat-msg ${sender}`;
  const avatarHTML = sender === 'user'
    ? '<i class="fa-solid fa-user-graduate" aria-hidden="true"></i>'
    : STATLEARN_LOGO_SVG;
  row.innerHTML = `
    <span class="chat-avatar">${avatarHTML}</span>
    <div class="chat-bubble-wrap">
      <div class="chat-bubble"></div>
      <span class="chat-time">${nowLabel()}</span>
    </div>`;
  row.querySelector('.chat-bubble').textContent = text;
  chatLog.appendChild(row);
  chatLog.scrollTop = chatLog.scrollHeight;
  return row;
}

function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'chat-msg bot';
  row.innerHTML = `<span class="chat-avatar">${STATLEARN_LOGO_SVG}</span>
    <div class="chat-bubble-wrap">
      <div class="chat-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>
    </div>`;
  chatLog.appendChild(row);
  chatLog.scrollTop = chatLog.scrollHeight;
  return row;
}

/* Tanya AI sekarang berjalan sepenuhnya di browser (tanpa backend): kita panggil
   langsung endpoint chat completion Groq (kompatibel format OpenAI) memakai API key
   pribadi pengguna yang tersimpan di sessionStorage. Tidak ada server perantara. */
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
/* llama-3.3-70b-versatile resmi dinonaktifkan (decommissioned) oleh Groq pada
   16 Agustus 2026, sehingga permintaan ke model itu akan selalu gagal dengan
   error "model_decommissioned". Kita pindah ke openai/gpt-oss-120b, model
   pengganti resmi yang direkomendasikan Groq untuk kasus penggunaan umum. */
const GROQ_MODEL = 'openai/gpt-oss-120b';
const SYSTEM_PROMPT = [
  'Kamu adalah tutor statistika yang ramah untuk siswa SMP kelas VIII di Indonesia,',
  'bagian dari aplikasi belajar bernama Statlearn. Topik utama: penyajian data',
  '(tabel, diagram batang, diagram garis, diagram lingkaran) dan ukuran pemusatan',
  'data (mean, median, modus), termasuk konsep outlier.',
  'Jawab dalam Bahasa Indonesia yang sederhana dan mudah dipahami siswa SMP,',
  'gunakan contoh sehari-hari bila membantu, dan jangan bertele-tele —',
  'usahakan jawaban singkat (maksimal sekitar 120 kata) kecuali diminta lebih detail.',
  'Jika pertanyaan di luar topik matematika/statistika/STEM, tetap jawab dengan sopan',
  'dan arahkan kembali ke topik pelajaran bila relevan.'
].join(' ');

async function askAI(question) {
  addChatMessage(question, 'user');
  chatInput.disabled = true;
  chatSubmitBtn.disabled = true;
  const loadingRow = addTypingIndicator();

  const personalKey = getStoredKey();

  if (!personalKey) {
    loadingRow.classList.add('error');
    loadingRow.querySelector('.chat-bubble').textContent =
      'Belum ada API key Groq. Klik ikon gerigi ⚙️ di pojok kanan atas jendela chat ini, lalu masukkan API key Groq pribadimu. ' +
      'Sementara itu, ini jawaban cadangan sederhana: ' + localFallbackAnswer(question);
    loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
    chatKeyPanel.hidden = false;
    chatSettingsBtn.setAttribute('aria-expanded', 'true');
    showKeyNote('Isi API key Groq-mu dulu supaya Tanya AI bisa menjawab.', true);
    chatInput.disabled = false;
    chatSubmitBtn.disabled = false;
    return;
  }

  try {
    let res;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${personalKey}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: question }
          ],
          temperature: 0.5,
          max_tokens: 500
        })
      });
    } catch (networkErr) {
      // Gagal terhubung ke internet / Groq (bukan soal backend, karena tidak ada backend lagi).
      loadingRow.classList.add('error');
      loadingRow.querySelector('.chat-bubble').textContent =
        'Tidak bisa terhubung ke Groq (cek koneksi internetmu). Jawaban cadangan: ' + localFallbackAnswer(question);
      loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
      setChatStatus(false, 'Tidak terhubung ke Groq');
      return;
    }

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      chatKeyPanel.hidden = false;
      chatSettingsBtn.setAttribute('aria-expanded', 'true');
      showKeyNote('Groq menolak API key ini (tidak valid/kedaluwarsa). Periksa lagi key-nya.', true);
      loadingRow.classList.add('error');
      loadingRow.querySelector('.chat-bubble').textContent = 'API key Groq ditolak (tidak valid/kedaluwarsa). Perbaiki dulu di menu ⚙️.';
      loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
      setChatStatus(false, 'Key ditolak — klik ⚙️ untuk memperbaiki');
      return;
    }

    const answer = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!res.ok || !answer) {
      const errCode = data && data.error && data.error.code;
      let errMsg = (data && data.error && data.error.message) || `Groq merespons dengan error (${res.status}).`;
      if (errCode === 'model_decommissioned' || /decommission/i.test(errMsg)) {
        errMsg = 'Model AI yang dipakai sudah tidak didukung lagi oleh Groq (model_decommissioned). ' +
          'Ini bukan soal API key-mu — beri tahu pengelola situs untuk memperbarui nama model di script.js (variabel GROQ_MODEL) ke model yang masih aktif, misalnya "openai/gpt-oss-120b".';
      }
      loadingRow.classList.add('error');
      loadingRow.querySelector('.chat-bubble').textContent = errMsg;
      loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
      return;
    }

    loadingRow.querySelector('.chat-bubble').textContent = answer.trim();
    loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
    setChatStatus(true, 'Online — pakai API key pribadi');
  } finally {
    chatInput.disabled = false;
    chatSubmitBtn.disabled = false;
    chatInput.focus();
  }
}

/* Jawaban cadangan jika app.py tidak sedang berjalan / Groq belum terhubung */
function localFallbackAnswer(question) {
  const q = question.toLowerCase();
  if (q.includes('mean') && q.includes('median')) {
    return 'Mean adalah rata-rata (jumlah data ÷ banyak data), sedangkan median adalah nilai tengah data yang sudah diurutkan. Median lebih tahan terhadap outlier.';
  }
  if (q.includes('modus')) {
    return 'Modus dipakai saat kamu ingin tahu nilai/kategori yang paling sering muncul, misalnya warna favorit atau ukuran sepatu terlaris.';
  }
  if (q.includes('outlier')) {
    return 'Outlier adalah data yang nilainya jauh berbeda dari data lain, misalnya satu gaji sangat tinggi di antara gaji-gaji kecil. Outlier bisa membuat mean menyesatkan.';
  }
  if (q.includes('lingkaran')) {
    return 'Diagram lingkaran dipakai untuk menunjukkan proporsi atau persentase bagian terhadap keseluruhan (total 100%).';
  }
  return '(Mode offline) API key Groq belum diisi/valid, jadi ini jawaban cadangan sederhana. Klik ⚙️ di jendela chat dan masukkan API key Groq-mu agar Tanya AI bisa merespons pertanyaan yang lebih luas.';
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (!val) return;
  askAI(val);
  chatInput.value = '';
});

suggestionChips.forEach(chip => {
  chip.addEventListener('click', () => askAI(chip.dataset.q));
});

/* Tidak ada backend untuk dicek — status chat sekarang murni tergantung
   ada/tidaknya API key Groq pribadi yang tersimpan di sessionStorage. */
function setChatStatus(online, label) {
  chatHeaderStatus.classList.toggle('offline', !online);
  chatHeaderStatus.innerHTML = `<span class="status-dot"></span> ${label}`;
}

function checkServerStatus() {
  if (getStoredKey()) {
    setChatStatus(true, 'Online — pakai API key pribadi');
  } else {
    setChatStatus(false, 'Key belum diisi — klik ⚙️ untuk mengisi');
  }
}
checkServerStatus();