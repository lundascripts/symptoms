const bristolData = [
  { n: 1, short: 'Harte Klumpen',   desc: 'Separate harte Klumpen, schwer auszuscheiden — starke Verstopfung' },
  { n: 2, short: 'Klumpig-wurstf.', desc: 'Wurstförmig, klumpig und hart — leichte Verstopfung' },
  { n: 3, short: 'Rissig-wurstf.',  desc: 'Wurstförmig mit Rissen — normal, leicht weich' },
  { n: 4, short: 'Glatt-wurstf.',   desc: 'Glatt, weich, wurstförmig — ideal' },
  { n: 5, short: 'Weiche Klumpen',  desc: 'Weiche Klumpen mit klaren Rändern — zu weich, Tendenz zu Durchfall' },
  { n: 6, short: 'Breiig-flockig',  desc: 'Flockig, franzig, kein fester Stuhl — Durchfall' },
  { n: 7, short: 'Wässrig',         desc: 'Vollständig flüssig, keine festen Bestandteile — starker Durchfall' },
];

let selectedBristol = null;
let selectedMood = null;

// symptomRows: [{name: string, severity: number}]
let symptomRows = [];

function buildBristolButtons() {
  const top = document.getElementById('bristol-top');
  const bot = document.getElementById('bristol-bottom');
  bristolData.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'bristol-btn';
    btn.dataset.n = b.n;
    btn.innerHTML = `<span class="bnum">${b.n}</span><span class="blabel">${b.short}</span>`;
    btn.onclick = () => selectBristol(b.n);
    (b.n <= 4 ? top : bot).appendChild(btn);
  });
}

function selectBristol(n) {
  selectedBristol = selectedBristol === n ? null : n;
  document.querySelectorAll('.bristol-btn').forEach(btn =>
    btn.classList.toggle('selected', parseInt(btn.dataset.n) === selectedBristol));
  document.getElementById('bristol-hint').textContent = selectedBristol
    ? bristolData[selectedBristol - 1].desc
    : 'Tippe auf einen Typ für eine Beschreibung.';
}

function selectMood(n) {
  selectedMood = selectedMood === n ? null : n;
  document.querySelectorAll('.mood-btn').forEach(btn =>
    btn.classList.toggle('selected', parseInt(btn.dataset.mood) === selectedMood));
}

function renderSymptomRows() {
  const container = document.getElementById('symptom-list');
  if (!container) return;
  container.innerHTML = symptomRows.map((row, i) => `
    <div class="symptom-row" data-index="${i}">
      <div class="symptom-row-name">${esc(row.name)}</div>
      <div class="symptom-row-controls">
        <input type="range" min="0" max="10" value="${row.severity}"
          oninput="updateSymptomSeverity(${i}, this.value)"
          class="symptom-row-slider" />
        <div class="symptom-row-val">${row.severity} <span class="severity-label">${severityLabel(row.severity)}</span></div>
        <button class="symptom-row-del" onclick="removeSymptomRow(${i})">×</button>
      </div>
    </div>
  `).join('');
}

function addSymptomChip(name) {
  const existing = symptomRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  if (existing !== -1) {
    // Highlight the existing row briefly
    const rows = document.querySelectorAll('.symptom-row');
    if (rows[existing]) {
      rows[existing].classList.add('symptom-row-highlight');
      setTimeout(() => rows[existing].classList.remove('symptom-row-highlight'), 800);
    }
    return;
  }
  symptomRows.push({ name, severity: 5 });
  renderSymptomRows();
}

function addSymptomCustom() {
  const input = document.getElementById('symptom-custom-input');
  const name = input.value.trim();
  if (!name) return;
  const existing = symptomRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  if (existing !== -1) { toast('Dieses Symptom ist bereits in der Liste.'); return; }
  symptomRows.push({ name, severity: 5 });
  input.value = '';
  renderSymptomRows();
}

function updateSymptomSeverity(index, value) {
  symptomRows[index].severity = parseInt(value);
  // Update display value next to slider
  const row = document.querySelectorAll('.symptom-row')[index];
  if (row) row.querySelector('.symptom-row-val').innerHTML = `${value} <span class="severity-label">${severityLabel(value)}</span>`;
}

function removeSymptomRow(index) {
  symptomRows.splice(index, 1);
  renderSymptomRows();
}

function saveSymptom() {
  if (symptomRows.length === 0 && !selectedBristol && !selectedMood) {
    toast('Bitte mindestens ein Symptom, Stuhlgang oder Stimmung angeben.');
    return;
  }
  const entries = getEntries();
  entries.push({
    id: Date.now(),
    type: 'symptom',
    datetime: document.getElementById('symptom-dt').value,
    symptoms: symptomRows.map(r => ({ name: r.name, severity: r.severity })),
    bristol: selectedBristol || null,
    mood: selectedMood || null,
    notes: document.getElementById('symptom-notes').value.trim() || null,
  });
  saveEntries(entries);
  autoSync();

  symptomRows = [];
  renderSymptomRows();
  document.getElementById('symptom-custom-input').value = '';
  document.getElementById('symptom-notes').value = '';
  selectedBristol = null; selectedMood = null;
  document.querySelectorAll('.bristol-btn,.mood-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('bristol-hint').textContent = 'Tippe auf einen Typ für eine Beschreibung.';
  setNow('symptom-dt');
  toast('Symptom gespeichert ✓');
  autoSync();
}
