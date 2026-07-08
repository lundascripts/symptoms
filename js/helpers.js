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
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
