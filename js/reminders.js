let _swReg = null;

function isCapacitor() {
  return typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();
}

// ── Native (Capacitor) ──────────────────────────────────────────────────────

async function requestNotifPermissionNative() {
  const { LocalNotifications } = Capacitor.Plugins;
  const status = await LocalNotifications.requestPermissions();
  updateNotifStatus();
  if (status.display === 'granted') {
    toast('Erinnerungen aktiviert ✓');
    await scheduleNativeReminders();
  } else {
    toast('Berechtigung verweigert');
  }
}

async function ensureChannel() {
  const { LocalNotifications } = Capacitor.Plugins;
  await LocalNotifications.createChannel({
    id: 'reminders',
    name: 'Erinnerungen',
    importance: 4,
    vibration: true,
  });
}

async function scheduleNativeReminders() {
  const { LocalNotifications } = Capacitor.Plugins;
  await ensureChannel();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const times = getReminders();
  if (!times.length) return;

  const notifications = times.map((t, i) => {
    const [h, m] = t.split(':').map(Number);
    const now = new Date();
    const fire = new Date(now);
    fire.setHours(h, m, 0, 0);
    if (fire <= now) fire.setDate(fire.getDate() + 1);
    return {
      id: i + 1,
      title: 'Symptom-Tagebuch',
      body: 'Zeit zum Eintragen! ✏️',
      schedule: { at: fire, repeats: true, every: 'day' },
      channelId: 'reminders',
    };
  });

  await LocalNotifications.schedule({ notifications });
}

async function getNativePermissionStatus() {
  const { LocalNotifications } = Capacitor.Plugins;
  const status = await LocalNotifications.checkPermissions();
  return status.display;
}

// ── Web (Service Worker) ────────────────────────────────────────────────────

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

// ── Shared UI ───────────────────────────────────────────────────────────────

async function updateNotifStatus() {
  const dot = document.getElementById('notif-dot');
  const txt = document.getElementById('notif-status-text');
  const btn = document.getElementById('perm-btn');
  const iosHint = document.getElementById('ios-hint');

  if (isCapacitor()) {
    if (iosHint) iosHint.style.display = 'none';
    const perm = await getNativePermissionStatus();
    dot.className = 'notif-dot ' + (perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : '');
    txt.textContent = perm === 'granted' ? 'Benachrichtigungen aktiv'
      : perm === 'denied' ? 'Berechtigung verweigert — bitte in Android-Einstellungen aktivieren'
      : 'Berechtigung noch nicht erteilt';
    btn.style.display = perm === 'granted' ? 'none' : '';
    return;
  }

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
  if (isCapacitor()) { await requestNotifPermissionNative(); return; }
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

async function addReminder() {
  const val = document.getElementById('reminder-time-input').value;
  if (!val) { toast('Bitte eine Uhrzeit wählen.'); return; }
  const times = getReminders();
  if (times.includes(val)) { toast('Diese Zeit ist bereits eingetragen.'); return; }
  times.push(val);
  times.sort();
  saveReminders(times);
  document.getElementById('reminder-time-input').value = '';
  renderReminderList();
  if (isCapacitor()) {
    await scheduleNativeReminders();
  } else {
    sendTimesToSW();
  }
  toast(`Erinnerung um ${val} Uhr gesetzt ✓`);
}

async function removeReminder(t) {
  saveReminders(getReminders().filter(r => r !== t));
  renderReminderList();
  if (isCapacitor()) {
    await scheduleNativeReminders();
  } else {
    sendTimesToSW();
  }
}

function scheduleReminders() {
  if (isCapacitor()) {
    getNativePermissionStatus().then(p => { if (p === 'granted') scheduleNativeReminders(); });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    sendTimesToSW();
  }
}

async function scheduleMealFollowup() {
  const times = getMealFollowupTimes();
  if (!times.length) return;

  if (isCapacitor()) {
    const { LocalNotifications } = Capacitor.Plugins;
    const perm = await getNativePermissionStatus();
    if (perm !== 'granted') return;
    await ensureChannel();
    // Bestehende Follow-ups canceln (negative IDs)
    const pending = await LocalNotifications.getPending();
    const followups = pending.notifications.filter(n => n.id < 0);
    if (followups.length) await LocalNotifications.cancel({ notifications: followups });
    const now = Date.now();
    await LocalNotifications.schedule({
      notifications: times.map((mins, i) => ({
        id: -(i + 1),
        title: 'Symptom-Tagebuch',
        body: 'Wie geht\'s dir nach der Mahlzeit? Symptome erfassen ✏️',
        schedule: { at: new Date(now + mins * 60 * 1000) },
        channelId: 'reminders',
      })),
    });
  } else {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!navigator.serviceWorker?.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_MEAL_FOLLOWUP',
      times,
    });
  }
}

function renderMealFollowupList() {
  const times = getMealFollowupTimes();
  const el = document.getElementById('meal-followup-list');
  if (!el) return;
  el.innerHTML = times.length === 0
    ? '<p style="font-size:14px;color:var(--text2);margin-bottom:8px">Noch keine Follow-up-Zeiten.</p>'
    : times.map(m => `
      <div class="reminder-row">
        <span>Nach ${m} Minuten</span>
        <button class="reminder-del" onclick="removeMealFollowupTime(${m})">×</button>
      </div>`).join('');
}

async function addMealFollowupTime() {
  const input = document.getElementById('meal-followup-input');
  const val = parseInt(input.value);
  if (!val || val < 1 || val > 999) { toast('Bitte eine Minutenzahl zwischen 1 und 999 eingeben.'); return; }
  const times = getMealFollowupTimes();
  if (times.includes(val)) { toast('Diese Zeit ist bereits eingetragen.'); return; }
  times.push(val);
  times.sort((a, b) => a - b);
  saveMealFollowupTimes(times);
  input.value = '';
  renderMealFollowupList();
  toast(`Follow-up nach ${val} min gesetzt ✓`);
}

function removeMealFollowupTime(m) {
  saveMealFollowupTimes(getMealFollowupTimes().filter(t => t !== m));
  renderMealFollowupList();
}

// Beim Laden initialisieren
if (isCapacitor()) {
  updateNotifStatus();
} else if ('Notification' in window && Notification.permission === 'granted') {
  initServiceWorker();
}
