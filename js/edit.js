let editEntryId = null;
let editSymptomRows = [];
let editSelectedBristol = null;
let editSelectedMood = null;

// ── Edit meal state ──
let editMealRows = [];         // [{name, ingredients, label}]
let editMealIngredients = [];  // [{id|null, name, components:[]}] — current entry being built

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

  document.getElementById('edit-dt').value = entry.datetime;

  const isMeal = entry.type === 'meal';
  document.getElementById('edit-meal-section').style.display = isMeal ? '' : 'none';
  document.getElementById('edit-symptom-section').style.display = isMeal ? 'none' : '';
  document.getElementById('edit-save-as-dish-btn').style.display = isMeal ? '' : 'none';

  if (isMeal) {
    editMealRows = _parseFoodString(entry.food || '');
    editMealIngredients = [];
    document.getElementById('edit-meal-name-input').value = '';
    document.getElementById('edit-meal-ingredient-input').value = '';
    _hideEditMealAutocomplete();
    _hideEditMealIngredientAutocomplete();
    renderEditMealRows();
    renderEditMealIngredientList();
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
    if (editMealRows.length === 0) { toast('Bitte mindestens einen Eintrag übernehmen.'); return; }
    entry.food = editMealRows.map(r => r.label).join('\n');
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
  const name = editMealRows.length > 0 ? editMealRows[0].name : '';
  document.getElementById('edit-modal').classList.remove('open');
  openDishModal();
  document.getElementById('dish-new-form').style.display = 'block';
  document.getElementById('dish-new-name').value = name;
  document.getElementById('dish-new-name').focus();
}

// ── Edit meal rows ──

function renderEditMealRows() {
  const el = document.getElementById('edit-meal-rows');
  if (!el) return;
  if (editMealRows.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9em;margin:0">Noch keine Einträge.</p>'; return; }
  el.innerHTML = editMealRows.map((row, i) => `
    <div class="meal-row">
      <div class="meal-row-info"><span class="meal-row-name">${esc(row.label)}</span></div>
      <button class="meal-row-del" onclick="removeEditMealRow(${i})">×</button>
    </div>
  `).join('');
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

function commitEditMealEntry() {
  const name = document.getElementById('edit-meal-name-input').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  const label = editMealIngredients.length
    ? name + ' (' + editMealIngredients.map(ingredientLabel).join(', ') + ')'
    : name;
  editMealRows.push({ name, ingredients: editMealIngredients.slice(), label });
  addUsedTerms([name, ...editMealIngredients.map(i => i.name)]);
  editMealIngredients = [];
  document.getElementById('edit-meal-name-input').value = '';
  document.getElementById('edit-meal-ingredient-input').value = '';
  _hideEditMealAutocomplete();
  _hideEditMealIngredientAutocomplete();
  renderEditMealRows();
  renderEditMealIngredientList();
}

// ── Edit meal name autocomplete ──

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

// ── Edit meal ingredient autocomplete ──

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
  if (e.key === 'Enter') { e.preventDefault(); _addEditMealIngredientFromInput(); }
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

function selectEditMealNameTerm(name) {
  document.getElementById('edit-meal-name-input').value = name;
  _hideEditMealAutocomplete();
  document.getElementById('edit-meal-ingredient-input').focus();
}

function selectEditMealIngredientTerm(name) {
  editMealIngredients.push({ id: null, name, components: [] });
  document.getElementById('edit-meal-ingredient-input').value = '';
  _hideEditMealIngredientAutocomplete();
  renderEditMealIngredientList();
}

function _addEditMealIngredientFromInput() {
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
