function getEntries() {
  try { return JSON.parse(localStorage.getItem('tagebuch_entries') || '[]'); } catch { return []; }
}
function saveEntries(e) { localStorage.setItem('tagebuch_entries', JSON.stringify(e)); }

function getDayNotes() {
  try { return JSON.parse(localStorage.getItem('tagebuch_daynotes') || '{}'); } catch { return {}; }
}
function saveDayNotes(notes) { localStorage.setItem('tagebuch_daynotes', JSON.stringify(notes)); }


function getMealTemplates() {
  try { return JSON.parse(localStorage.getItem('tagebuch_meal_templates') || '[]'); } catch { return []; }
}
function saveMealTemplates(t) { localStorage.setItem('tagebuch_meal_templates', JSON.stringify(t)); }

function getReminders() {
  try { return JSON.parse(localStorage.getItem('tagebuch_reminders') || '[]'); } catch { return []; }
}
function saveReminders(r) { localStorage.setItem('tagebuch_reminders', JSON.stringify(r)); }

function getUsedTerms() {
  try { return JSON.parse(localStorage.getItem('tagebuch_used_terms') || '[]'); } catch { return []; }
}
function saveUsedTerms(t) { localStorage.setItem('tagebuch_used_terms', JSON.stringify(t)); }
function addUsedTerms(names) {
  const existing = new Set(getUsedTerms().map(s => s.toLowerCase()));
  const dishNames = new Set(getMealTemplates().map(d => d.name.toLowerCase()));
  const toAdd = names.filter(n => n && !existing.has(n.toLowerCase()) && !dishNames.has(n.toLowerCase()));
  if (toAdd.length) {
    saveUsedTerms([...getUsedTerms(), ...toAdd]);
    if (typeof renderUsedTermsList === 'function') renderUsedTermsList();
  }
}

function getDeletedIds() {
  try { return JSON.parse(localStorage.getItem('tagebuch_deleted_ids') || '[]'); } catch { return []; }
}
function addDeletedId(id) {
  const ids = getDeletedIds();
  if (!ids.includes(id)) { ids.push(id); localStorage.setItem('tagebuch_deleted_ids', JSON.stringify(ids)); }
}
function saveDeletedIds(ids) { localStorage.setItem('tagebuch_deleted_ids', JSON.stringify(ids)); }
