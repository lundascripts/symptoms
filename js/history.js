let currentFilter = 'all';

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === f));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  const dayNotes = getDayNotes();
  let entries = getEntries();

  if (currentFilter === 'note') {
    entries = [];
  } else if (currentFilter !== 'all') {
    entries = entries.filter(e => e.type === currentFilter);
  }

  entries.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  const allDays = new Set(entries.map(e => e.datetime.split('T')[0]));
  if (currentFilter === 'all' || currentFilter === 'note') {
    Object.keys(dayNotes).forEach(d => allDays.add(d));
  }
  const days = [...allDays].sort((a, b) => b.localeCompare(a));

  if (days.length === 0) {
    list.innerHTML = '<div class="empty-state">Noch keine Einträge.</div>';
    return;
  }

  const moodEmoji = ['', '😔', '😕', '😐', '🙂', '😊'];

  list.innerHTML = days.map(day => {
    const dayEntries = entries.filter(e => e.datetime.split('T')[0] === day);
    const note = (currentFilter === 'all' || currentFilter === 'note') ? dayNotes[day] : null;

    if (currentFilter === 'note' && !note) return '';

    const noteCard = note ? `
      <div class="entry-card note-card">
        <div class="entry-header">
          <div class="entry-type note">Tagesnotiz</div>
          <button class="delete-btn" onclick="deleteDayNote('${day}')" title="Löschen">×</button>
        </div>
        <div class="entry-main" style="font-weight:400;font-size:14px">${esc(note)}</div>
      </div>` : '';

    const entryCards = dayEntries.map(e => {
      if (e.type === 'meal') {
        return `<div class="entry-card meal-card">
          <div class="entry-header">
            <div><div class="entry-type meal">Mahlzeit</div><div class="entry-main">${esc(e.food)}</div></div>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="entry-time">${formatTime(e.datetime)}</div>
              <button class="edit-btn" onclick="openEditModal(${e.id})" title="Bearbeiten">✏</button>
              <button class="delete-btn" onclick="deleteEntry(${e.id})">×</button>
            </div>
          </div>
          ${e.notes ? `<div class="entry-notes">${esc(e.notes)}</div>` : ''}
        </div>`;
      } else {
        // Support both old format (description+severity) and new format (symptoms array)
        let symptomsHtml;
        if (e.symptoms && e.symptoms.length) {
          symptomsHtml = e.symptoms.map(s =>
            `<span class="meta-chip">${esc(s.name)} <strong>${s.severity}/10</strong></span>`
          ).join('');
        } else if (e.description) {
          symptomsHtml = `<span class="meta-chip">${esc(e.description)} <strong>${e.severity}/10</strong></span>`;
        } else {
          symptomsHtml = '';
        }
        const extraChips = [
          e.bristol ? `Bristol ${e.bristol}` : null,
          e.mood ? moodEmoji[e.mood] : null,
        ].filter(Boolean);
        const mainLabel = e.symptoms && e.symptoms.length
          ? e.symptoms.map(s => s.name).join(', ')
          : (e.description || (e.bristol ? `Bristol ${e.bristol}` : '') || (e.mood ? moodEmoji[e.mood] : ''));
        return `<div class="entry-card symptom-card">
          <div class="entry-header">
            <div><div class="entry-type symptom">Symptom</div><div class="entry-main">${esc(mainLabel)}</div></div>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="entry-time">${formatTime(e.datetime)}</div>
              <button class="edit-btn" onclick="openEditModal(${e.id})" title="Bearbeiten">✏</button>
              <button class="delete-btn" onclick="deleteEntry(${e.id})">×</button>
            </div>
          </div>
          <div class="entry-meta">${symptomsHtml}${extraChips.map(c => `<span class="meta-chip">${c}</span>`).join('')}</div>
          ${e.notes ? `<div class="entry-notes">${esc(e.notes)}</div>` : ''}
        </div>`;
      }
    }).join('');

    return `<div class="day-group">
      <div class="day-label">${formatDay(day)}</div>
      ${noteCard}${entryCards}
    </div>`;
  }).filter(Boolean).join('');
}

function deleteEntry(id) {
  if (!confirm('Eintrag löschen?')) return;
  saveEntries(getEntries().filter(e => e.id !== id));
  addDeletedId(id);
  renderHistory();
  autoSync();
}

function deleteDayNote(dateStr) {
  if (!confirm('Notiz löschen?')) return;
  const notes = getDayNotes();
  delete notes[dateStr];
  saveDayNotes(notes);
  if (dateStr === todayStr()) document.getElementById('day-note-input').value = '';
  renderHistory();
}

function openExport() { document.getElementById('export-modal').classList.add('open'); }
function closeExport(e) {
  if (!e || e.target === document.getElementById('export-modal'))
    document.getElementById('export-modal').classList.remove('open');
}

function exportJSON() {
  const data = { entries: getEntries(), dayNotes: getDayNotes() };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    `tagebuch_${todayStr()}.json`);
  closeExport();
}

function exportCSV() {
  const entries = getEntries();
  const dayNotes = getDayNotes();
  const rows = [['ID', 'Typ', 'Datum', 'Uhrzeit', 'Inhalt', 'Schweregrad', 'Bristol', 'Stimmung', 'Notizen']];

  entries.sort((a,b) => new Date(a.datetime) - new Date(b.datetime)).forEach(e => {
    const d = new Date(e.datetime);
    rows.push([
      e.id,
      e.type === 'meal' ? 'Mahlzeit' : 'Symptom',
      d.toLocaleDateString('de-DE'),
      d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      e.type === 'meal' ? (e.food || '') :
        (e.symptoms ? e.symptoms.map(s => s.name).join(', ') : (e.description || '')),
      e.type === 'symptom'
        ? (e.symptoms ? e.symptoms.map(s => `${s.name}:${s.severity}`).join('; ') : e.severity)
        : '',
      e.bristol || '',
      e.mood || '',
      e.notes || '',
    ]);
  });

  Object.entries(dayNotes).sort().forEach(([date, text]) => {
    rows.push(['', 'Tagesnotiz', date, '', text, '', '', '', '']);
  });

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
    `tagebuch_${todayStr()}.csv`);
  closeExport();
}

function triggerImport() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const raw = JSON.parse(ev.target.result);
        const imported = Array.isArray(raw) ? raw : (raw.entries || []);
        const importedNotes = Array.isArray(raw) ? {} : (raw.dayNotes || {});

        const existing = getEntries();
        const existingIds = new Set(existing.map(e => e.id));
        const newEntries = imported.filter(e => e && e.id && !existingIds.has(e.id));
        saveEntries([...existing, ...newEntries]);

        const existingNotes = getDayNotes();
        let newNoteCount = 0;
        Object.entries(importedNotes).forEach(([date, text]) => {
          if (!existingNotes[date]) { existingNotes[date] = text; newNoteCount++; }
        });
        saveDayNotes(existingNotes);

        toast(`${newEntries.length} Einträge + ${newNoteCount} Notizen importiert ✓`);
      } catch { toast('Fehler beim Lesen der Datei'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
