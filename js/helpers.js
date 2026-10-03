function setNow(id) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const el = document.getElementById(id);
  if (el) el.value = value;
  const display = document.getElementById(id + '-display');
  if (display) {
    display.textContent = now.toLocaleDateString('de-DE', {weekday:'short', day:'numeric', month:'numeric'})
      + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
  }
}

function todayStr() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;');
}

function formatDateDE(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  if (dateStr === todayStr()) return 'Heute';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (dateStr === y.toISOString().split('T')[0]) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

const SEVERITY_LABELS = [
  'Keine Beschwerden',
  'Kaum spürbar, fällt kaum auf',
  'Leicht, aber merklich',
  'Mäßig, leicht ablenkend',
  'Deutlich, stört im Alltag',
  'Mittelstark, schwer zu ignorieren',
  'Stark, beeinträchtigt Aktivitäten',
  'Sehr stark, macht vieles schwierig',
  'Heftig, kaum funktionsfähig',
  'Kaum aushaltbar',
  'Schlimmste vorstellbare Beschwerden',
];

function severityLabel(v) { return SEVERITY_LABELS[parseInt(v)] || ''; }

function formatMealFood(food) {
  const lines = String(food).split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1) return esc(food);
  return '<ul class="meal-food-list">' + lines.map(l => `<li>${esc(l)}</li>`).join('') + '</ul>';
}

function showConfirm(message, yesLabel, noLabel, onYes, onNo) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-yes').textContent = yesLabel;
  document.getElementById('confirm-no').textContent = noLabel;
  const modal = document.getElementById('confirm-modal');
  modal.classList.add('open');
  document.getElementById('confirm-yes').onclick = () => { modal.classList.remove('open'); onYes && onYes(); };
  document.getElementById('confirm-no').onclick = () => { modal.classList.remove('open'); onNo && onNo(); };
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function toastHtml(html, duration = 4000) {
  const el = document.getElementById('toast');
  el.innerHTML = html; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

function isNative() {
  return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
}

async function _blobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

async function download(blob, filename) {
  if (isNative()) {
    await shareFile(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}

async function shareFile(blob, filename) {
  const { Filesystem, Share } = Capacitor.Plugins;
  const base64 = await _blobToBase64(blob);
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: 'CACHE',
  });
  await Share.share({
    title: filename,
    url: result.uri,
    dialogTitle: 'Datei teilen',
  });
}

async function saveToDownloads(blob, filename) {
  const { Filesystem } = Capacitor.Plugins;
  const base64 = await _blobToBase64(blob);
  await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: 'EXTERNAL_STORAGE',
    recursive: true,
  });
  toast(`Gespeichert in Downloads: ${filename}`);
}
