const MED_DEFAULTS = ['Buscopan','Iberogast','Ibuprofen','Lactase','Lefax','Paracetamol','Perenterol'];

let medicationRows = [];

function renderMedicationChips() {
  const container = document.getElementById('medication-chips');
  if (!container) return;
  const favs = getMedFavorites();
  const all = [...MED_DEFAULTS, ...favs.filter(f => !MED_DEFAULTS.some(d => d.toLowerCase() === f.toLowerCase()))];
  all.sort((a, b) => a.localeCompare(b, 'de'));
  container.innerHTML = all.map(name => {
    const isCustom = favs.some(f => f.toLowerCase() === name.toLowerCase());
    return `<span class="med-chip-wrap">
      <button class="quick-chip chip-medication" onclick="addMedicationChip('${esc(name)}')">${esc(name)}</button>${isCustom
        ? `<button class="med-chip-del" onclick="removeMedFavorite('${esc(name)}')" title="Aus Schnellauswahl entfernen">×</button>`
        : ''}
    </span>`;
  }).join('');
}

function removeMedFavorite(name) {
  saveMedFavorites(getMedFavorites().filter(f => f.toLowerCase() !== name.toLowerCase()));
  renderMedicationChips();
}

function renderMedicationRows() {
  const container = document.getElementById('medication-list');
  if (!container) return;
  const favs = getMedFavorites();
  container.innerHTML = medicationRows.map((row, i) => {
    const inQuick = MED_DEFAULTS.some(d => d.toLowerCase() === row.name.toLowerCase())
      || favs.some(f => f.toLowerCase() === row.name.toLowerCase());
    return `
    <div class="symptom-row" data-index="${i}">
      <div class="symptom-row-name">${esc(row.name)}${!inQuick
        ? ` <button class="med-add-fav" onclick="addMedFavorite('${esc(row.name)}')" title="Zur Schnellauswahl hinzufügen">＋ Schnellauswahl</button>`
        : ''}</div>
      <div class="symptom-row-controls">
        <input type="text" placeholder="Dosis (optional)" value="${esc(row.dose || '')}"
          oninput="updateMedicationDose(${i}, this.value)"
          class="medication-dose-input" />
        <button class="symptom-row-del" onclick="removeMedicationRow(${i})">×</button>
      </div>
    </div>
  `; }).join('');
}

function addMedicationChip(name) {
  const existing = medicationRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  if (existing !== -1) {
    const rows = document.querySelectorAll('#medication-list .symptom-row');
    if (rows[existing]) {
      rows[existing].classList.add('symptom-row-highlight');
      setTimeout(() => rows[existing].classList.remove('symptom-row-highlight'), 800);
    }
    return;
  }
  medicationRows.push({ name, dose: '' });
  renderMedicationRows();
}

function addMedicationCustom() {
  const input = document.getElementById('medication-custom-input');
  const name = input.value.trim();
  if (!name) return;
  const existing = medicationRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  if (existing !== -1) { toast('Dieses Medikament ist bereits in der Liste.'); return; }
  medicationRows.push({ name, dose: '' });
  input.value = '';
  renderMedicationRows();
  renderMedicationChips();
}

function addMedFavorite(name) {
  if (!name) return;
  const favs = getMedFavorites();
  if ([...MED_DEFAULTS, ...favs].some(f => f.toLowerCase() === name.toLowerCase())) {
    toast(`„${name}" ist bereits in der Schnellauswahl.`); return;
  }
  favs.push(name);
  saveMedFavorites(favs);
  renderMedicationChips();
  toast(`„${name}" zur Schnellauswahl hinzugefügt ✓`);
}

function updateMedicationDose(index, value) {
  if (medicationRows[index]) medicationRows[index].dose = value;
}

function removeMedicationRow(index) {
  medicationRows.splice(index, 1);
  renderMedicationRows();
}

function saveMedication() {
  if (medicationRows.length === 0) {
    toast('Bitte mindestens ein Medikament angeben.');
    return;
  }
  const entries = getEntries();
  entries.push({
    id: Date.now(),
    type: 'medication',
    datetime: document.getElementById('medication-dt').value,
    medications: medicationRows.map(r => ({
      name: r.name,
      dose: r.dose.trim() || null,
    })),
    notes: document.getElementById('medication-notes').value.trim() || null,
  });
  saveEntries(entries);
  autoSync();

  medicationRows = [];
  renderMedicationRows();
  document.getElementById('medication-custom-input').value = '';
  document.getElementById('medication-notes').value = '';
  setNow('medication-dt');
  toast('Medikament gespeichert ✓');
}
