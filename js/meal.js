// ── Meal rows (selected dishes / free entries) ──

let mealRows = []; // [{id: dishId|null, name, text, components: [{id,name}]}]

function rowLabel(row) {
  if (row.components && row.components.length)
    return row.name + ' (' + row.components.map(c => c.name).join(', ') + ')';
  return row.name;
}

function renderMealRows() {
  const container = document.getElementById('meal-rows');
  if (!container) return;
  if (mealRows.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = mealRows.map((row, i) => `
    <div class="meal-row">
      <div class="meal-row-info">
        <span class="meal-row-name">${esc(rowLabel(row))}</span>
        ${row.text && !(row.components && row.components.length) ? `<span class="meal-row-text">${esc(row.text)}</span>` : ''}
      </div>
      <button class="meal-row-del" onclick="removeMealRow(${i})">×</button>
    </div>
  `).join('');
}

function removeMealRow(i) {
  mealRows.splice(i, 1);
  renderMealRows();
}

function clearMealRows() {
  mealRows = [];
  renderMealRows();
  document.getElementById('meal-food-input').value = '';
  document.getElementById('meal-food-detail').value = '';
  hideMealAutocomplete();
}

// ── Autocomplete ──

function onMealInput() {
  const val = document.getElementById('meal-food-input').value.trim();
  if (!val) { hideMealAutocomplete(); return; }
  const dishs = getMealTemplates().filter(d => d.name.toLowerCase().includes(val.toLowerCase()));
  const list = document.getElementById('meal-autocomplete-list');
  if (dishs.length === 0) { hideMealAutocomplete(); return; }
  list.style.display = '';
  list.innerHTML = dishs.map(d => {
    const compNames = _getComponentNames(d);
    const sub = compNames.length ? compNames.join(', ') : d.text;
    return `<button class="meal-autocomplete-item" onclick="selectMealAutocomplete(${d.id})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(sub)}</span></button>`;
  }).join('');
}

function onMealKeydown(e) {
  if (e.key === 'Enter') {
    const val = document.getElementById('meal-food-input').value.trim();
    if (!val) return;
    e.preventDefault();
    addMealFromInput();
  }
  if (e.key === 'Escape') hideMealAutocomplete();
}

function selectMealAutocomplete(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  const compNames = _getComponentNames(d);
  document.getElementById('meal-food-input').value = d.name;
  document.getElementById('meal-food-detail').value = compNames.length ? compNames.join(', ') : (d.text || '');
  hideMealAutocomplete();
  document.getElementById('meal-food-detail').focus();
}

function _getComponentNames(d) {
  if (!d.components || d.components.length === 0) return [];
  const all = getMealTemplates();
  return d.components.map(id => { const t = all.find(t => t.id === id); return t ? t.name : null; }).filter(Boolean);
}

function hideMealAutocomplete() {
  document.getElementById('meal-autocomplete-list').style.display = 'none';
}

function addMealDishRow(d) {
  if (mealRows.some(r => r.id === d.id)) return; // no duplicates
  const components = resolveComponents(d);
  mealRows.push({ id: d.id, name: d.name, text: d.text, components });
  renderMealRows();
}

function resolveComponents(d) {
  if (!d.components || d.components.length === 0) return [];
  const all = getMealTemplates();
  return d.components.map(id => {
    const found = all.find(t => t.id === id);
    return found ? { id: found.id, name: found.name } : null;
  }).filter(Boolean);
}

function addMealFromInput() {
  const name = document.getElementById('meal-food-input').value.trim();
  const detail = document.getElementById('meal-food-detail').value.trim();
  if (!name) return;
  hideMealAutocomplete();
  // check if it matches a saved dish exactly (by name, case-insensitive)
  const matched = getMealTemplates().find(d => d.name.toLowerCase() === name.toLowerCase());
  if (matched) {
    const components = resolveComponents(matched);
    mealRows.push({ id: matched.id, name: matched.name, text: detail || matched.text, components });
  } else {
    mealRows.push({ id: null, name, text: detail, components: [] });
  }
  renderMealRows();
  document.getElementById('meal-food-input').value = '';
  document.getElementById('meal-food-detail').value = '';
}

function openDishModalWithName() {
  const name = document.getElementById('meal-food-input').value.trim();
  openDishModal();
  _resetNewDishForm();
  document.getElementById('dish-new-form').style.display = 'block';
  if (name) document.getElementById('dish-new-name').value = name;
  document.getElementById('dish-new-name').focus();
}

function addMealFreeRow(name) {
  mealRows.push({ id: null, name, text: '' });
  renderMealRows();
  document.getElementById('meal-food-input').value = '';
  hideMealAutocomplete();
}

// ── Favorite chips ──

function renderMealFavoriteChips() {
  const field = document.getElementById('meal-favorites-field');
  const container = document.getElementById('meal-favorite-chips');
  if (!container) return;
  const favs = getMealTemplates().filter(d => d.favorite);
  field.style.display = favs.length > 0 ? '' : 'none';
  container.innerHTML = favs.map(d =>
    `<button class="quick-chip" onclick="useDish(${d.id})">${esc(d.name)}</button>`
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

let _newComponents = [];    // [{id, name}] for the new-dish form
let _editComponents = [];   // [{id, name}] for the edit-dish form

function openDishModal() {
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

function renderDishList() {
  const dishs = getMealTemplates();
  const list = document.getElementById('dish-list');
  if (dishs.length === 0) {
    list.innerHTML = '<p class="dish-empty">Noch keine Gerichte. Lege dein erstes an!</p>';
    return;
  }
  list.innerHTML = dishs.map(r => {
    const compNames = (r.components || []).map(id => {
      const t = dishs.find(d => d.id === id);
      return t ? t.name : null;
    }).filter(Boolean);
    const preview = compNames.length
      ? r.name + ' (' + compNames.join(', ') + ')'
      : r.text;
    return `
    <div class="dish-item">
      <button class="dish-use-btn" onclick="useDish(${r.id})">
        <span class="dish-name">${esc(r.name)}</span>
        <span class="dish-preview">${esc(preview)}</span>
      </button>
      <button class="dish-fav-btn${r.favorite ? ' active' : ''}" onclick="toggleFavorite(${r.id})" title="Favorit">${r.favorite ? '★' : '☆'}</button>
      <button class="dish-edit-btn" onclick="openEditDish(${r.id})" title="Bearbeiten">✏</button>
      <button class="dish-del-btn" onclick="deleteDish(${r.id})" title="Löschen">×</button>
    </div>`;
  }).join('');
}

function useDish(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  addMealDishRow(d);
  document.getElementById('dish-modal').classList.remove('open');
}

function deleteDish(id) {
  if (!confirm('Rezept löschen?')) return;
  saveMealTemplates(getMealTemplates().filter(r => r.id !== id));
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

function _resetNewDishForm() {
  _newComponents = [];
  document.getElementById('dish-new-name').value = '';
  document.getElementById('dish-new-text').value = '';
  document.getElementById('dish-new-components-input').value = '';
  document.getElementById('dish-new-components-list').style.display = 'none';
  _renderComponentChips('dish-new-components-chips', _newComponents, false);
}

function saveNewDish() {
  const name = document.getElementById('dish-new-name').value.trim();
  const text = document.getElementById('dish-new-text').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  if (!text && _newComponents.length === 0) { toast('Bitte Zutaten/Beschreibung oder Bestandteile angeben.'); return; }
  const dishs = getMealTemplates();
  if (dishs.some(d => d.name.toLowerCase() === name.toLowerCase())) { toast(`„${name}" gibt es bereits.`); return; }
  dishs.push({ id: Date.now(), name, text, components: _newComponents.map(c => c.id) });
  saveMealTemplates(dishs);
  document.getElementById('dish-new-form').style.display = 'none';
  _resetNewDishForm();
  renderDishList();
  toast(`Gericht „${name}" gespeichert ✓`);
}

// ── Edit dish ──

let _editDishId = null;

function openEditDish(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  _editDishId = id;
  document.getElementById('dish-new-form').style.display = 'none';
  document.getElementById('dish-edit-name').value = d.name;
  document.getElementById('dish-edit-text').value = d.text || '';
  document.getElementById('dish-edit-components-input').value = '';
  document.getElementById('dish-edit-components-list').style.display = 'none';
  const all = getMealTemplates();
  _editComponents = (d.components || []).map(cid => {
    const t = all.find(t => t.id === cid);
    return t ? { id: t.id, name: t.name } : null;
  }).filter(Boolean);
  _renderComponentChips('dish-edit-components-chips', _editComponents, true);
  document.getElementById('dish-edit-form').style.display = 'block';
  document.getElementById('dish-edit-name').focus();
}

function saveEditDish() {
  const name = document.getElementById('dish-edit-name').value.trim();
  const text = document.getElementById('dish-edit-text').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  if (!text && _editComponents.length === 0) { toast('Bitte Zutaten/Beschreibung oder Bestandteile angeben.'); return; }
  const dishs = getMealTemplates();
  const d = dishs.find(d => d.id === _editDishId);
  if (!d) return;
  d.name = name;
  d.text = text;
  d.components = _editComponents.map(c => c.id);
  saveMealTemplates(dishs);
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

// ── Component chips (shared) ──

function _renderComponentChips(containerId, arr, isEdit) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = arr.map((c, i) =>
    `<span class="dish-component-chip">${esc(c.name)}<button onclick="_removeComponent(${i},${isEdit})" title="Entfernen">×</button></span>`
  ).join('');
}

function _removeComponent(i, isEdit) {
  if (isEdit) { _editComponents.splice(i, 1); _renderComponentChips('dish-edit-components-chips', _editComponents, true); }
  else        { _newComponents.splice(i, 1);  _renderComponentChips('dish-new-components-chips', _newComponents, false); }
}

function onDishComponentInput(isEdit) {
  const inputId = isEdit ? 'dish-edit-components-input' : 'dish-new-components-input';
  const listId  = isEdit ? 'dish-edit-components-list'  : 'dish-new-components-list';
  const current = isEdit ? _editComponents : _newComponents;
  const val = document.getElementById(inputId).value.trim().toLowerCase();
  const list = document.getElementById(listId);
  if (!val) { list.style.display = 'none'; return; }
  const currentIds = new Set(current.map(c => c.id));
  // exclude self when editing
  if (isEdit && _editDishId) currentIds.add(_editDishId);
  const matches = getMealTemplates().filter(d =>
    d.name.toLowerCase().includes(val) && !currentIds.has(d.id)
  );
  if (!matches.length) { list.style.display = 'none'; return; }
  list.style.display = '';
  list.innerHTML = matches.map(d =>
    `<button class="meal-autocomplete-item" onclick="_addComponent(${d.id},${isEdit})">${esc(d.name)}</button>`
  ).join('');
}

function _addComponent(id, isEdit) {
  const d = getMealTemplates().find(t => t.id === id);
  if (!d) return;
  if (isEdit) {
    if (!_editComponents.some(c => c.id === id)) _editComponents.push({ id: d.id, name: d.name });
    _renderComponentChips('dish-edit-components-chips', _editComponents, true);
    document.getElementById('dish-edit-components-input').value = '';
    document.getElementById('dish-edit-components-list').style.display = 'none';
  } else {
    if (!_newComponents.some(c => c.id === id)) _newComponents.push({ id: d.id, name: d.name });
    _renderComponentChips('dish-new-components-chips', _newComponents, false);
    document.getElementById('dish-new-components-input').value = '';
    document.getElementById('dish-new-components-list').style.display = 'none';
  }
}

// ── Save meal ──

function saveMeal() {
  if (mealRows.length === 0) { toast('Bitte mindestens ein Gericht eintragen.'); return; }
  const food = mealRows.map(r => rowLabel(r)).join('\n');
  const entries = getEntries();
  entries.push({ id: Date.now(), type: 'meal', datetime: document.getElementById('meal-dt').value,
    food, notes: document.getElementById('meal-notes').value.trim() || null });
  saveEntries(entries);
  autoSync();
  mealRows = [];
  renderMealRows();
  document.getElementById('meal-food-input').value = '';
  document.getElementById('meal-notes').value = '';
  setNow('meal-dt');
  toast('Mahlzeit gespeichert ✓');
  autoSync();
}
