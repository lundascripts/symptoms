let reminderTimers = [];

function updateNotifStatus() {
  const dot = document.getElementById('notif-dot');
  const txt = document.getElementById('notif-status-text');
  const btn = document.getElementById('perm-btn');
  if (!('Notification' in window)) {
    dot.className = 'notif-dot';
    txt.textContent = 'Benachrichtigungen nicht unterstützt';
    return;
  }
  const perm = Notification.permission;
  dot.className = 'notif-dot ' + (perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : '');
  txt.textContent = perm === 'granted' ? 'Benachrichtigungen aktiv'
    : perm === 'denied' ? 'Berechtigung verweigert — bitte in Browser-Einstellungen aktivieren'
    : 'Berechtigung noch nicht erteilt';
  btn.style.display = perm === 'default' ? '' : 'none';
}

async function requestNotifPermission() {
  if (!('Notification' in window)) { toast('Nicht unterstützt'); return; }
  const perm = await Notification.requestPermission();
  updateNotifStatus();
  if (perm === 'granted') { scheduleReminders(); toast('Erinnerungen aktiviert ✓'); }
  else toast('Berechtigung verweigert');
}

function renderReminderList() {
  const times = getReminders();
  document.getElementById('reminder-list').innerHTML = times.length === 0
    ? '<p style="font-size:14px;color:var(--text2);margin-bottom:8px">Noch keine Erinnerungen.</p>'
    : times.map(t => `
      <div class="reminder-row">
        <span>${t}</span>
        <button class="reminder-del" onclick="removeReminder('${t}')">×</button>
      </div>`).join('');
}

function addReminder() {
  const val = document.getElementById('reminder-time-input').value;
  if (!val) { toast('Bitte eine Uhrzeit wählen.'); return; }
  const times = getReminders();
  if (times.includes(val)) { toast('Diese Zeit ist bereits eingetragen.'); return; }
  times.push(val);
  times.sort();
  saveReminders(times);
  document.getElementById('reminder-time-input').value = '';
  renderReminderList();
  scheduleReminders();
  toast(`Erinnerung um ${val} Uhr gesetzt ✓`);
}

function removeReminder(t) {
  saveReminders(getReminders().filter(r => r !== t));
  renderReminderList();
  scheduleReminders();
}

function scheduleReminders() {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const times = getReminders();
  const now = new Date();
  times.forEach(t => {
    const [h, m] = t.split(':').map(Number);
    const fire = new Date(now);
    fire.setHours(h, m, 0, 0);
    if (fire <= now) fire.setDate(fire.getDate() + 1);
    const ms = fire - now;
    reminderTimers.push(setTimeout(() => {
      new Notification('Tagebuch', { body: 'Zeit zum Eintragen! 📋' });
      scheduleReminders();
    }, ms));
  });
}
