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
    renderUsedTermsList();
    loadTodayNote();
    updateNotifStatus();
    scheduleReminders();
    document.querySelector('[data-filter="all"]').classList.add('active');
    initSwipe();
  });
}

const TABS = ['meal', 'symptom', 'note', 'history', 'mehr'];

function currentTabIndex() {
  return TABS.findIndex(t => document.getElementById('view-' + t)?.classList.contains('active'));
}

function initSwipe() {
  let startX = 0, startY = 0;
  const main = document.querySelector('main') || document.body;
  main.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = currentTabIndex();
    if (i === -1) return;
    if (dx < 0 && i < TABS.length - 1) switchTab(TABS[i + 1]);
    if (dx > 0 && i > 0) switchTab(TABS[i - 1]);
  }, { passive: true });
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
  if (tab === 'history') renderHistory();
  if (tab === 'mehr')    { updateNotifStatus(); renderReminderList(); renderSyncSection(); }
}

