function loadTodayNote() {
  const notes = getDayNotes();
  document.getElementById('day-note-input').value = notes[todayStr()] || '';
}

function saveDayNote() {
  const text = document.getElementById('day-note-input').value.trim();
  const notes = getDayNotes();
  if (text) notes[todayStr()] = text;
  else delete notes[todayStr()];
  saveDayNotes(notes);
  const hint = document.getElementById('note-saved-hint');
  hint.classList.add('show');
  setTimeout(() => hint.classList.remove('show'), 2000);
}
