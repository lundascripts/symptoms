const CACHE = 'tagebuch-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Reminders: [{time: 'HH:MM'}]
let reminderTimers = [];

function scheduleReminders(times) {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
  const now = new Date();
  times.forEach(t => {
    const [h, m] = t.split(':').map(Number);
    const fire = new Date(now);
    fire.setHours(h, m, 0, 0);
    if (fire <= now) fire.setDate(fire.getDate() + 1);
    const ms = fire - now;
    reminderTimers.push(setTimeout(() => {
      self.registration.showNotification('Tagebuch', {
        body: 'Zeit zum Eintragen! ✏️',
        tag: 'tagebuch-reminder',
        renotify: true,
      });
      // Reschedule for tomorrow
      scheduleReminders(times);
    }, ms));
  });
}

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_REMINDERS') {
    scheduleReminders(e.data.times || []);
  }
});

// On SW restart (e.g. after browser killed): clients will resend times on next page open
