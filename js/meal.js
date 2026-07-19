// ── Current meal entry (name + ingredient rows) ──

let mealEntryName = '';          // string
let mealEntryIngredients = [];   // [{id|null, name, components:[{id,name}]}]

function ingredientLabel(ing) {
  if (ing.components && ing.components.length)
    return ing.name + ' (' + ing.components.map(c => c.name).join(', ') + ')';
  return ing.name;
}

function renderMealIngredientList() {
  const el = document.getElementById('meal-ingredient-list');
  if (!el) return;
  if (mealEntryIngredients.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = mealEntryIngredients.map((ing, i) => `
    <div class="meal-row">
      <div class="meal-row-info">
        <span class="meal-row-name">${esc(ingredientLabel(ing))}</span>
      </div>
      <button class="meal-row-del" onclick="removeMealIngredient(${i})">×</button>
    </div>
  `).join('');
}

function removeMealIngredient(i) {
  mealEntryIngredients.splice(i, 1);
  renderMealIngredientList();
}

function _clearMealEntry() {
  mealEntryName = '';
  mealEntryIngredients = [];
  document.getElementById('meal-food-input').value = '';
  document.getElementById('meal-ingredient-input').value = '';
  hideMealAutocomplete();
  hideMealIngredientAutocomplete();
  renderMealIngredientList();
}

// ── Name autocomplete ──

function onMealInput() {
  const val = document.getElementById('meal-food-input').value.trim();
  if (!val) { hideMealAutocomplete(); return; }
  const q = val.toLowerCase();
  const dishes = getMealTemplates().filter(d => d.name.toLowerCase().includes(q));
  const dishNames = new Set(dishes.map(d => d.name.toLowerCase()));
  const terms = getUsedTerms().filter(t => t.toLowerCase().includes(q) && !dishNames.has(t.toLowerCase()));
  const list = document.getElementById('meal-autocomplete-list');
  if (!dishes.length && !terms.length) { hideMealAutocomplete(); return; }
  list.style.display = '';
  list.innerHTML = [
    ...dishes.map(d => {
      const compNames = _resolveComponentNames(d);
      const sub = compNames.length ? compNames.join(', ') : (d.text || '');
      return `<button class="meal-autocomplete-item" onclick="selectMealNameAutocomplete(${d.id})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
    }),
    ...terms.map(t => `<button class="meal-autocomplete-item meal-autocomplete-term" onclick="selectMealNameTerm('${esc(t)}')">${esc(t)}</button>`),
  ].join('');
}

function onMealKeydown(e) {
  if (e.key === 'Escape') hideMealAutocomplete();
}

function hideMealAutocomplete() {
  const el = document.getElementById('meal-autocomplete-list');
  if (el) el.style.display = 'none';
}

function selectMealNameAutocomplete(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  document.getElementById('meal-food-input').value = d.name;
  hideMealAutocomplete();
  // prefill ingredients from components or text
  mealEntryIngredients = [];
  const compNames = _resolveComponentNames(d);
  if (compNames.length) {
    const all = getMealTemplates();
    mealEntryIngredients = (d.components || []).map(cid => {
      const t = all.find(t => t.id === cid);
      return t ? { id: t.id, name: t.name, components: _resolveComponentObjects(t) } : null;
    }).filter(Boolean);
  } else if (d.text) {
    // split free text by comma or newline as individual ingredients
    mealEntryIngredients = d.text.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
      .map(name => ({ id: null, name, components: [] }));
  }
  renderMealIngredientList();
  document.getElementById('meal-ingredient-input').focus();
}

// ── Ingredient autocomplete ──

function onMealIngredientInput() {
  const val = document.getElementById('meal-ingredient-input').value.trim();
  if (!val) { hideMealIngredientAutocomplete(); return; }
  const q = val.toLowerCase();
  const dishes = getMealTemplates().filter(d => d.name.toLowerCase().includes(q));
  const dishNames = new Set(dishes.map(d => d.name.toLowerCase()));
  const terms = getUsedTerms().filter(t => t.toLowerCase().includes(q) && !dishNames.has(t.toLowerCase()));
  const list = document.getElementById('meal-ingredient-autocomplete-list');
  if (!dishes.length && !terms.length) { hideMealIngredientAutocomplete(); return; }
  list.style.display = '';
  list.innerHTML = [
    ...dishes.map(d => {
      const compNames = _resolveComponentNames(d);
      const sub = compNames.length ? compNames.join(', ') : (d.text || '');
      return `<button class="meal-autocomplete-item" onclick="selectMealIngredientAutocomplete(${d.id})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
    }),
    ...terms.map(t => `<button class="meal-autocomplete-item meal-autocomplete-term" onclick="selectMealIngredientTerm('${esc(t)}')">${esc(t)}</button>`),
  ].join('');
}

function onMealIngredientKeydown(e) {
  if (e.key === 'Enter') { e.preventDefault(); addMealIngredientFromInput(); }
  if (e.key === 'Escape') hideMealIngredientAutocomplete();
}

function hideMealIngredientAutocomplete() {
  const el = document.getElementById('meal-ingredient-autocomplete-list');
  if (el) el.style.display = 'none';
}

function selectMealIngredientAutocomplete(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  _pushIngredient({ id: d.id, name: d.name, components: _resolveAllIngredients(d) });
  document.getElementById('meal-ingredient-input').value = '';
  hideMealIngredientAutocomplete();
}

function selectMealNameTerm(name) {
  document.getElementById('meal-food-input').value = name;
  hideMealAutocomplete();
  document.getElementById('meal-ingredient-input').focus();
}

function selectMealIngredientTerm(name) {
  _pushIngredient({ id: null, name, components: [] });
  document.getElementById('meal-ingredient-input').value = '';
  hideMealIngredientAutocomplete();
}

function addMealIngredientFromInput() {
  const val = document.getElementById('meal-ingredient-input').value.trim();
  if (!val) return;
  hideMealIngredientAutocomplete();
  const matched = getMealTemplates().find(d => d.name.toLowerCase() === val.toLowerCase());
  if (matched) {
    _pushIngredient({ id: matched.id, name: matched.name, components: _resolveAllIngredients(matched) });
  } else {
    _pushIngredient({ id: null, name: val, components: [] });
  }
  document.getElementById('meal-ingredient-input').value = '';
}

function _pushIngredient(ing) {
  mealEntryIngredients.push(ing);
  renderMealIngredientList();
}

// ── Commit / save as dish ──

function commitMealEntry() {
  const name = document.getElementById('meal-food-input').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  const label = mealEntryIngredients.length
    ? name + ' (' + mealEntryIngredients.map(ingredientLabel).join(', ') + ')'
    : name;
  mealRows.push({ name, ingredients: mealEntryIngredients.slice(), label });
  addUsedTerms([name, ...mealEntryIngredients.map(i => i.name)]);
  renderMealRows();
  _clearMealEntry();
}

function saveMealEntryAsDish() {
  const name = document.getElementById('meal-food-input').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  const dishs = getMealTemplates();
  if (dishs.some(d => d.name.toLowerCase() === name.toLowerCase())) {
    toast(`„${name}" gibt es bereits.`); return;
  }
  const compIds = mealEntryIngredients.filter(i => i.id).map(i => i.id);
  const freeText = mealEntryIngredients.filter(i => !i.id).map(i => i.name).join(', ');
  dishs.push({ id: Date.now(), name, text: freeText, components: compIds });
  saveMealTemplates(dishs);
  autoSync();
  toast(`Gericht „${name}" gespeichert ✓`);
  renderMealFavoriteChips();
}

// ── Meal rows (committed entries) ──

let mealRows = []; // [{name, ingredients, label}]

function renderMealRows() {
  const container = document.getElementById('meal-rows');
  if (!container) return;
  if (mealRows.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = mealRows.map((row, i) => `
    <div class="meal-row">
      <div class="meal-row-info">
        <span class="meal-row-name">${esc(row.label)}</span>
      </div>
      <button class="meal-row-edit" onclick="editMealRow(${i})" title="Bearbeiten">✎</button>
      <button class="meal-row-del" onclick="removeMealRow(${i})">×</button>
    </div>
  `).join('');
}

function removeMealRow(i) {
  mealRows.splice(i, 1);
  renderMealRows();
}

function editMealRow(i) {
  const row = mealRows[i];
  mealRows.splice(i, 1);
  renderMealRows();
  document.getElementById('meal-food-input').value = row.name;
  mealEntryIngredients = row.ingredients.slice();
  renderMealIngredientList();
  document.getElementById('meal-food-input').focus();
}

function clearMealRows() {
  mealRows = [];
  renderMealRows();
  _clearMealEntry();
}

// ── Helpers ──

function _resolveComponentNames(d) {
  if (!d.components || !d.components.length) return [];
  const all = getMealTemplates();
  return d.components.map(id => { const t = all.find(t => t.id === id); return t ? t.name : null; }).filter(Boolean);
}

function _resolveComponentObjects(d) {
  if (!d.components || !d.components.length) return [];
  const all = getMealTemplates();
  return d.components.map(id => { const t = all.find(t => t.id === id); return t ? { id: t.id, name: t.name } : null; }).filter(Boolean);
}

function _resolveAllIngredients(d) {
  const comps = _resolveComponentObjects(d);
  if (comps.length) return comps;
  if (d.text) return d.text.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map(name => ({ id: null, name }));
  return [];
}

// ── Favorite chips ──

function renderMealFavoriteChips() {
  const field = document.getElementById('meal-favorites-field');
  const container = document.getElementById('meal-favorite-chips');
  if (!container) return;
  const favs = getMealTemplates().filter(d => d.favorite);
  field.style.display = favs.length > 0 ? '' : 'none';
  container.innerHTML = favs.map(d =>
    `<button class="quick-chip" onclick="selectMealNameAutocomplete(${d.id})">${esc(d.name)}</button>`
  ).join('');
}

function toggleFavorite(id) {
  const dishs = getMealTemplates();
  const d = dishs.find(d => d.id === id);
  if (!d) return;
  d.favorite = !d.favorite;
  saveMealTemplates(dishs);
  renderDishList();
  renderMealFavoriteChips();
}

// ── Dish modal ──


function openDishModal() {
  const s = document.getElementById('dish-search');
  if (s) s.value = '';
  renderDishList();
  document.getElementById('dish-modal').classList.add('open');
  document.getElementById('dish-new-form').style.display = 'none';
  document.getElementById('dish-edit-form').style.display = 'none';
  _resetNewDishForm();
}

function closeDishModal(e) {
  if (!e || e.target === document.getElementById('dish-modal'))
    document.getElementById('dish-modal').classList.remove('open');
}

function filterDishList() {
  renderDishList();
}

function renderDishList() {
  const query = (document.getElementById('dish-search')?.value || '').trim().toLowerCase();
  const dishs = getMealTemplates()
    .filter(d => !query || d.name.toLowerCase().includes(query))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name, 'de');
    });
  const list = document.getElementById('dish-list');
  if (dishs.length === 0) {
    list.innerHTML = '<p class="dish-empty">Noch keine Gerichte. Lege dein erstes an!</p>';
    return;
  }
  list.innerHTML = dishs.map(r => {
    const compNames = _resolveComponentNames(r);
    const preview = compNames.length ? r.name + ' (' + compNames.join(', ') + ')' : r.text;
    return `
    <div class="dish-item">
      <button class="dish-use-btn" onclick="selectMealNameAutocomplete(${r.id}); closeDishModal()">
        <span class="dish-name">${esc(r.name)}</span>
        <span class="dish-preview">${esc(preview)}</span>
      </button>
      <div class="dish-actions">
        <button class="dish-fav-btn${r.favorite ? ' active' : ''}" onclick="toggleFavorite(${r.id})" title="Favorit">${r.favorite ? '★' : '☆'}</button>
        <button class="dish-edit-btn" onclick="openEditDish(${r.id})" title="Bearbeiten">✏</button>
        <button class="dish-del-btn" onclick="deleteDish(${r.id})" title="Löschen">×</button>
      </div>
    </div>`;
  }).join('');
}

function deleteDish(id) {
  if (!confirm('Rezept löschen?')) return;
  saveMealTemplates(getMealTemplates().filter(r => r.id !== id));
  addDeletedMealTemplateId(id);
  autoSync();
  renderDishList();
  renderMealFavoriteChips();
}

function toggleNewDishForm() {
  const form = document.getElementById('dish-new-form');
  const isOpen = form.style.display !== 'none';
  document.getElementById('dish-edit-form').style.display = 'none';
  if (isOpen) {
    form.style.display = 'none';
  } else {
    _resetNewDishForm();
    form.style.display = 'block';
    document.getElementById('dish-new-name').focus();
  }
}

// ── Dish form ingredient rows (shared for new + edit) ──

let _newDishIngredients  = [];  // [{id|null, name, components:[]}]
let _editDishIngredients = [];
let _editDishId = null;

function _dishIngredients(isEdit) { return isEdit ? _editDishIngredients : _newDishIngredients; }
function _setDishIngredients(isEdit, arr) { if (isEdit) _editDishIngredients = arr; else _newDishIngredients = arr; }

function _renderDishIngredientList(isEdit) {
  const id = isEdit ? 'dish-edit-ingredient-list' : 'dish-new-ingredient-list';
  const el = document.getElementById(id);
  if (!el) return;
  const arr = _dishIngredients(isEdit);
  if (!arr.length) { el.innerHTML = ''; return; }
  el.innerHTML = arr.map((ing, i) => `
    <div class="meal-row">
      <div class="meal-row-info">
        <span class="meal-row-name">${esc(ingredientLabel(ing))}</span>
      </div>
      <button class="meal-row-edit" onclick="_editDishIngredientRow(${i},${isEdit})" title="Bearbeiten">✏</button>
      <button class="meal-row-del" onclick="_removeDishIngredient(${i},${isEdit})">×</button>
    </div>`).join('');
}

function _removeDishIngredient(i, isEdit) {
  _dishIngredients(isEdit).splice(i, 1);
  _renderDishIngredientList(isEdit);
}

function _editDishIngredientRow(i, isEdit) {
  const arr = _dishIngredients(isEdit);
  const ing = arr[i];
  const inputId = isEdit ? 'dish-edit-ingredient-input' : 'dish-new-ingredient-input';
  document.getElementById(inputId).value = ing.name;
  arr.splice(i, 1);
  _renderDishIngredientList(isEdit);
  document.getElementById(inputId).focus();
}

function _pushDishIngredient(isEdit, ing) {
  _dishIngredients(isEdit).push(ing);
  _renderDishIngredientList(isEdit);
}

// ── Dish name autocomplete ──

function onDishNameInput(isEdit) {
  const inputId = isEdit ? 'dish-edit-name' : 'dish-new-name';
  const listId  = isEdit ? 'dish-edit-name-autocomplete' : 'dish-new-name-autocomplete';
  const val = document.getElementById(inputId).value.trim();
  const list = document.getElementById(listId);
  if (!val) { list.style.display = 'none'; return; }
  const q = val.toLowerCase();
  const dishes = getMealTemplates().filter(d => d.name.toLowerCase().includes(q) && d.id !== _editDishId);
  const dishNames = new Set(dishes.map(d => d.name.toLowerCase()));
  const terms = getUsedTerms().filter(t => t.toLowerCase().includes(q) && !dishNames.has(t.toLowerCase()));
  if (!dishes.length && !terms.length) { list.style.display = 'none'; return; }
  list.style.display = '';
  list.innerHTML = [
    ...dishes.map(d => {
      const sub = _resolveComponentNames(d).join(', ') || d.text || '';
      return `<button class="meal-autocomplete-item" onclick="selectDishName(${d.id},${isEdit})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
    }),
    ...terms.map(t => `<button class="meal-autocomplete-item meal-autocomplete-term" onclick="selectDishNameTerm('${esc(t)}',${isEdit})">${esc(t)}</button>`),
  ].join('');
}

function onDishNameKeydown(e, isEdit) {
  if (e.key === 'Escape') hideDishNameAutocomplete(isEdit);
}

function hideDishNameAutocomplete(isEdit) {
  const id = isEdit ? 'dish-edit-name-autocomplete' : 'dish-new-name-autocomplete';
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function selectDishName(id, isEdit) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  const inputId = isEdit ? 'dish-edit-name' : 'dish-new-name';
  document.getElementById(inputId).value = d.name;
  hideDishNameAutocomplete(isEdit);
}

function selectDishNameTerm(name, isEdit) {
  const inputId = isEdit ? 'dish-edit-name' : 'dish-new-name';
  document.getElementById(inputId).value = name;
  hideDishNameAutocomplete(isEdit);
}

// ── Dish ingredient autocomplete ──

function onDishIngredientInput(isEdit) {
  const inputId = isEdit ? 'dish-edit-ingredient-input' : 'dish-new-ingredient-input';
  const listId  = isEdit ? 'dish-edit-ingredient-autocomplete' : 'dish-new-ingredient-autocomplete';
  const val = document.getElementById(inputId).value.trim();
  const list = document.getElementById(listId);
  if (!val) { list.style.display = 'none'; return; }
  const q = val.toLowerCase();
  const dishes = getMealTemplates().filter(d => d.name.toLowerCase().includes(q));
  const dishNames = new Set(dishes.map(d => d.name.toLowerCase()));
  const terms = getUsedTerms().filter(t => t.toLowerCase().includes(q) && !dishNames.has(t.toLowerCase()));
  if (!dishes.length && !terms.length) { list.style.display = 'none'; return; }
  list.style.display = '';
  list.innerHTML = [
    ...dishes.map(d => {
      const sub = _resolveComponentNames(d).join(', ') || d.text || '';
      return `<button class="meal-autocomplete-item" onclick="selectDishIngredientAutocomplete(${d.id},${isEdit})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
    }),
    ...terms.map(t => `<button class="meal-autocomplete-item meal-autocomplete-term" onclick="selectDishIngredientTerm('${esc(t)}',${isEdit})">${esc(t)}</button>`),
  ].join('');
}

function onDishIngredientKeydown(e, isEdit) {
  if (e.key === 'Enter') { e.preventDefault(); addDishIngredientFromInput(isEdit); }
  if (e.key === 'Escape') hideDishIngredientAutocomplete(isEdit);
}

function hideDishIngredientAutocomplete(isEdit) {
  const id = isEdit ? 'dish-edit-ingredient-autocomplete' : 'dish-new-ingredient-autocomplete';
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function selectDishIngredientAutocomplete(id, isEdit) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  _pushDishIngredient(isEdit, { id: d.id, name: d.name, components: _resolveAllIngredients(d) });
  const inputId = isEdit ? 'dish-edit-ingredient-input' : 'dish-new-ingredient-input';
  document.getElementById(inputId).value = '';
  hideDishIngredientAutocomplete(isEdit);
}

function selectDishIngredientTerm(name, isEdit) {
  _pushDishIngredient(isEdit, { id: null, name, components: [] });
  const inputId = isEdit ? 'dish-edit-ingredient-input' : 'dish-new-ingredient-input';
  document.getElementById(inputId).value = '';
  hideDishIngredientAutocomplete(isEdit);
}

function addDishIngredientFromInput(isEdit) {
  const inputId = isEdit ? 'dish-edit-ingredient-input' : 'dish-new-ingredient-input';
  const val = document.getElementById(inputId).value.trim();
  if (!val) return;
  hideDishIngredientAutocomplete(isEdit);
  const matched = getMealTemplates().find(d => d.name.toLowerCase() === val.toLowerCase());
  if (matched) {
    _pushDishIngredient(isEdit, { id: matched.id, name: matched.name, components: _resolveAllIngredients(matched) });
  } else {
    _pushDishIngredient(isEdit, { id: null, name: val, components: [] });
  }
  document.getElementById(inputId).value = '';
}

// ── Save / reset ──

function _resetNewDishForm() {
  _newDishIngredients = [];
  document.getElementById('dish-new-name').value = '';
  document.getElementById('dish-new-ingredient-input').value = '';
  hideDishNameAutocomplete(false);
  hideDishIngredientAutocomplete(false);
  _renderDishIngredientList(false);
}

function saveNewDish() {
  const name = document.getElementById('dish-new-name').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  const dishs = getMealTemplates();
  if (dishs.some(d => d.name.toLowerCase() === name.toLowerCase())) { toast(`„${name}" gibt es bereits.`); return; }
  const components = _newDishIngredients.filter(i => i.id).map(i => i.id);
  const text = _newDishIngredients.filter(i => !i.id).map(i => i.name).join(', ');
  dishs.push({ id: Date.now(), name, text, components });
  saveMealTemplates(dishs);
  autoSync();
  document.getElementById('dish-new-form').style.display = 'none';
  _resetNewDishForm();
  renderDishList();
  toast(`Gericht „${name}" gespeichert ✓`);
}

// ── Edit dish ──

function openEditDish(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  _editDishId = id;
  document.getElementById('dish-new-form').style.display = 'none';
  document.getElementById('dish-edit-name').value = d.name;
  document.getElementById('dish-edit-ingredient-input').value = '';
  hideDishNameAutocomplete(true);
  hideDishIngredientAutocomplete(true);
  const all = getMealTemplates();
  const compRows = (d.components || []).map(cid => {
    const t = all.find(t => t.id === cid);
    return t ? { id: t.id, name: t.name, components: _resolveAllIngredients(t) } : null;
  }).filter(Boolean);
  const textRows = (d.text || '').split(',').map(s => s.trim()).filter(Boolean)
    .map(name => ({ id: null, name, components: [] }));
  _editDishIngredients = [...compRows, ...textRows];
  _renderDishIngredientList(true);
  document.getElementById('dish-edit-form').style.display = 'block';
  document.getElementById('dish-edit-name').focus();
}

function saveEditDish() {
  const name = document.getElementById('dish-edit-name').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  const dishs = getMealTemplates();
  const d = dishs.find(d => d.id === _editDishId);
  if (!d) return;
  d.name = name;
  d.components = _editDishIngredients.filter(i => i.id).map(i => i.id);
  d.text = _editDishIngredients.filter(i => !i.id).map(i => i.name).join(', ');
  saveMealTemplates(dishs);
  autoSync();
  document.getElementById('dish-edit-form').style.display = 'none';
  _editDishId = null;
  renderDishList();
  renderMealFavoriteChips();
  toast(`Gericht aktualisiert ✓`);
}

function cancelEditDish() {
  document.getElementById('dish-edit-form').style.display = 'none';
  _editDishId = null;
}

function openDishModalWithName() {
  const name = document.getElementById('meal-food-input').value.trim();
  openDishModal();
  _resetNewDishForm();
  document.getElementById('dish-new-form').style.display = 'block';
  if (name) document.getElementById('dish-new-name').value = name;
  document.getElementById('dish-new-name').focus();
}

// ── Used terms management ──

function renderUsedTermsList() {
  const el = document.getElementById('used-terms-list');
  if (!el) return;
  const terms = getUsedTerms();
  if (terms.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9em;margin:0">Noch keine Begriffe gespeichert.</p>';
    return;
  }
  el.innerHTML = terms.map((t, i) => `
    <div class="used-term-row">
      <span class="used-term-name">${esc(t)}</span>
      <button class="used-term-del" onclick="deleteUsedTerm(${i})">×</button>
    </div>
  `).join('');
}

function deleteUsedTerm(i) {
  const terms = getUsedTerms();
  terms.splice(i, 1);
  saveUsedTerms(terms);
  renderUsedTermsList();
}

function clearAllUsedTerms() {
  if (!confirm('Alle verwendeten Begriffe löschen?')) return;
  saveUsedTerms([]);
  renderUsedTermsList();
}

// ── Save meal ──

function saveMeal() {
  if (mealRows.length === 0) { toast('Bitte mindestens einen Eintrag übernehmen.'); return; }
  const food = mealRows.map(r => r.label).join('\n');
  const entries = getEntries();
  entries.push({ id: Date.now(), type: 'meal', datetime: document.getElementById('meal-dt').value,
    food, notes: document.getElementById('meal-notes').value.trim() || null });
  saveEntries(entries);
  autoSync();
  mealRows = [];
  renderMealRows();
  _clearMealEntry();
  document.getElementById('meal-notes').value = '';
  setNow('meal-dt');
  toast('Mahlzeit gespeichert ✓');
}
