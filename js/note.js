function noteSelectedDate() {
  return document.getElementById('note-date-picker').value || todayStr();
}

function updateNoteTitle() {
  const val = noteSelectedDate();
  const title = document.getElementById('note-title');
  title.textContent = val === todayStr() ? 'Notiz zum heutigen Tag' : 'Notiz vom ' + formatDateDE(val);
}

function loadTodayNote() {
  const picker = document.getElementById('note-date-picker');
  if (!picker.value) picker.value = todayStr();
  updateNoteTitle();
  const notes = getDayNotes();
  document.getElementById('day-note-input').value = notes[noteSelectedDate()] || '';
}

function onNoteDateChange() {
  updateNoteTitle();
  const notes = getDayNotes();
  document.getElementById('day-note-input').value = notes[noteSelectedDate()] || '';
}

function saveDayNote() {
  const text = document.getElementById('day-note-input').value.trim();
  const date = noteSelectedDate();
  const notes = getDayNotes();
  if (text) notes[date] = text;
  else delete notes[date];
  saveDayNotes(notes);
  const hint = document.getElementById('note-saved-hint');
  hint.classList.add('show');
  setTimeout(() => hint.classList.remove('show'), 2000);
  autoSync();
}
