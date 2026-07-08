const TREND_COLORS = [
  '#8b5e3c', '#4a7c59', '#5b5bd6', '#c0392b', '#e67e22',
  '#8e44ad', '#2980b9', '#27ae60', '#d35400', '#16a085',
];

let trendsRangeDays = 7;
let trendsSelected = new Set();

function setTrendsRange(days) {
  trendsRangeDays = days;
  document.querySelectorAll('.trends-range-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.days) === days));
  renderTrends();
}

function renderTrends() {
  const allEntries = getEntries().filter(e => e.type === 'symptom');

  // Collect all symptom names within range
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - trendsRangeDays);
  cutoff.setHours(0, 0, 0, 0);

  const inRange = allEntries.filter(e => new Date(e.datetime) >= cutoff);

  const nameSet = new Set();
  inRange.forEach(e => {
    if (e.symptoms && e.symptoms.length) e.symptoms.forEach(s => nameSet.add(s.name));
    else if (e.description) nameSet.add(e.description);
  });
  const names = [...nameSet].sort();

  // Rebuild chips — preserve selection for names still present
  const chips = document.getElementById('trends-chips');
  trendsSelected = new Set([...trendsSelected].filter(n => nameSet.has(n)));
  // Auto-select first symptom if nothing selected and names exist
  if (trendsSelected.size === 0 && names.length > 0) trendsSelected.add(names[0]);

  chips.innerHTML = names.map((name, i) => {
    const active = trendsSelected.has(name);
    const color = TREND_COLORS[i % TREND_COLORS.length];
    return `<button class="quick-chip trends-chip${active ? ' trends-chip-active' : ''}"
      style="${active ? `background:${color}22;border-color:${color};color:${color}` : ''}"
      onclick="toggleTrendsSymptom(${JSON.stringify(name)})">
      ${esc(name)}
    </button>`;
  }).join('');

  const empty = document.getElementById('trends-empty');
  const wrap  = document.getElementById('trends-chart-wrap');

  if (names.length === 0 || trendsSelected.size === 0) {
    empty.style.display = '';
    empty.textContent = names.length === 0
      ? 'Keine Symptome in diesem Zeitraum erfasst.'
      : 'Kein Symptom ausgewählt.';
    wrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  wrap.style.display = '';

  drawTrendsChart(inRange, names);
}

function toggleTrendsSymptom(name) {
  if (trendsSelected.has(name)) {
    if (trendsSelected.size === 1) return; // always keep at least one
    trendsSelected.delete(name);
  } else {
    trendsSelected.add(name);
  }
  renderTrends();
}

function drawTrendsChart(entries, allNames) {
  const svg = document.getElementById('trends-svg');
  const legend = document.getElementById('trends-legend');

  // Build date axis: one point per day in range
  const days = [];
  for (let i = trendsRangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Aggregate: for each selected symptom, get max severity per day
  const selectedNames = [...trendsSelected];
  const series = selectedNames.map((name, si) => {
    const color = TREND_COLORS[allNames.indexOf(name) % TREND_COLORS.length];
    const points = days.map(day => {
      const dayEntries = entries.filter(e => e.datetime.split('T')[0] === day);
      let max = null;
      dayEntries.forEach(e => {
        if (e.symptoms) {
          const s = e.symptoms.find(s => s.name === name);
          if (s && (max === null || s.severity > max)) max = s.severity;
        } else if (e.description === name && (max === null || e.severity > max)) {
          max = e.severity;
        }
      });
      return max;
    });
    return { name, color, points };
  });

  // SVG dimensions
  const W = svg.parentElement.clientWidth - 32; // card padding
  const H = 200;
  const PAD = { top: 12, right: 16, bottom: 36, left: 28 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  const xStep = days.length > 1 ? cW / (days.length - 1) : cW;
  const yScale = v => cH - (v / 10) * cH;

  // Grid lines y = 0,2,4,6,8,10
  let svgContent = '';
  [0, 2, 4, 6, 8, 10].forEach(v => {
    const y = PAD.top + yScale(v);
    svgContent += `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + cW}" y2="${y}" stroke="#e0ddd8" stroke-width="1"/>`;
    svgContent += `<text x="${PAD.left - 4}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6b6860">${v}</text>`;
  });

  // X-axis labels: show every N days to avoid crowding
  const labelEvery = days.length <= 7 ? 1 : days.length <= 14 ? 2 : 5;
  days.forEach((day, i) => {
    if (i % labelEvery !== 0 && i !== days.length - 1) return;
    const x = PAD.left + i * xStep;
    const d = new Date(day + 'T12:00:00');
    const label = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' });
    svgContent += `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="10" fill="#6b6860">${label}</text>`;
    svgContent += `<line x1="${x}" y1="${PAD.top}" x2="${x}" y2="${PAD.top + cH}" stroke="#e0ddd8" stroke-width="1" stroke-dasharray="3,3"/>`;
  });

  // Series: lines + dots
  series.forEach(({ name, color, points }) => {
    // Build polyline from non-null points, segment by gaps
    let segments = [];
    let current = [];
    points.forEach((v, i) => {
      if (v !== null) {
        current.push([PAD.left + i * xStep, PAD.top + yScale(v)]);
      } else {
        if (current.length > 0) { segments.push(current); current = []; }
      }
    });
    if (current.length > 0) segments.push(current);

    segments.forEach(seg => {
      if (seg.length > 1) {
        const pts = seg.map(([x, y]) => `${x},${y}`).join(' ');
        svgContent += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      }
    });

    // Dots for all non-null points
    points.forEach((v, i) => {
      if (v === null) return;
      const x = PAD.left + i * xStep;
      const y = PAD.top + yScale(v);
      svgContent += `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
      svgContent += `<title>${esc(name)}: ${v}/10 (${days[i]})</title>`;
    });
  });

  svg.innerHTML = svgContent;

  // Legend
  legend.innerHTML = selectedNames.map((name, si) => {
    const color = TREND_COLORS[allNames.indexOf(name) % TREND_COLORS.length];
    return `<span class="trends-legend-item"><span class="trends-legend-dot" style="background:${color}"></span>${esc(name)}</span>`;
  }).join('');
}
