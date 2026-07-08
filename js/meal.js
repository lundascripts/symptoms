// ── Dish modal ──

function openDishModal() {
  renderDishList();
  document.getElementById('dish-modal').classList.add('open');
  document.getElementById('dish-new-form').style.display = 'none';
  document.getElementById('dish-new-name').value = '';
  document.getElementById('dish-new-text').value = '';
  updateDishModalHint();
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
      <button class="dish-del-btn" onclick="deleteDish(${r.id})" title="Löschen">×</button>
    </div>
  `).join('');
}

function updateDishModalHint() {
  const current = document.getElementById('meal-food').value.trim();
  const hint = document.getElementById('dish-modal-hint');
  hint.textContent = current ? 'Tippe auf ein Gericht zum Hinzufügen:' : 'Tippe auf ein Gericht zum Eintragen:';
}

function useDish(id) {
  const r = getMealTemplates().find(r => r.id === id);
  if (!r) return;
  const field = document.getElementById('meal-food');
  const entry = r.name + ': ' + r.text;
  field.value = field.value.trim() ? field.value.trim() + '\n' + entry : entry;
  updateDishModalHint();
}

function deleteDish(id) {
  if (!confirm('Rezept löschen?')) return;
  saveMealTemplates(getMealTemplates().filter(r => r.id !== id));
  renderDishList();
}

function toggleNewDishForm() {
  const form = document.getElementById('dish-new-form');
  const isOpen = form.style.display !== 'none';
  form.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    document.getElementById('dish-new-name').focus();
  }
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

// ── Save meal ──

function saveMeal() {
  const food = document.getElementById('meal-food').value.trim();
  if (!food) { toast('Bitte beschreibe die Mahlzeit.'); return; }
  const entries = getEntries();
  entries.push({ id: Date.now(), type: 'meal', datetime: document.getElementById('meal-dt').value,
    food, notes: document.getElementById('meal-notes').value.trim() || null });
  saveEntries(entries);
  document.getElementById('meal-food').value = '';
  document.getElementById('meal-notes').value = '';
  setNow('meal-dt');
  toast('Mahlzeit gespeichert ✓');
  autoSync();
}
