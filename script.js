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

/* ---------- 2. ACCORDION MATERI ---------- */
document.querySelectorAll('.acc-head').forEach(head => {
  head.addEventListener('click', () => {
    head.closest('.acc-item').classList.toggle('open');
  });
});

/* ---------- 3. FORM JAWABAN STUDI KASUS ---------- */
/* User harus mengisi & mengirim jawaban dulu, baru pembahasan (case-answer) muncul. */
document.querySelectorAll('.case-card').forEach(card => {
  const toggleBtn = card.querySelector('.case-answer-toggle');
  const form = card.querySelector('.case-answer-form');
  const submitBtn = card.querySelector('.case-submit-btn');
  const textarea = card.querySelector('.case-answer-form textarea');
  const answerBox = card.querySelector('.case-answer');
  if (!toggleBtn || !form || !submitBtn || !answerBox) return;

  toggleBtn.addEventListener('click', () => {
    form.classList.add('show');
    toggleBtn.setAttribute('hidden', '');
    if (textarea) textarea.focus();
  });

  submitBtn.addEventListener('click', () => {
    form.classList.remove('show');
    answerBox.classList.add('show');
    card.classList.add('answered');
    answerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

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
    q: '1. Data: 5, 7, 7, 9, 12. Berapa mean-nya?',
    opts: ['7', '8', '9', '7,5'],
    correct: 1
  },
  {
    q: '2. Data: 3, 8, 4, 8, 6, 8. Berapa modusnya?',
    opts: ['3', '6', '8', 'Tidak ada'],
    correct: 2
  },
  {
    q: '3. Data terurut: 2, 4, 6, 8. Berapa mediannya?',
    opts: ['4', '5', '6', '8'],
    correct: 1
  },
  {
    q: '4. Ukuran pemusatan mana yang paling tahan terhadap outlier (nilai ekstrem)?',
    opts: ['Mean', 'Median', 'Range', 'Jumlah data'],
    correct: 1
  },
  {
    q: '5. Diagram apa yang paling tepat untuk menunjukkan tren suhu selama 7 hari?',
    opts: ['Diagram lingkaran', 'Diagram batang', 'Diagram garis', 'Tabel saja'],
    correct: 2
  },
  {
    q: '6. Diagram lingkaran paling cocok digunakan untuk menunjukkan...',
    opts: ['Urutan waktu', 'Proporsi/persentase dari keseluruhan', 'Perbandingan dua angka acak', 'Data yang belum diolah'],
    correct: 1
  },
  {
    q: '7. Perhatikan diagram batang jumlah siswa per ekstrakurikuler berikut. Ekstrakurikuler mana yang jumlah siswanya paling banyak?',
    visual: svgBar([
      { label: 'Bola', value: 12 },
      { label: 'Musik', value: 8 },
      { label: 'Tari', value: 5 },
      { label: 'Paskibra', value: 10 }
    ], '#4F6BFF'),
    opts: ['Bola', 'Musik', 'Tari', 'Paskibra'],
    correct: 0
  },
  {
    q: '8. Perhatikan tabel frekuensi nilai ulangan berikut. Berapa modus dari data tersebut?',
    visual: tableFreq(['Nilai', 'Frekuensi'], [['70', '2'], ['80', '4'], ['90', '3'], ['100', '1']]),
    opts: ['70', '80', '90', '100'],
    correct: 1
  },
  {
    q: '9. Perhatikan diagram garis suhu harian berikut (Senin–Jumat). Suhu tertinggi terjadi pada hari...',
    visual: svgLine([
      { label: 'Sen', value: 28 },
      { label: 'Sel', value: 30 },
      { label: 'Rab', value: 29 },
      { label: 'Kam', value: 32 },
      { label: 'Jum', value: 31 }
    ], '#0EA5A4'),
    opts: ['Senin', 'Selasa', 'Kamis', 'Jumat'],
    correct: 2
  },
  {
    q: '10. Perhatikan diagram lingkaran jenis buku di perpustakaan berikut. Kategori buku dengan proporsi terbesar adalah...',
    visual: svgPie([
      { label: 'Fiksi', value: 40 },
      { label: 'Sains', value: 30 },
      { label: 'Komik', value: 20 },
      { label: 'Lainnya', value: 10 }
    ], ['#4F6BFF', '#16A34A', '#F59E0B', '#8B5CF6']),
    opts: ['Fiksi', 'Sains', 'Komik', 'Lainnya'],
    correct: 0
  },
  {
    q: '11. Data: 65, 70, 78, 90. Berapa jangkauan (range) data tersebut?',
    opts: ['15', '20', '25', '30'],
    correct: 2
  },
  {
    q: '12. Perhatikan tabel frekuensi berikut. Berapa mean dari data tersebut?',
    visual: tableFreq(['Nilai', 'Frekuensi'], [['6', '2'], ['7', '3'], ['8', '5']]),
    opts: ['7', '7,3', '7,5', '8'],
    correct: 1
  },
  {
    q: '13. Perhatikan diagram batang jumlah pengunjung perpustakaan berikut (Senin–Jumat). Total pengunjung selama 5 hari tersebut adalah...',
    visual: svgBar([
      { label: 'Sen', value: 20 },
      { label: 'Sel', value: 25 },
      { label: 'Rab', value: 15 },
      { label: 'Kam', value: 30 },
      { label: 'Jum', value: 20 }
    ], '#F59E0B'),
    opts: ['100', '105', '110', '115'],
    correct: 2
  },
  {
    q: '14. Seorang peneliti ingin tahu rata-rata tinggi badan seluruh siswa kelas VIII se-Indonesia, tapi ia hanya mengukur 200 siswa dari beberapa sekolah. 200 siswa tersebut disebut...',
    opts: ['Populasi', 'Sampel', 'Variabel', 'Modus'],
    correct: 1
  },
  {
    q: '15. Data warna baju favorit siswa (merah, biru, hijau) termasuk jenis data...',
    opts: ['Data kuantitatif', 'Data kualitatif', 'Data tunggal', 'Data frekuensi'],
    correct: 1
  },
  {
    q: '16. Untuk membandingkan jumlah siswa antar beberapa ekstrakurikuler yang berbeda, diagram paling tepat digunakan adalah...',
    opts: ['Diagram garis', 'Diagram batang', 'Diagram lingkaran', 'Tabel turus saja'],
    correct: 1
  },
  {
    q: '17. Data: 2, 2, 3, 3, 5. Data ini memiliki...',
    opts: ['Satu modus, yaitu 5', 'Dua modus (multimodal), yaitu 2 dan 3', 'Tidak ada modus', 'Modus = 2,5'],
    correct: 1
  },
  {
    q: '18. Nilai yang jauh berbeda (sangat tinggi atau sangat rendah) dibanding sebagian besar data lain disebut...',
    opts: ['Median', 'Modus', 'Outlier', 'Frekuensi'],
    correct: 2
  },
  {
    q: '19. Data gaji karyawan (juta rupiah): 4, 5, 4, 5, 4, 50 (gaji bos). Ukuran pemusatan yang paling tepat mewakili gaji "khas" karyawan adalah...',
    opts: ['Mean, karena menghitung semua data', 'Median, karena tahan terhadap outlier', 'Modus, karena nilai tersering pasti benar', 'Jangkauan, karena menunjukkan rentang data'],
    correct: 1
  },
  {
    q: '20. Perhatikan diagram garis jumlah pengunjung pameran sekolah berikut (Januari–Mei). Tren yang terlihat secara umum adalah...',
    visual: svgLine([
      { label: 'Jan', value: 20 },
      { label: 'Feb', value: 22 },
      { label: 'Mar', value: 25 },
      { label: 'Apr', value: 23 },
      { label: 'Mei', value: 28 }
    ], '#8B5CF6'),
    opts: ['Terus menurun', 'Cenderung meningkat meski sempat sedikit turun', 'Stabil tanpa perubahan', 'Naik turun tidak beraturan'],
    correct: 1
  }
];

const quizForm = document.getElementById('quizForm');
const quizResult = document.getElementById('quizResult');

function renderQuiz() {
  quizForm.innerHTML = '';
  QUIZ.forEach((item, qi) => {
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
    quizForm.appendChild(wrap);
  });
}
renderQuiz();

document.getElementById('submitQuiz').addEventListener('click', (e) => {
  e.preventDefault();
  let score = 0;
  QUIZ.forEach((item, qi) => {
    const selected = quizForm.querySelector(`input[name="q${qi}"]:checked`);
    const optLabels = quizForm.querySelectorAll(`.quiz-q[data-index="${qi}"] .quiz-opt`);
    optLabels.forEach((label, oi) => {
      label.classList.remove('correct', 'wrong');
      if (oi === item.correct) label.classList.add('correct');
      if (selected && Number(selected.value) === oi && oi !== item.correct) label.classList.add('wrong');
    });
    if (selected && Number(selected.value) === item.correct) score++;
  });

  const pct = Math.round((score / QUIZ.length) * 100);
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
  titleEl.appendChild(document.createTextNode(` Skor kamu: ${score} / ${QUIZ.length} (${pct}%)`));
  document.getElementById('quizScoreDesc').textContent = msg;
  quizResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('resetQuiz').addEventListener('click', (e) => {
  e.preventDefault();
  quizForm.reset();
  quizForm.querySelectorAll('.quiz-opt').forEach(l => l.classList.remove('correct', 'wrong'));
  quizResult.hidden = true;
});

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

async function askAI(question) {
  addChatMessage(question, 'user');
  chatInput.disabled = true;
  chatSubmitBtn.disabled = true;
  const loadingRow = addTypingIndicator();

  const personalKey = getStoredKey();

  try {
    let res;
    try {
      res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(personalKey ? { 'X-Groq-Key': personalKey } : {})
        },
        body: JSON.stringify({ question })
      });
    } catch (networkErr) {
      // Server app.py benar-benar tidak terjangkau (belum dijalankan / salah port / dsb).
      loadingRow.classList.add('error');
      loadingRow.querySelector('.chat-bubble').textContent =
        'Server app.py tidak terjangkau. Pastikan sudah menjalankan "python app.py" di terminal, lalu coba lagi. ' +
        'Jawaban cadangan: ' + localFallbackAnswer(question);
      loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
      setChatStatus(false, 'Server backend (app.py) tidak terdeteksi');
      return;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.answer) {
      // Server MENJAWAB, tapi dengan error (key salah, kuota Groq habis, dll).
      // Tampilkan pesan error aslinya — jangan disamarkan jadi "mode offline".
      if (data && data.needs_key) {
        chatKeyPanel.hidden = false;
        chatSettingsBtn.setAttribute('aria-expanded', 'true');
        showKeyNote(data.error, true);
      }
      loadingRow.classList.add('error');
      loadingRow.querySelector('.chat-bubble').textContent =
        (data && data.error) || `Server merespons dengan error (${res.status}).`;
      loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
      return;
    }

    loadingRow.querySelector('.chat-bubble').textContent = data.answer;
    loadingRow.querySelector('.chat-bubble-wrap').insertAdjacentHTML('beforeend', `<span class="chat-time">${nowLabel()}</span>`);
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
  return '(Mode offline) Server app.py belum aktif atau GROQ_API_KEY belum diisi, jadi ini jawaban cadangan sederhana. Jalankan "python app.py" dan pastikan API key sudah benar agar Tanya AI bisa merespons pertanyaan yang lebih luas.';
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

/* cek status server saat halaman dimuat, ditampilkan di header chat */
function setChatStatus(online, label) {
  chatHeaderStatus.classList.toggle('offline', !online);
  chatHeaderStatus.innerHTML = `<span class="status-dot"></span> ${label}`;
}

async function checkServerStatus() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (getStoredKey()) {
        setChatStatus(true, 'Online — pakai API key pribadi');
      } else if (data.groq_configured) {
        setChatStatus(true, 'Online — Groq AI aktif');
      } else {
        setChatStatus(false, 'Key belum diisi — klik ⚙️ untuk mengisi');
      }
      return;
    }
  } catch (e) { /* server tidak terjangkau, jatuh ke status offline di bawah */ }
  setChatStatus(false, 'Server backend (app.py) tidak terdeteksi');
}
checkServerStatus();