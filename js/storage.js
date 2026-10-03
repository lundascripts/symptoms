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

function getMedFavorites() {
  try { return JSON.parse(localStorage.getItem('tagebuch_med_favorites') || '[]'); } catch { return []; }
}
function saveMedFavorites(f) { localStorage.setItem('tagebuch_med_favorites', JSON.stringify(f)); }

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

function getRecentSymptoms() {
  try { return JSON.parse(localStorage.getItem('tagebuch_recent_symptoms') || '[]'); } catch { return []; }
}
function saveRecentSymptoms(s) { localStorage.setItem('tagebuch_recent_symptoms', JSON.stringify(s)); }
function addRecentSymptoms(names) {
  const MAX = 15;
  let recent = getRecentSymptoms();
  names.forEach(name => {
    if (!name) return;
    recent = recent.filter(r => r.toLowerCase() !== name.toLowerCase());
    recent.unshift(name);
  });
  saveRecentSymptoms(recent.slice(0, MAX));
}

function getMealFollowupTimes() {
  try { return JSON.parse(localStorage.getItem('tagebuch_meal_followup_times') || '[]'); } catch { return []; }
}
function saveMealFollowupTimes(t) { localStorage.setItem('tagebuch_meal_followup_times', JSON.stringify(t)); }

function getDeletedMealTemplateIds() {
  try { return JSON.parse(localStorage.getItem('tagebuch_deleted_meal_template_ids') || '[]'); } catch { return []; }
}
function addDeletedMealTemplateId(id) {
  const ids = getDeletedMealTemplateIds();
  if (!ids.includes(id)) { ids.push(id); localStorage.setItem('tagebuch_deleted_meal_template_ids', JSON.stringify(ids)); }
}
function saveDeletedMealTemplateIds(ids) { localStorage.setItem('tagebuch_deleted_meal_template_ids', JSON.stringify(ids)); }

function getDeletedIds() {
  try { return JSON.parse(localStorage.getItem('tagebuch_deleted_ids') || '[]'); } catch { return []; }
}
function addDeletedId(id) {
  const ids = getDeletedIds();
  if (!ids.includes(id)) { ids.push(id); localStorage.setItem('tagebuch_deleted_ids', JSON.stringify(ids)); }
}
function saveDeletedIds(ids) { localStorage.setItem('tagebuch_deleted_ids', JSON.stringify(ids)); }
