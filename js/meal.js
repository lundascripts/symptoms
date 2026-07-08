// ── Meal rows (selected dishes / free entries) ──

let mealRows = []; // [{id: dishId|null, name, text}]

function renderMealRows() {
  const container = document.getElementById('meal-rows');
  if (!container) return;
  if (mealRows.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = mealRows.map((row, i) => `
    <div class="meal-row">
      <div class="meal-row-info">
        <span class="meal-row-name">${esc(row.name)}</span>
        ${row.text ? `<span class="meal-row-text">${esc(row.text)}</span>` : ''}
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
  list.innerHTML = dishs.map(d =>
    `<button class="meal-autocomplete-item" onclick="selectMealAutocomplete(${d.id})">${esc(d.name)}<span class="meal-autocomplete-sub">${esc(d.text)}</span></button>`
  ).join('');
}

function onMealKeydown(e) {
  if (e.key === 'Enter') {
    const val = document.getElementById('meal-food-input').value.trim();
    if (!val) return;
    e.preventDefault();
    addMealFreeRow(val);
  }
  if (e.key === 'Escape') hideMealAutocomplete();
}

function selectMealAutocomplete(id) {
  const d = getMealTemplates().find(d => d.id === id);
  if (!d) return;
  addMealDishRow(d);
  document.getElementById('meal-food-input').value = '';
  hideMealAutocomplete();
}

function hideMealAutocomplete() {
  document.getElementById('meal-autocomplete-list').style.display = 'none';
}

function addMealDishRow(d) {
  if (mealRows.some(r => r.id === d.id)) return; // no duplicates
  mealRows.push({ id: d.id, name: d.name, text: d.text });
  renderMealRows();
}

function addMealFromInput() {
  const input = document.getElementById('meal-food-input');
  const name = input.value.trim();
  if (!name) return;
  addMealFreeRow(name);
}

function mealInputToSymptom() {
  const input = document.getElementById('meal-food-input');
  const name = input.value.trim();
  if (name) input.value = '';
  switchTab('symptom');
  if (name) {
    document.getElementById('symptom-custom-input').value = name;
  }
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

function openDishModal() {
  renderDishList();
  document.getElementById('dish-modal').classList.add('open');
  document.getElementById('dish-new-form').style.display = 'none';
  document.getElementById('dish-edit-form').style.display = 'none';
  document.getElementById('dish-new-name').value = '';
  document.getElementById('dish-new-text').value = '';
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
  list.innerHTML = dishs.map(r => `
    <div class="dish-item">
      <button class="dish-use-btn" onclick="useDish(${r.id})">
        <span class="dish-name">${esc(r.name)}</span>
        <span class="dish-preview">${esc(r.text)}</span>
      </button>
      <button class="dish-fav-btn${r.favorite ? ' active' : ''}" onclick="toggleFavorite(${r.id})" title="Favorit">${r.favorite ? '★' : '☆'}</button>
      <button class="dish-edit-btn" onclick="openEditDish(${r.id})" title="Bearbeiten">✏</button>
      <button class="dish-del-btn" onclick="deleteDish(${r.id})" title="Löschen">×</button>
    </div>
  `).join('');
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
  form.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) document.getElementById('dish-new-name').focus();
}

function saveNewDish() {
  const name = document.getElementById('dish-new-name').value.trim();
  const text = document.getElementById('dish-new-text').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  if (!text) { toast('Bitte Zutaten/Beschreibung eingeben.'); return; }
  const dishs = getMealTemplates();
  if (dishs.some(d => d.name.toLowerCase() === name.toLowerCase())) { toast(`„${name}" gibt es bereits.`); return; }
  dishs.push({ id: Date.now(), name, text });
  saveMealTemplates(dishs);
  document.getElementById('dish-new-form').style.display = 'none';
  document.getElementById('dish-new-name').value = '';
  document.getElementById('dish-new-text').value = '';
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
  document.getElementById('dish-edit-text').value = d.text;
  document.getElementById('dish-edit-form').style.display = 'block';
  document.getElementById('dish-edit-name').focus();
}

function saveEditDish() {
  const name = document.getElementById('dish-edit-name').value.trim();
  const text = document.getElementById('dish-edit-text').value.trim();
  if (!name) { toast('Bitte einen Namen eingeben.'); return; }
  if (!text) { toast('Bitte Zutaten/Beschreibung eingeben.'); return; }
  const dishs = getMealTemplates();
  const d = dishs.find(d => d.id === _editDishId);
  if (!d) return;
  d.name = name;
  d.text = text;
  saveMealTemplates(dishs);
  document.getElementById('dish-edit-form').style.display = 'none';
  renderDishList();
  renderMealFavoriteChips();
  toast(`Gericht aktualisiert ✓`);
}

function cancelEditDish() {
  document.getElementById('dish-edit-form').style.display = 'none';
  _editDishId = null;
}

// ── Save meal ──

function saveMeal() {
  if (mealRows.length === 0) { toast('Bitte mindestens ein Gericht eintragen.'); return; }
  const food = mealRows.map(r => r.text ? r.name + ': ' + r.text : r.name).join('\n');
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
