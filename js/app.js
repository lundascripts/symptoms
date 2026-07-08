if (!window._appInited) {
  window._appInited = true;

  document.addEventListener('DOMContentLoaded', () => {
    buildBristolButtons();
    buildEditBristolButtons();
    setNow('meal-dt');
    setNow('symptom-dt');
    switchTab('meal');
    renderHistory();
    renderMealFavoriteChips();
    loadTodayNote();
    updateNotifStatus();
    scheduleReminders();
    document.querySelector('[data-filter="all"]').classList.add('active');
  });
}

function switchTab(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.className = 'tab-btn');
  document.getElementById('view-' + tab).classList.add('active');
  const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active-' + tab);
  if (tab === 'meal')    { setNow('meal-dt'); renderMealFavoriteChips(); }
  if (tab === 'symptom') setNow('symptom-dt');
  if (tab === 'note')    loadTodayNote();
  if (tab === 'mehr')    { updateNotifStatus(); renderReminderList(); renderSyncSection(); }
}

function openSubview(name) {
  // Show subview (history or trends), hide mehr-settings and nav
  document.getElementById('mehr-settings').style.display = 'none';
  document.getElementById('mehr-nav').style.display = 'none';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  // Highlight Mehr tab still
  document.querySelectorAll('.tab-btn').forEach(b => b.className = 'tab-btn');
  document.querySelector('[data-tab="mehr"]').classList.add('active-mehr');
  if (name === 'history') renderHistory();
  if (name === 'trends')  renderTrends();
}

function closeSubview() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-mehr').classList.add('active');
  document.getElementById('mehr-settings').style.display = '';
  document.getElementById('mehr-nav').style.display = '';
}
