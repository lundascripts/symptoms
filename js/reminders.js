let _swReg = null;

async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const swUrl = new URL('sw.js', document.baseURI).href;
    _swReg = await navigator.serviceWorker.register(swUrl);
    await navigator.serviceWorker.ready;
    sendTimesToSW();
  } catch (e) {
    console.warn('SW registration failed:', e);
  }
}

function sendTimesToSW() {
  const times = getReminders();
  if (!navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_REMINDERS', times });
}

function updateNotifStatus() {
  const dot = document.getElementById('notif-dot');
  const txt = document.getElementById('notif-status-text');
  const btn = document.getElementById('perm-btn');
  const iosHint = document.getElementById('ios-hint');

  // iOS Safari ohne PWA: Notification API nicht verfügbar
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true;

  if (!('Notification' in window)) {
    dot.className = 'notif-dot';
    if (isIOS && !isStandalone) {
      txt.textContent = 'Erinnerungen auf iOS nur als Homescreen-App verfügbar';
      if (iosHint) iosHint.style.display = '';
    } else {
      txt.textContent = 'Benachrichtigungen nicht unterstützt';
    }
    btn.style.display = 'none';
    return;
  }

  if (iosHint) iosHint.style.display = 'none';
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
  if (perm === 'granted') {
    await initServiceWorker();
    toast('Erinnerungen aktiviert ✓');
  } else {
    toast('Berechtigung verweigert');
  }
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
  sendTimesToSW();
  toast(`Erinnerung um ${val} Uhr gesetzt ✓`);
}

function removeReminder(t) {
  saveReminders(getReminders().filter(r => r !== t));
  renderReminderList();
  sendTimesToSW();
}

// Beim Laden: SW registrieren falls Berechtigung bereits erteilt
if ('Notification' in window && Notification.permission === 'granted') {
  initServiceWorker();
}
