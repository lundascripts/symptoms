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
