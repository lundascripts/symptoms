const SYMPTOM_QUICK_DEFAULTS = [
  'Appetitlosigkeit','Aufgeblähter Bauch','Aufstoßen','Bauchschmerzen','Blähungen',
  'Kopfschmerzen','Krämpfe','Magenschmerzen','Schwindel','Sodbrennen','Übelkeit',
  'Verstopfung','Völlegefühl',
];

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
    btn.innerHTML = `<span class="bnum">${b.n}</span>`;
    btn.onclick = () => selectBristol(b.n);
    top.appendChild(btn);
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
        <button class="severity-btn" onclick="updateSymptomSeverity(${i}, ${Math.max(0, row.severity - 1)})" ${row.severity <= 0 ? 'disabled' : ''}>−</button>
        <div class="symptom-row-val">${row.severity} <span class="severity-label">${severityLabel(row.severity)}</span></div>
        <button class="severity-btn" onclick="updateSymptomSeverity(${i}, ${Math.min(10, row.severity + 1)})" ${row.severity >= 10 ? 'disabled' : ''}>+</button>
        <button class="symptom-row-del" onclick="removeSymptomRow(${i})">×</button>
      </div>
    </div>
  `).join('');
}

function _doAddSymptomChip(name) {
  const existing = symptomRows.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  if (existing !== -1) {
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

function addSymptomChip(name) {
  const input = document.getElementById('symptom-custom-input');
  const typed = input ? input.value.trim() : '';
  if (typed) {
    showConfirm(
      `Im Eingabefeld steht noch „${typed}". Was soll damit passieren?`,
      'Übernehmen', 'Verwerfen',
      () => {
        const ex = symptomRows.findIndex(r => r.name.toLowerCase() === typed.toLowerCase());
        if (ex === -1) symptomRows.push({ name: typed, severity: 5 });
        if (input) input.value = '';
        _doAddSymptomChip(name);
      },
      () => {
        if (input) input.value = '';
        _doAddSymptomChip(name);
      }
    );
    return;
  }
  _doAddSymptomChip(name);
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
  renderSymptomRows();
}

function removeSymptomRow(index) {
  symptomRows.splice(index, 1);
  renderSymptomRows();
}

function symptomInputToMeal() {
  const input = document.getElementById('symptom-custom-input');
  const name = input.value.trim();
  if (name) input.value = '';
  switchTab('meal');
  if (name) addMealFreeRow(name);
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
  if (symptomRows.length) addRecentSymptoms(symptomRows.map(r => r.name));
  renderRecentSymptomChips();

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

function renderRecentSymptomChips() {
  const recent = getRecentSymptoms();
  ['recent-symptom-chips', 'edit-recent-symptom-chips'].forEach(id => {
    const el = document.getElementById(id);
    const field = document.getElementById(id + '-field');
    if (!el) return;
    if (!recent.length) { if (field) field.style.display = 'none'; return; }
    if (field) field.style.display = '';
    const isEdit = id.startsWith('edit-');
    el.innerHTML = recent.map(name =>
      `<button class="quick-chip chip-symptom" onclick="${isEdit ? 'addEditSymptomChip' : 'addSymptomChip'}('${esc(name)}')">${esc(name)}</button>`
    ).join('');
  });
}

function renderRecentSymptomsManageList() {
  const el = document.getElementById('recent-symptoms-manage-list');
  if (!el) return;
  const recent = getRecentSymptoms();
  if (!recent.length) {
    el.innerHTML = '<p style="font-size:14px;color:var(--text2)">Noch keine Symptome gespeichert.</p>';
    return;
  }
  el.innerHTML = recent.map((name, i) => `
    <div class="symptom-row" style="margin-bottom:6px">
      <div class="symptom-row-name">${esc(name)}</div>
      <div class="symptom-row-controls">
        <button class="symptom-row-del" onclick="removeRecentSymptom(${i})">×</button>
      </div>
    </div>
  `).join('');
}

function removeRecentSymptom(i) {
  const recent = getRecentSymptoms();
  recent.splice(i, 1);
  saveRecentSymptoms(recent);
  renderRecentSymptomsManageList();
  renderRecentSymptomChips();
}

function addManualRecentSymptom() {
  const input = document.getElementById('recent-symptom-add-input');
  const name = input.value.trim();
  if (!name) return;
  addRecentSymptoms([name]);
  input.value = '';
  renderRecentSymptomsManageList();
  renderRecentSymptomChips();
}
