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

function getDeletedIds() {
  try { return JSON.parse(localStorage.getItem('tagebuch_deleted_ids') || '[]'); } catch { return []; }
}
function addDeletedId(id) {
  const ids = getDeletedIds();
  if (!ids.includes(id)) { ids.push(id); localStorage.setItem('tagebuch_deleted_ids', JSON.stringify(ids)); }
}
function saveDeletedIds(ids) { localStorage.setItem('tagebuch_deleted_ids', JSON.stringify(ids)); }
