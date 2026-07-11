let medicationRows = [];

function renderMedicationRows() {
  const container = document.getElementById('medication-list');
  if (!container) return;
  container.innerHTML = medicationRows.map((row, i) => `
    <div class="symptom-row" data-index="${i}">
      <div class="symptom-row-name">${esc(row.name)}</div>
      <div class="symptom-row-controls">
        <input type="text" placeholder="Dosis (optional)" value="${esc(row.dose || '')}"
          oninput="updateMedicationDose(${i}, this.value)"
          class="medication-dose-input" />
        <button class="symptom-row-del" onclick="removeMedicationRow(${i})">×</button>
      </div>
    </div>
  `).join('');
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
