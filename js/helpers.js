function setNow(id) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  document.getElementById(id).value =
    `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
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
