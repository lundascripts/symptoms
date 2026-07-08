if (!window._appInited) {
  window._appInited = true;

  document.addEventListener('DOMContentLoaded', () => {
    buildBristolButtons();
    buildEditBristolButtons();
    setNow('meal-dt');
    setNow('symptom-dt');
    switchTab('note');
    renderHistory();
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
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active-' + tab);
  if (tab === 'meal')    setNow('meal-dt');
  if (tab === 'symptom') setNow('symptom-dt');
  if (tab === 'note')    loadTodayNote();
  if (tab === 'history') renderHistory();
  if (tab === 'trends')  renderTrends();
  if (tab === 'mehr')    { updateNotifStatus(); renderReminderList(); renderSyncSection(); }
}
