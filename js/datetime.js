// ── Custom Datetime Picker ──

function localIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let _dtTargetId = null;   // hidden input id to write to
let _dtWeekOffset = 0;    // weeks relative to current week
let _dtSelectedDate = ''; // YYYY-MM-DD
let _dtHour = 0;
let _dtMinute = 0;

function openDtPicker(targetId) {
  _dtTargetId = targetId;
  const existing = document.getElementById(targetId).value;
  const now = existing ? new Date(existing) : new Date();
  _dtHour = now.getHours();
  _dtMinute = Math.round(now.getMinutes() / 5) * 5 % 60;
  _dtSelectedDate = localIso(now);
  _dtWeekOffset = 0;

  // Find week offset for existing date
  const today = new Date();
  today.setHours(0,0,0,0);
  const sel = new Date(_dtSelectedDate + 'T12:00:00');
  const diffDays = Math.round((sel - today) / 86400000);
  _dtWeekOffset = Math.floor(diffDays / 7);

  renderDtWeek();
  renderDtHours();
  renderDtMinutes();
  document.getElementById('dt-picker-modal').classList.add('open');
}

function closeDtPicker(e) {
  if (!e || e.target === document.getElementById('dt-picker-modal'))
    document.getElementById('dt-picker-modal').classList.remove('open');
}

function dtWeekShift(dir) {
  _dtWeekOffset += dir;
  renderDtWeek();
}

function renderDtWeek() {
  const today = new Date();
  today.setHours(0,0,0,0);
  // Monday of current week + offset
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + _dtWeekOffset * 7);

  const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const container = document.getElementById('dt-week-days');
  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = localIso(d);
    const isToday = iso === localIso(today);
    const isSelected = iso === _dtSelectedDate;
    const isFuture = d > today;
    html += `<button class="dt-day-btn${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${isFuture ? ' future' : ''}"
      onclick="selectDtDate('${iso}')" ${isFuture ? 'disabled' : ''}>
      <span class="dt-day-name">${DAY_NAMES[i]}</span>
      <span class="dt-day-num">${d.getDate()}</span>
    </button>`;
  }
  container.innerHTML = html;
}

function selectDtDate(iso) {
  _dtSelectedDate = iso;
  renderDtWeek();
}

function renderDtHours() {
  const col = document.getElementById('dt-hours');
  let html = '';
  for (let h = 0; h <= 23; h++) {
    html += `<button class="dt-time-btn${h === _dtHour ? ' selected' : ''}" onclick="selectDtHour(${h})">${String(h).padStart(2,'0')}</button>`;
  }
  col.innerHTML = html;
  scrollDtCol(col, _dtHour);
}

function renderDtMinutes() {
  const col = document.getElementById('dt-minutes');
  let html = '';
  for (let m = 0; m < 60; m += 5) {
    html += `<button class="dt-time-btn${m === _dtMinute ? ' selected' : ''}" onclick="selectDtMinute(${m})">${String(m).padStart(2,'0')}</button>`;
  }
  col.innerHTML = html;
  scrollDtCol(col, _dtMinute / 5);
}

function scrollDtCol(col, index) {
  setTimeout(() => {
    const btn = col.querySelectorAll('.dt-time-btn')[index];
    if (btn) btn.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 50);
}

function selectDtHour(h) {
  _dtHour = h;
  renderDtHours();
}

function selectDtMinute(m) {
  _dtMinute = m;
  renderDtMinutes();
}

function confirmDtPicker() {
  const pad = n => String(n).padStart(2, '0');
  const value = `${_dtSelectedDate}T${pad(_dtHour)}:${pad(_dtMinute)}`;
  document.getElementById(_dtTargetId).value = value;
  // Update display button
  const displayId = _dtTargetId + '-display';
  const display = document.getElementById(displayId);
  if (display) {
    const d = new Date(value);
    display.textContent = d.toLocaleDateString('de-DE', {weekday:'short', day:'numeric', month:'numeric'})
      + ' ' + pad(_dtHour) + ':' + pad(_dtMinute);
  }
  document.getElementById('dt-picker-modal').classList.remove('open');
}
