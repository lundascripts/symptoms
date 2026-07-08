let editEntryId = null;
let editSymptomRows = [];
let editSelectedBristol = null;
let editSelectedMood = null;

function openEditModal(id) {
  const entry = getEntries().find(e => e.id === id);
  if (!entry) return;
  editEntryId = id;

  document.getElementById('edit-dt').value = entry.datetime;

  const isMeal = entry.type === 'meal';
  document.getElementById('edit-meal-section').style.display = isMeal ? '' : 'none';
  document.getElementById('edit-symptom-section').style.display = isMeal ? 'none' : '';
  document.getElementById('edit-save-as-dish-btn').style.display = isMeal ? '' : 'none';

  if (isMeal) {
    document.getElementById('edit-meal-food').value = entry.food || '';
    document.getElementById('edit-meal-notes').value = entry.notes || '';
  } else {
    // Symptom rows
    editSymptomRows = entry.symptoms
      ? entry.symptoms.map(s => ({ name: s.name, severity: s.severity }))
      : (entry.description ? [{ name: entry.description, severity: entry.severity || 0 }] : []);
    renderEditSymptomRows();

    // Bristol
    editSelectedBristol = entry.bristol || null;
    document.querySelectorAll('.edit-bristol-btn').forEach(btn =>
      btn.classList.toggle('selected', parseInt(btn.dataset.n) === editSelectedBristol));
    document.getElementById('edit-bristol-hint').textContent =
      editSelectedBristol ? bristolData[editSelectedBristol - 1].desc : 'Tippe auf einen Typ für eine Beschreibung.';

    // Mood
    editSelectedMood = entry.mood || null;
    document.querySelectorAll('.edit-mood-btn').forEach(btn =>
      btn.classList.toggle('selected', parseInt(btn.dataset.mood) === editSelectedMood));

    document.getElementById('edit-symptom-notes').value = entry.notes || '';
    document.getElementById('edit-symptom-custom-input').value = '';
  }

  document.getElementById('edit-modal').classList.add('open');
}

function closeEditModal(e) {
  if (!e || e.target === document.getElementById('edit-modal'))
    document.getElementById('edit-modal').classList.remove('open');
}

function renderEditSymptomRows() {
  const container = document.getElementById('edit-symptom-list');
  if (!container) return;
  container.innerHTML = editSymptomRows.map((row, i) => `
    <div class="symptom-row" data-index="${i}">
      <div class="symptom-row-name">${esc(row.name)}</div>
      <div class="symptom-row-controls">
        <input type="range" min="0" max="10" value="${row.severity}"
          oninput="updateEditSymptomSeverity(${i}, this.value)"
          class="symptom-row-slider" />
        <div class="symptom-row-val">${row.severity} <span class="severity-label">${severityLabel(row.severity)}</span></div>
        <button class="symptom-row-del" onclick="removeEditSymptomRow(${i})">×</button>
      </div>
    </div>
  `).join('');
}

function updateEditSymptomSeverity(index, value) {
  editSymptomRows[index].severity = parseInt(value);
  const rows = document.querySelectorAll('#edit-symptom-list .symptom-row');
  if (rows[index]) rows[index].querySelector('.symptom-row-val').innerHTML = `${value} <span class="severity-label">${severityLabel(value)}</span>`;
}

function removeEditSymptomRow(index) {
  editSymptomRows.splice(index, 1);
  renderEditSymptomRows();
}

function addEditSymptomChip(name) {
  const exists = editSymptomRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  if (exists !== -1) {
    const rows = document.querySelectorAll('#edit-symptom-list .symptom-row');
    if (rows[exists]) {
      rows[exists].classList.add('symptom-row-highlight');
      setTimeout(() => rows[exists].classList.remove('symptom-row-highlight'), 800);
    }
    return;
  }
  editSymptomRows.push({ name, severity: 5 });
  renderEditSymptomRows();
}

function addEditSymptomCustom() {
  const input = document.getElementById('edit-symptom-custom-input');
  const name = input.value.trim();
  if (!name) return;
  if (editSymptomRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase()) !== -1) {
    toast('Dieses Symptom ist bereits in der Liste.');
    return;
  }
  editSymptomRows.push({ name, severity: 5 });
  input.value = '';
  renderEditSymptomRows();
}

function selectEditBristol(n) {
  editSelectedBristol = editSelectedBristol === n ? null : n;
  document.querySelectorAll('.edit-bristol-btn').forEach(btn =>
    btn.classList.toggle('selected', parseInt(btn.dataset.n) === editSelectedBristol));
  document.getElementById('edit-bristol-hint').textContent = editSelectedBristol
    ? bristolData[editSelectedBristol - 1].desc
    : 'Tippe auf einen Typ für eine Beschreibung.';
}

function selectEditMood(n) {
  editSelectedMood = editSelectedMood === n ? null : n;
  document.querySelectorAll('.edit-mood-btn').forEach(btn =>
    btn.classList.toggle('selected', parseInt(btn.dataset.mood) === editSelectedMood));
}

function buildEditBristolButtons() {
  const top = document.getElementById('edit-bristol-top');
  const bot = document.getElementById('edit-bristol-bottom');
  bristolData.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'bristol-btn edit-bristol-btn';
    btn.dataset.n = b.n;
    btn.innerHTML = `<span class="bnum">${b.n}</span><span class="blabel">${b.short}</span>`;
    btn.onclick = () => selectEditBristol(b.n);
    (b.n <= 4 ? top : bot).appendChild(btn);
  });
}

function saveEdit() {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === editEntryId);
  if (idx === -1) return;

  const entry = entries[idx];
  entry.datetime = document.getElementById('edit-dt').value;

  if (entry.type === 'meal') {
    const food = document.getElementById('edit-meal-food').value.trim();
    if (!food) { toast('Bitte das Essen eintragen.'); return; }
    entry.food = food;
    entry.notes = document.getElementById('edit-meal-notes').value.trim() || null;
  } else {
    if (editSymptomRows.length === 0 && !editSelectedBristol && !editSelectedMood) {
      toast('Bitte mindestens ein Symptom, Stuhlgang oder Stimmung angeben.');
      return;
    }
    entry.symptoms = editSymptomRows.map(r => ({ name: r.name, severity: r.severity }));
    // Remove old-format fields if present
    delete entry.description;
    delete entry.severity;
    entry.bristol = editSelectedBristol || null;
    entry.mood = editSelectedMood || null;
    entry.notes = document.getElementById('edit-symptom-notes').value.trim() || null;
  }

  saveEntries(entries);
  document.getElementById('edit-modal').classList.remove('open');
  renderHistory();
  toast('Eintrag aktualisiert ✓');
  autoSync();
}

function saveEditMealAsDish() {
  const food = document.getElementById('edit-meal-food').value.trim();
  document.getElementById('edit-modal').classList.remove('open');
  openDishModal();
  document.getElementById('dish-new-form').style.display = 'block';
  document.getElementById('dish-new-name').value = food.split('\n')[0].trim();
  document.getElementById('dish-new-name').focus();
}
