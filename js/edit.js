let editEntryId = null;
let _editEntryType = null;
let editSymptomRows = [];
let editSelectedBristol = null;
let editSelectedMood = null;
let editMedicationRows = [];
let editMealRows = [];
let editMealIngredients = [];

function _parseFoodString(food) {
  if (!food) return [];
  return food.split('\n').map(line => {
    line = line.trim();
    if (!line) return null;
    const m = line.match(/^(.+?)\s*\((.+)\)$/);
    if (m) {
      const name = m[1].trim();
      const ingredients = m[2].split(',').map(s => ({ id: null, name: s.trim(), components: [] }));
      return { name, ingredients, label: line };
    }
    return { name: line, ingredients: [], label: line };
  }).filter(Boolean);
}

function openEditModal(id) {
  const entry = getEntries().find(e => e.id === id);
  if (!entry) return;
  editEntryId = id;
  _editEntryType = entry.type;

  if (entry.type === 'meal') {
    setDtDisplay('edit-meal-dt', entry.datetime);
    editMealRows = _parseFoodString(entry.food || '');
    editMealIngredients = [];
    document.getElementById('edit-meal-name-input').value = '';
    document.getElementById('edit-meal-ingredient-input').value = '';
    _hideEditMealAutocomplete();
    _hideEditMealIngredientAutocomplete();
    renderEditMealRows();
    renderEditMealIngredientList();
    renderEditMealFavoriteChips();
    document.getElementById('edit-meal-notes').value = entry.notes || '';
    document.getElementById('edit-screen-meal').classList.add('open');

  } else if (entry.type === 'medication') {
    setDtDisplay('edit-medication-dt', entry.datetime);
    editMedicationRows = (entry.medications || []).map(m => ({ name: m.name, dose: m.dose || '' }));
    renderEditMedicationRows();
    renderEditMedicationChips();
    document.getElementById('edit-medication-notes').value = entry.notes || '';
    document.getElementById('edit-medication-custom-input').value = '';
    document.getElementById('edit-screen-medication').classList.add('open');

  } else {
    setDtDisplay('edit-symptom-dt', entry.datetime);
    editSymptomRows = entry.symptoms
      ? entry.symptoms.map(s => ({ name: s.name, severity: s.severity }))
      : (entry.description ? [{ name: entry.description, severity: entry.severity || 0 }] : []);
    renderEditSymptomRows();

    editSelectedBristol = entry.bristol || null;
    document.querySelectorAll('.edit-bristol-btn').forEach(btn =>
      btn.classList.toggle('selected', parseInt(btn.dataset.n) === editSelectedBristol));
    document.getElementById('edit-bristol-hint').textContent =
      editSelectedBristol ? bristolData[editSelectedBristol - 1].desc : 'Tippe auf einen Typ für eine Beschreibung.';

    editSelectedMood = entry.mood || null;
    document.querySelectorAll('.edit-mood-btn').forEach(btn =>
      btn.classList.toggle('selected', parseInt(btn.dataset.mood) === editSelectedMood));

    document.getElementById('edit-symptom-notes').value = entry.notes || '';
    document.getElementById('edit-symptom-custom-input').value = '';
    document.getElementById('edit-screen-symptom').classList.add('open');
  }
}

function closeEditModal() {
  document.getElementById('edit-screen-meal').classList.remove('open');
  document.getElementById('edit-screen-symptom').classList.remove('open');
  document.getElementById('edit-screen-medication').classList.remove('open');
}

// ── Symptom edit ──

function renderEditSymptomRows() {
  const container = document.getElementById('edit-symptom-list');
  if (!container) return;
  container.innerHTML = editSymptomRows.map((row, i) => `
    <div class="symptom-row" data-index="${i}">
      <div class="symptom-row-name">${esc(row.name)}</div>
      <div class="symptom-row-controls">
        <button class="severity-btn" onclick="updateEditSymptomSeverity(${i}, ${Math.max(0, row.severity - 1)})" ${row.severity <= 0 ? 'disabled' : ''}>−</button>
        <div class="symptom-row-val">${row.severity} <span class="severity-label">${severityLabel(row.severity)}</span></div>
        <button class="severity-btn" onclick="updateEditSymptomSeverity(${i}, ${Math.min(10, row.severity + 1)})" ${row.severity >= 10 ? 'disabled' : ''}>+</button>
        <button class="symptom-row-del" onclick="removeEditSymptomRow(${i})">×</button>
      </div>
    </div>
  `).join('');
}

function updateEditSymptomSeverity(index, value) {
  editSymptomRows[index].severity = parseInt(value);
  renderEditSymptomRows();
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

// ── Save ──

function saveEdit() {
  const entries = getEntries();
  const idx = entries.findIndex(e => e.id === editEntryId);
  if (idx === -1) return;
  const entry = entries[idx];

  if (entry.type === 'meal') {
    if (editMealRows.length === 0) { toast('Bitte mindestens einen Eintrag übernehmen.'); return; }
    entry.datetime = document.getElementById('edit-meal-dt').value;
    entry.food = editMealRows.map(r => r.label).join('\n');
    entry.notes = document.getElementById('edit-meal-notes').value.trim() || null;
  } else if (entry.type === 'medication') {
    if (editMedicationRows.length === 0) { toast('Bitte mindestens ein Medikament angeben.'); return; }
    entry.datetime = document.getElementById('edit-medication-dt').value;
    entry.medications = editMedicationRows.map(r => ({ name: r.name, dose: r.dose.trim() || null }));
    entry.notes = document.getElementById('edit-medication-notes').value.trim() || null;
  } else {
    if (editSymptomRows.length === 0 && !editSelectedBristol && !editSelectedMood) {
      toast('Bitte mindestens ein Symptom, Stuhlgang oder Stimmung angeben.');
      return;
    }
    entry.datetime = document.getElementById('edit-symptom-dt').value;
    entry.symptoms = editSymptomRows.map(r => ({ name: r.name, severity: r.severity }));
    delete entry.description;
    delete entry.severity;
    entry.bristol = editSelectedBristol || null;
    entry.mood = editSelectedMood || null;
    entry.notes = document.getElementById('edit-symptom-notes').value.trim() || null;
    if (editSymptomRows.length) addRecentSymptoms(editSymptomRows.map(r => r.name));
  }

  saveEntries(entries);
  closeEditModal();
  renderHistory();
  toast('Eintrag aktualisiert ✓');
  autoSync();
}

// ── Medication edit ──

function renderEditMedicationChips() {
  const container = document.getElementById('edit-medication-chips');
  if (!container) return;
  const favs = getMedFavorites();
  const all = [...MED_DEFAULTS, ...favs.filter(f => !MED_DEFAULTS.some(d => d.toLowerCase() === f.toLowerCase()))];
  all.sort((a, b) => a.localeCompare(b, 'de'));
  container.innerHTML = all.map(name =>
    `<button class="quick-chip chip-medication" onclick="addEditMedicationChip('${esc(name)}')">${esc(name)}</button>`
  ).join('');
}

function addEditMedicationChip(name) {
  if (editMedicationRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase()) !== -1) {
    toast('Dieses Medikament ist bereits in der Liste.'); return;
  }
  editMedicationRows.push({ name, dose: '' });
  renderEditMedicationRows();
}

function renderEditMedicationRows() {
  const container = document.getElementById('edit-medication-list');
  if (!container) return;
  container.innerHTML = editMedicationRows.map((row, i) => `
    <div class="symptom-row" data-index="${i}">
      <div class="symptom-row-name">${esc(row.name)}</div>
      <div class="symptom-row-controls">
        <input type="text" placeholder="Dosis (optional)" value="${esc(row.dose || '')}"
          oninput="editMedicationRows[${i}].dose = this.value"
          class="medication-dose-input" />
        <button class="symptom-row-del" onclick="removeEditMedicationRow(${i})">×</button>
      </div>
    </div>
  `).join('');
}

function removeEditMedicationRow(i) {
  editMedicationRows.splice(i, 1);
  renderEditMedicationRows();
}

function addEditMedicationCustom() {
  const input = document.getElementById('edit-medication-custom-input');
  const name = input.value.trim();
  if (!name) return;
  if (editMedicationRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase()) !== -1) {
    toast('Dieses Medikament ist bereits in der Liste.'); return;
  }
  editMedicationRows.push({ name, dose: '' });
  input.value = '';
  renderEditMedicationRows();
}

// ── Meal edit rows ──

function renderEditMealRows() {
  const el = document.getElementById('edit-meal-rows');
  if (!el) return;
  if (editMealRows.length === 0) {
    el.innerHTML = '<p style="color:var(--text2);font-size:0.9em;margin:0">Noch keine Einträge.</p>';
    return;
  }
  el.innerHTML = editMealRows.map((row, i) => `
    <div class="meal-row">
      <div class="meal-row-info"><span class="meal-row-name">${esc(row.label)}</span></div>
      <button class="meal-row-edit" onclick="editEditMealRow(${i})" title="Bearbeiten">✎</button>
      <button class="meal-row-del" onclick="removeEditMealRow(${i})">×</button>
    </div>
  `).join('');
}

function editEditMealRow(i) {
  const row = editMealRows[i];
  editMealRows.splice(i, 1);
  document.getElementById('edit-meal-name-input').value = row.name;
  editMealIngredients = row.ingredients.slice();
  renderEditMealRows();
  renderEditMealIngredientList();
  document.getElementById('edit-meal-name-input').focus();
}

function removeEditMealRow(i) {
  editMealRows.splice(i, 1);
  renderEditMealRows();
}

function renderEditMealIngredientList() {
  const el = document.getElementById('edit-meal-ingredient-list');
  if (!el) return;
  if (editMealIngredients.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = editMealIngredients.map((ing, i) => `
    <div class="meal-row">
      <div class="meal-row-info"><span class="meal-row-name">${esc(ingredientLabel(ing))}</span></div>
      <button class="meal-row-del" onclick="removeEditMealIngredient(${i})">×</button>
    </div>
  `).join('');
}

function removeEditMealIngredient(i) {
  editMealIngredients.splice(i, 1);
  renderEditMealIngredientList();
}

function _clearEditMealEntry() {
  editMealIngredients = [];
  document.getElementById('edit-meal-name-input').value = '';
  document.getElementById('edit-meal-ingredient-input').value = '';
  _hideEditMealAutocomplete();
  _hideEditMealIngredientAutocomplete();
  renderEditMealIngredientList();
}

function commitEditMealEntry() {
  const name = document.getElementById('edit-meal-name-input').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  const label = editMealIngredients.length
    ? name + ' (' + editMealIngredients.map(ingredientLabel).join(', ') + ')'
    : name;
  editMealRows.push({ name, ingredients: editMealIngredients.slice(), label });
  addUsedTerms([name, ...editMealIngredients.map(i => i.name)]);
  _clearEditMealEntry();
  renderEditMealRows();
}

function renderEditMealFavoriteChips() {
  const container = document.getElementById('edit-meal-favorite-chips');
  const field = document.getElementById('edit-meal-favorites-field');
  if (!container || !field) return;
  const favs = getMealTemplates().filter(d => d.favorite);
  field.style.display = favs.length ? '' : 'none';
  container.innerHTML = favs.map(d =>
    `<button class="quick-chip chip-fav" onclick="addEditMealFavoriteChip(${d.id})">${esc(d.name)}</button>`
  ).join('');
}

function addEditMealFavoriteChip(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  document.getElementById('edit-meal-name-input').value = d.name;
  _hideEditMealAutocomplete();
  editMealIngredients = [];
  const all = getMealTemplates();
  if (d.components && d.components.length) {
    editMealIngredients = d.components.map(cid => {
      const t = all.find(t => t.id === cid);
      return t ? { id: t.id, name: t.name, components: _resolveAllIngredients(t) } : null;
    }).filter(Boolean);
  } else if (d.text) {
    editMealIngredients = d.text.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
      .map(name => ({ id: null, name, components: [] }));
  }
  renderEditMealIngredientList();
}

function saveEditMealAsDish() {
  const name = document.getElementById('edit-meal-name-input').value.trim()
    || (editMealRows.length > 0 ? editMealRows[0].name : '');
  closeEditModal();
  openDishModal();
  document.getElementById('dish-new-form').style.display = 'block';
  document.getElementById('dish-new-name').value = name;
  document.getElementById('dish-new-name').focus();
}

// ── Meal name autocomplete ──

function onEditMealNameInput() {
  const val = document.getElementById('edit-meal-name-input').value.trim();
  if (!val) { _hideEditMealAutocomplete(); return; }
  const q = val.toLowerCase();
  const dishes = getMealTemplates().filter(d => d.name.toLowerCase().includes(q));
  const dishNames = new Set(dishes.map(d => d.name.toLowerCase()));
  const terms = getUsedTerms().filter(t => t.toLowerCase().includes(q) && !dishNames.has(t.toLowerCase()));
  const list = document.getElementById('edit-meal-name-autocomplete');
  if (!dishes.length && !terms.length) { _hideEditMealAutocomplete(); return; }
  list.style.display = '';
  list.innerHTML = [
    ...dishes.map(d => {
      const sub = _resolveComponentNames(d).join(', ') || d.text || '';
      return `<button class="meal-autocomplete-item" onclick="selectEditMealName(${d.id})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
    }),
    ...terms.map(t => `<button class="meal-autocomplete-item meal-autocomplete-term" onclick="selectEditMealNameTerm('${esc(t)}')">${esc(t)}</button>`),
  ].join('');
}

function onEditMealNameKeydown(e) {
  if (e.key === 'Escape') _hideEditMealAutocomplete();
}

function _hideEditMealAutocomplete() {
  const el = document.getElementById('edit-meal-name-autocomplete');
  if (el) el.style.display = 'none';
}

function selectEditMealName(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  document.getElementById('edit-meal-name-input').value = d.name;
  _hideEditMealAutocomplete();
  editMealIngredients = [];
  const compNames = _resolveComponentNames(d);
  if (compNames.length) {
    const all = getMealTemplates();
    editMealIngredients = (d.components || []).map(cid => {
      const t = all.find(t => t.id === cid);
      return t ? { id: t.id, name: t.name, components: _resolveComponentObjects(t) } : null;
    }).filter(Boolean);
  } else if (d.text) {
    editMealIngredients = d.text.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
      .map(name => ({ id: null, name, components: [] }));
  }
  renderEditMealIngredientList();
  document.getElementById('edit-meal-ingredient-input').focus();
}

function selectEditMealNameTerm(name) {
  document.getElementById('edit-meal-name-input').value = name;
  _hideEditMealAutocomplete();
  document.getElementById('edit-meal-ingredient-input').focus();
}

// ── Meal ingredient autocomplete ──

function onEditMealIngredientInput() {
  const val = document.getElementById('edit-meal-ingredient-input').value.trim();
  if (!val) { _hideEditMealIngredientAutocomplete(); return; }
  const q = val.toLowerCase();
  const dishes = getMealTemplates().filter(d => d.name.toLowerCase().includes(q));
  const dishNames = new Set(dishes.map(d => d.name.toLowerCase()));
  const terms = getUsedTerms().filter(t => t.toLowerCase().includes(q) && !dishNames.has(t.toLowerCase()));
  const list = document.getElementById('edit-meal-ingredient-autocomplete');
  if (!dishes.length && !terms.length) { _hideEditMealIngredientAutocomplete(); return; }
  list.style.display = '';
  list.innerHTML = [
    ...dishes.map(d => {
      const sub = _resolveComponentNames(d).join(', ') || d.text || '';
      return `<button class="meal-autocomplete-item" onclick="selectEditMealIngredient(${d.id})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
    }),
    ...terms.map(t => `<button class="meal-autocomplete-item meal-autocomplete-term" onclick="selectEditMealIngredientTerm('${esc(t)}')">${esc(t)}</button>`),
  ].join('');
}

function onEditMealIngredientKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); addEditMealIngredientFromInput(); }
  if (e.key === 'Escape') _hideEditMealIngredientAutocomplete();
}

function _hideEditMealIngredientAutocomplete() {
  const el = document.getElementById('edit-meal-ingredient-autocomplete');
  if (el) el.style.display = 'none';
}

function selectEditMealIngredient(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  editMealIngredients.push({ id: d.id, name: d.name, components: _resolveAllIngredients(d) });
  document.getElementById('edit-meal-ingredient-input').value = '';
  _hideEditMealIngredientAutocomplete();
  renderEditMealIngredientList();
}

function selectEditMealIngredientTerm(name) {
  editMealIngredients.push({ id: null, name, components: [] });
  document.getElementById('edit-meal-ingredient-input').value = '';
  _hideEditMealIngredientAutocomplete();
  renderEditMealIngredientList();
}

function addEditMealIngredientFromInput() {
  const val = document.getElementById('edit-meal-ingredient-input').value.trim();
  if (!val) return;
  _hideEditMealIngredientAutocomplete();
  const matched = getMealTemplates().find(d => d.name.toLowerCase() === val.toLowerCase());
  if (matched) {
    editMealIngredients.push({ id: matched.id, name: matched.name, components: _resolveAllIngredients(matched) });
  } else {
    editMealIngredients.push({ id: null, name: val, components: [] });
  }
  document.getElementById('edit-meal-ingredient-input').value = '';
  renderEditMealIngredientList();
}
