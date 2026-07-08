const SYNC_URL_KEY   = 'tagebuch_sync_url';
const SYNC_TOKEN_KEY = 'tagebuch_sync_token';
const SYNC_LAST_KEY  = 'tagebuch_sync_last';

function getSyncUrl()    { return localStorage.getItem(SYNC_URL_KEY) || ''; }
function saveSyncUrl(u)  { localStorage.setItem(SYNC_URL_KEY, u.trim()); }
function getSyncToken()  { return localStorage.getItem(SYNC_TOKEN_KEY) || ''; }
function saveSyncToken(t){ localStorage.setItem(SYNC_TOKEN_KEY, t.trim()); }
function getLastSync()   { return localStorage.getItem(SYNC_LAST_KEY) || null; }
function setLastSync()   { localStorage.setItem(SYNC_LAST_KEY, new Date().toISOString()); }

function renderSyncSection() {
  const url = getSyncUrl();
  document.getElementById('sync-url-input').value = url;
  document.getElementById('sync-token-input').value = getSyncToken();
  updateSyncStatus();
}

function updateSyncStatus() {
  const last = getLastSync();
  const el = document.getElementById('sync-last');
  if (!last) { el.textContent = 'Noch nicht synchronisiert.'; return; }
  const d = new Date(last);
  el.textContent = 'Zuletzt: ' + d.toLocaleDateString('de-DE') + ' um ' +
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function saveSyncSettingsFromInput() {
  const url = document.getElementById('sync-url-input').value.trim();
  const token = document.getElementById('sync-token-input').value.trim();
  saveSyncUrl(url);
  saveSyncToken(token);
  toast('Einstellungen gespeichert ✓');
}

async function autoSync() {
  if (!getSyncUrl() || !getSyncToken()) return;
  try {
    await syncNow({ silent: true });
  } catch(e) { /* silent */ }
}

async function syncNow(opts = {}) {
  const silent = opts.silent || false;
  const url = getSyncUrl();
  const token = getSyncToken();
  if (!url) { if (!silent) toast('Bitte zuerst die Script-URL eintragen.'); return; }
  if (!token) { if (!silent) toast('Bitte zuerst das Token eintragen.'); return; }

  const btn = document.getElementById('sync-btn');
  if (!silent) { btn.disabled = true; btn.textContent = 'Synchronisiere…'; }

  const payload = {
    token,
    entries: getEntries(),
    dayNotes: getDayNotes(),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const merged = await res.json();

    if (merged.error) throw new Error(merged.error);

    const localIds = new Set(getEntries().map(e => e.id));
    const incoming = (merged.entries || []).filter(e => !localIds.has(e.id));
    if (incoming.length > 0) saveEntries([...getEntries(), ...incoming]);

    const localNotes = getDayNotes();
    let changed = false;
    Object.entries(merged.dayNotes || {}).forEach(([date, text]) => {
      if (!localNotes[date]) { localNotes[date] = text; changed = true; }
    });
    if (changed) saveDayNotes(localNotes);

    setLastSync();
    updateSyncStatus();
    if (!silent) {
      const newCount = incoming.length;
      toast(newCount > 0 ? `Sync ✓ — ${newCount} neue Einträge empfangen` : 'Sync ✓ — Alles aktuell');
    }
  } catch(err) {
    if (!silent) toast('Sync fehlgeschlagen: ' + err.message);
  } finally {
    if (!silent) { btn.disabled = false; btn.textContent = 'Jetzt synchronisieren'; }
  }
}
