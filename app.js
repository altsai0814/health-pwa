/* =========================================
   Health Tracker PWA — app.js
   ========================================= */

'use strict';

// ─── Config ───────────────────────────────────────────────────────
const CONFIG = {
  CLAUDE_MODEL: 'claude-haiku-4-5-20251001',
  ANTHROPIC_VERSION: '2023-06-01',
  MAX_TOKENS: 1024,
};

const KEYS = {
  PREFIX:        'health_',
  RECORDS:       'health_records',
  PUSH_ENABLED:  'health_push_enabled',
  REMIND_TIME:   'health_remind_time',
  VAPID_KEY:     'health_vapid_key',
  CLAUDE_KEY:    'health_claude_key',
  PROXY_URL:     'health_proxy_url',
  PUSH_SUB:      'health_push_subscription',
  AI_USAGE:      'health_ai_usage',
};

const AI_DAILY_LIMIT = 3; // 每日最多呼叫次數

// ─── Storage ───────────────────────────────────────────────────────
const Storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* quota */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
  getJSON(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  setJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  getAllRecords() {
    return Storage.getJSON(KEYS.RECORDS, {});
  },
  getRecord(dateStr) {
    const all = Storage.getAllRecords();
    return all[dateStr] || null;
  },
  saveRecord(dateStr, record) {
    const all = Storage.getAllRecords();
    all[dateStr] = { ...all[dateStr], ...record };
    Storage.setJSON(KEYS.RECORDS, all);
  },
  clearAll() {
    Object.values(KEYS).forEach(k => Storage.remove(k));
    Storage.remove(KEYS.RECORDS);
  },
};

// ─── Date Utilities ────────────────────────────────────────────────
const DateUtil = {
  todayStr() {
    return new Date().toISOString().slice(0, 10);
  },
  pad(n) {
    return String(n).padStart(2, '0');
  },
  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  },
  formatDisplayDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`;
  },
  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  },
};

// ─── Escape HTML ───────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

// ─── Toast ─────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
}

// ─── Router ────────────────────────────────────────────────────────
const Router = {
  currentTab: 'today',
  tabMap: {
    today:    { pageId: 'pageTday',    title: '今日記錄' },
    history:  { pageId: 'pageHistory', title: '健康歷史' },
    settings: { pageId: 'pageSettings', title: '設定' },
  },
  navigate(tabId) {
    if (!Router.tabMap[tabId]) return;
    Router.currentTab = tabId;

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });
    const page = document.getElementById(Router.tabMap[tabId].pageId);
    if (page) { page.classList.add('active'); page.hidden = false; }

    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    // Update header
    document.getElementById('headerTitle').textContent = Router.tabMap[tabId].title;

    // Show/hide sync btn
    const syncBtn = document.getElementById('btnSync');
    syncBtn.style.display = (tabId === 'today') ? '' : 'none';

    // Page-specific renders
    if (tabId === 'today')    App.renderToday();
    if (tabId === 'history')  App.renderHistory();
    if (tabId === 'settings') App.renderSettings();
  },
};

// ─── Chart Instance ────────────────────────────────────────────────
let weightChartInstance = null;

// ─── App ───────────────────────────────────────────────────────────
const App = {

  init() {
    App.setupTabBar();
    App.setupWeightModal();
    App.setupMealModal();
    App.setupClaudeModal();
    App.setupSettings();
    registerServiceWorker();
    checkAndRemind();

    // Read tab from URL
    const urlTab = new URLSearchParams(location.search).get('tab');
    Router.navigate(urlTab && Router.tabMap[urlTab] ? urlTab : 'today');
  },

  // ── TODAY ──────────────────────────────────────────────────
  renderToday() {
    const today = DateUtil.todayStr();
    const record = Storage.getRecord(today) || {};

    // Date banner
    document.getElementById('dateBanner').textContent = DateUtil.formatDisplayDate(today);

    App.renderWeight(record);
    App.renderMeal('breakfast', record);
    App.renderMeal('lunch', record);
    App.renderMeal('dinner', record);
    App.renderTotalCal(record);
  },

  renderWeight(record) {
    const w = record?.weight;
    document.getElementById('weightValue').textContent = w != null ? w.toFixed(1) : '—';
    document.getElementById('weightHint').style.display = w != null ? 'none' : '';
    document.getElementById('weightBmi').textContent = '';
  },

  renderMeal(meal, record) {
    const mealData = record?.[meal];
    const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

    const contentEl = document.getElementById(`mealContent-${meal}`);
    const calEl = document.getElementById(`mealCal-${meal}`);

    if (mealData && mealData.content) {
      contentEl.textContent = mealData.content;
      contentEl.classList.add('has-content');
      calEl.textContent = mealData.calories ? `${mealData.calories} kcal` : '— kcal';
    } else {
      contentEl.textContent = '尚未記錄';
      contentEl.classList.remove('has-content');
      calEl.textContent = '— kcal';
    }
  },

  renderTotalCal(record) {
    const meals = ['breakfast', 'lunch', 'dinner'];
    const total = meals.reduce((sum, m) => sum + (record?.[m]?.calories || 0), 0);
    document.getElementById('totalCalToday').textContent = `${total} kcal`;
  },

  // ── HISTORY ────────────────────────────────────────────────
  renderHistory() {
    App.renderWeightChart();
    App.renderHistoryList();
  },

  renderWeightChart() {
    const days = DateUtil.getLast7Days();
    const records = Storage.getAllRecords();
    const labels = days.map(d => DateUtil.formatDate(d));
    const data = days.map(d => records[d]?.weight ?? null);

    const ctx = document.getElementById('weightChart').getContext('2d');

    if (weightChartInstance) {
      weightChartInstance.data.labels = labels;
      weightChartInstance.data.datasets[0].data = data;
      weightChartInstance.update();
      return;
    }

    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '體重 (kg)',
          data,
          borderColor: '#0891b2',
          backgroundColor: 'rgba(8,145,178,0.12)',
          borderWidth: 2.5,
          pointBackgroundColor: '#0891b2',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          spanGaps: true,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ctx.parsed.y != null ? `${ctx.parsed.y.toFixed(1)} kg` : '無資料',
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 12 } },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 12 },
              callback: v => `${v} kg`,
            },
          },
        },
      },
    });
  },

  renderHistoryList() {
    const days = DateUtil.getLast7Days().reverse();
    const records = Storage.getAllRecords();
    const container = document.getElementById('historyList');

    if (!days.some(d => records[d])) {
      container.innerHTML = '<div class="empty-state">暫無記錄資料<br>開始記錄今日體重和飲食吧！</div>';
      return;
    }

    container.innerHTML = days.map(d => {
      const r = records[d];
      if (!r) {
        return `
          <div class="history-item empty-day">
            <div class="history-date">${DateUtil.formatDate(d)}</div>
            <div class="history-no-data">未記錄</div>
          </div>`;
      }
      const meals = ['breakfast', 'lunch', 'dinner'];
      const totalCal = meals.reduce((s, m) => s + (r[m]?.calories || 0), 0);
      const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
      const mealHtml = meals.map(m => {
        if (!r[m]?.content) return '';
        return `<div class="history-meal">
          <span class="history-meal-icon">${mealIcons[m]}</span>
          <span class="history-meal-text">${escapeHtml(r[m].content)}</span>
          ${r[m].calories ? `<span class="history-meal-cal">${r[m].calories}</span>` : ''}
        </div>`;
      }).join('');

      return `
        <div class="history-item">
          <div class="history-item-header">
            <span class="history-date">${DateUtil.formatDate(d)}</span>
            ${r.weight != null ? `<span class="history-weight">${r.weight.toFixed(1)} kg</span>` : ''}
          </div>
          ${mealHtml}
          ${totalCal > 0 ? `<div class="history-total-cal">總計 ${totalCal} kcal</div>` : ''}
        </div>`;
    }).join('');
  },

  // ── SETTINGS ───────────────────────────────────────────────
  renderSettings() {
    document.getElementById('pushToggle').checked = Storage.get(KEYS.PUSH_ENABLED) === 'true';
    document.getElementById('reminderTime').value  = Storage.get(KEYS.REMIND_TIME) || '20:00';
    document.getElementById('vapidKey').value      = Storage.get(KEYS.VAPID_KEY) || '';
    // 不回填 API Key 到欄位，只顯示是否已設定的狀態
    const hasKey = !!Storage.get(KEYS.CLAUDE_KEY);
    const keyInput = document.getElementById('claudeApiKey');
    keyInput.value = '';
    keyInput.placeholder = hasKey ? '已設定（輸入新金鑰以更換）' : 'sk-ant-...';
    document.getElementById('proxyUrl').value      = Storage.get(KEYS.PROXY_URL) || '';

    // PWA standalone detection
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    const statusText = document.getElementById('pwaStatusText');
    const statusDesc = document.getElementById('pwaStatusDesc');
    if (isStandalone) {
      statusText.textContent = '✅ 已安裝為 App';
      statusDesc.textContent = '推播通知功能可正常使用';
    } else {
      statusText.textContent = '📲 尚未安裝';
      statusDesc.textContent = 'iOS：請點 Safari 分享按鈕 → 加入主畫面，以啟用推播通知';
    }
  },

  // ── TAB BAR ────────────────────────────────────────────────
  setupTabBar() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => Router.navigate(btn.dataset.tab));
    });
  },

  // ── WEIGHT MODAL ───────────────────────────────────────────
  setupWeightModal() {
    const overlay = document.getElementById('weightModalOverlay');
    const input   = document.getElementById('weightInput');

    const open = () => {
      const today = DateUtil.todayStr();
      const record = Storage.getRecord(today);
      if (record?.weight != null) input.value = record.weight.toFixed(1);
      else input.value = '';

      App.buildWeightPresets(record?.weight);
      overlay.hidden = false;
      setTimeout(() => overlay.classList.add('visible'), 10);
      setTimeout(() => input.focus(), 150);
    };

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => { overlay.hidden = true; }, 300);
    };

    document.getElementById('btnEditWeight').addEventListener('click', open);
    document.getElementById('btnCloseWeight').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('btnWeightMinus').addEventListener('click', () => {
      const v = parseFloat(input.value) || 60;
      input.value = Math.max(20, v - 0.1).toFixed(1);
    });
    document.getElementById('btnWeightPlus').addEventListener('click', () => {
      const v = parseFloat(input.value) || 60;
      input.value = Math.min(300, v + 0.1).toFixed(1);
    });

    document.getElementById('btnSaveWeight').addEventListener('click', () => {
      const v = parseFloat(input.value);
      if (isNaN(v) || v < 20 || v > 300) {
        showToast('請輸入有效體重（20–300 kg）');
        return;
      }
      Storage.saveRecord(DateUtil.todayStr(), { weight: Math.round(v * 10) / 10 });
      App.renderToday();
      close();
      showToast('體重已儲存 ✓');
    });

    // Keyboard save
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btnSaveWeight').click();
    });
  },

  buildWeightPresets(current) {
    const container = document.getElementById('weightPresets');
    const base = current || 60;
    const offsets = [-1, -0.5, +0.5, +1];
    container.innerHTML = offsets.map(o => {
      const v = Math.max(20, Math.min(300, base + o));
      const label = o > 0 ? `+${o}` : `${o}`;
      return `<button class="preset-btn" data-val="${v.toFixed(1)}">${label} kg</button>`;
    }).join('');
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('weightInput').value = btn.dataset.val;
      });
    });
  },

  // ── MEAL MODAL ─────────────────────────────────────────────
  _currentMeal: null,

  setupMealModal() {
    const overlay    = document.getElementById('mealModalOverlay');
    const titleEl    = document.getElementById('mealModalTitle');
    const textArea   = document.getElementById('mealInput');
    const calInput   = document.getElementById('calInput');
    const mealNames  = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
    const mealHints  = {
      breakfast: ['燕麥粥', '全麥吐司', '水煮蛋', '希臘優格', '水果沙拉'],
      lunch:     ['雞胸便當', '沙拉', '糙米飯', '蔬菜湯', '三明治'],
      dinner:    ['清蒸魚', '燙青菜', '豆腐', '稀飯', '雞肉沙拉'],
    };

    const open = (meal) => {
      App._currentMeal = meal;
      titleEl.textContent = `記錄${mealNames[meal]}`;

      const today = DateUtil.todayStr();
      const record = Storage.getRecord(today);
      const mealData = record?.[meal];

      textArea.value  = mealData?.content || '';
      calInput.value  = mealData?.calories || '';

      // Hints
      const hintsEl = document.getElementById('mealHints');
      hintsEl.innerHTML = (mealHints[meal] || []).map(h =>
        `<button class="hint-btn" data-hint="${escapeHtml(h)}">${escapeHtml(h)}</button>`
      ).join('');
      hintsEl.querySelectorAll('.hint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cur = textArea.value.trim();
          textArea.value = cur ? `${cur}、${btn.dataset.hint}` : btn.dataset.hint;
        });
      });

      overlay.hidden = false;
      setTimeout(() => overlay.classList.add('visible'), 10);
    };

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => { overlay.hidden = true; App._currentMeal = null; }, 300);
    };

    // Open from meal card edit buttons
    document.querySelectorAll('.edit-btn[data-meal]').forEach(btn => {
      btn.addEventListener('click', () => open(btn.dataset.meal));
    });

    document.getElementById('btnCloseMeal').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    // Quick calorie buttons
    document.querySelectorAll('.cal-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => { calInput.value = btn.dataset.cal; });
    });

    document.getElementById('btnSaveMeal').addEventListener('click', () => {
      const meal = App._currentMeal;
      if (!meal) return;
      const content  = textArea.value.trim();
      const calories = parseInt(calInput.value, 10) || 0;

      Storage.saveRecord(DateUtil.todayStr(), {
        [meal]: { content, calories },
      });
      App.renderToday();
      close();
      showToast(`${mealNames[meal]}已儲存 ✓`);
    });
  },

  // ── CLAUDE MODAL ───────────────────────────────────────────
  setupClaudeModal() {
    const overlay = document.getElementById('claudeModalOverlay');

    const close = () => {
      overlay.classList.remove('visible');
      setTimeout(() => { overlay.hidden = true; }, 300);
    };

    // 更新 🤖 按鈕顯示剩餘次數
    const updateSyncBtn = () => {
      const used = getAiUsageToday();
      const left = AI_DAILY_LIMIT - used;
      const btn  = document.getElementById('btnSync');
      btn.title = left > 0 ? `AI 健康分析（今日剩餘 ${left} 次）` : '今日已達上限';
      btn.style.opacity = left > 0 ? '1' : '0.4';
    };
    updateSyncBtn();

    document.getElementById('btnSync').addEventListener('click', async () => {
      const apiKey  = Storage.get(KEYS.CLAUDE_KEY);
      const proxyUrl = Storage.get(KEYS.PROXY_URL);

      if (!apiKey) {
        showToast('請先在設定中填入 Claude API 金鑰');
        Router.navigate('settings');
        return;
      }
      if (!proxyUrl) {
        showToast('請先在設定中填入 CORS Proxy URL');
        Router.navigate('settings');
        return;
      }

      document.getElementById('aiContent').hidden = true;
      document.getElementById('aiError').hidden   = true;
      document.getElementById('aiLoading').style.display = '';
      overlay.hidden = false;
      setTimeout(() => overlay.classList.add('visible'), 10);

      await syncWithClaude(apiKey, proxyUrl);
    });

    document.getElementById('btnCloseClaude').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  },

  // ── SETTINGS SETUP ─────────────────────────────────────────
  setupSettings() {
    // Push toggle
    document.getElementById('pushToggle').addEventListener('change', async e => {
      if (e.target.checked) {
        await enablePushNotifications();
      } else {
        Storage.set(KEYS.PUSH_ENABLED, 'false');
        showToast('推播提醒已關閉');
      }
    });

    // Reminder time
    document.getElementById('reminderTime').addEventListener('change', e => {
      Storage.set(KEYS.REMIND_TIME, e.target.value);
      scheduleLocalReminder();
      showToast(`提醒時間已設定為 ${e.target.value}`);
    });

    // Save AI settings
    document.getElementById('btnSaveAi').addEventListener('click', () => {
      const key   = document.getElementById('claudeApiKey').value.trim();
      const proxy = document.getElementById('proxyUrl').value.trim();
      const vapid = document.getElementById('vapidKey').value.trim();

      // 只有輸入了新值才更新，空白代表「保留舊的」
      if (key) Storage.set(KEYS.CLAUDE_KEY, key);

      if (proxy) Storage.set(KEYS.PROXY_URL, proxy);
      else Storage.remove(KEYS.PROXY_URL);

      if (vapid) Storage.set(KEYS.VAPID_KEY, vapid);
      else Storage.remove(KEYS.VAPID_KEY);

      // 儲存後清空欄位，避免金鑰留在 DOM 中
      document.getElementById('claudeApiKey').value = '';
      App.renderSettings();
      showToast('AI 設定已儲存 ✓');
    });

    // Export
    document.getElementById('btnExport').addEventListener('click', () => {
      const data = {
        records: Storage.getAllRecords(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `health-data-${DateUtil.todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('資料已匯出 ✓');
    });

    // Clear data
    document.getElementById('btnClearData').addEventListener('click', () => {
      if (!confirm('確定要清除所有健康記錄嗎？此動作無法還原。')) return;
      Storage.clearAll();
      showToast('所有資料已清除');
      App.renderSettings();
    });
  },
};

// ─── Push Notifications ────────────────────────────────────────────
async function enablePushNotifications() {
  if (!('Notification' in window)) {
    showToast('此瀏覽器不支援通知功能');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    showToast('通知權限被拒絕，請在設定中允許通知');
    document.getElementById('pushToggle').checked = false;
    return;
  }

  Storage.set(KEYS.PUSH_ENABLED, 'true');
  scheduleLocalReminder();
  showToast('推播提醒已開啟 ✓');
}

let reminderTimeout;
function scheduleLocalReminder() {
  clearTimeout(reminderTimeout);
  if (Storage.get(KEYS.PUSH_ENABLED) !== 'true') return;

  const [hh, mm] = (Storage.get(KEYS.REMIND_TIME) || '20:00').split(':').map(Number);
  const now  = new Date();
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next - now;
  reminderTimeout = setTimeout(checkAndRemind, delay);
}

function checkAndRemind() {
  const today  = DateUtil.todayStr();
  const record = Storage.getRecord(today);
  const hasLog = record?.weight != null
    || record?.breakfast?.content
    || record?.lunch?.content
    || record?.dinner?.content;

  if (!hasLog && Storage.get(KEYS.PUSH_ENABLED) === 'true') {
    sendLocalNotification();
  }
  scheduleLocalReminder();
}

function sendLocalNotification() {
  if (Notification.permission !== 'granted') return;
  new Notification('健康日記提醒 ⏰', {
    body: '記得記錄今天的體重和飲食喔！',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%230891b2' rx='40'/%3E%3Ctext x='96' y='130' text-anchor='middle' font-size='100' fill='white'%3E%F0%9F%8C%9F%3C/text%3E%3C/svg%3E",
    tag: 'health-reminder',
  });
}

// ─── AI 使用量追蹤 ─────────────────────────────────────────────────
function getAiUsageToday() {
  const today = DateUtil.todayStr();
  const usage = Storage.getJSON(KEYS.AI_USAGE, {});
  return usage[today] || 0;
}

function incrementAiUsage() {
  const today = DateUtil.todayStr();
  const usage = Storage.getJSON(KEYS.AI_USAGE, {});
  usage[today] = (usage[today] || 0) + 1;
  // 只保留近 7 天記錄，避免 localStorage 膨脹
  const keep = DateUtil.getLast7Days();
  Object.keys(usage).forEach(d => { if (!keep.includes(d)) delete usage[d]; });
  Storage.setJSON(KEYS.AI_USAGE, usage);
}

// ─── Claude AI Sync ────────────────────────────────────────────────
let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 60_000;

async function syncWithClaude(apiKey, proxyUrl) {
  // 每日次數限制
  const usedToday = getAiUsageToday();
  if (usedToday >= AI_DAILY_LIMIT) {
    showToast(`今日 AI 分析已達上限（${AI_DAILY_LIMIT} 次），明天再來！`);
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('claudeModalOverlay').classList.remove('visible');
    setTimeout(() => { document.getElementById('claudeModalOverlay').hidden = true; }, 300);
    return;
  }

  // 60 秒冷卻
  const now = Date.now();
  const elapsed = now - lastSyncTime;
  if (elapsed < SYNC_COOLDOWN_MS) {
    const wait = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
    showToast(`請等待 ${wait} 秒後再分析`);
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('claudeModalOverlay').classList.remove('visible');
    setTimeout(() => { document.getElementById('claudeModalOverlay').hidden = true; }, 300);
    return;
  }
  lastSyncTime = now;
  const summary = buildDailySummary();
  const loadingEl = document.getElementById('aiLoading');
  const contentEl = document.getElementById('aiContent');
  const errorEl   = document.getElementById('aiError');

  try {
    const resp = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claude-api-key': apiKey,
      },
      body: JSON.stringify({
        model: CONFIG.CLAUDE_MODEL,
        max_tokens: CONFIG.MAX_TOKENS,
        system: '你是一位專業的健康顧問，請根據使用者提供的飲食和體重記錄，給予具體、友善、實用的健康建議。回覆使用繁體中文，控制在 300 字以內。',
        messages: [{
          role: 'user',
          content: summary,
        }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const text = data?.content?.[0]?.text || '無回應內容';

    loadingEl.style.display = 'none';
    contentEl.hidden = false;
    contentEl.textContent = '';

    // 用 textContent 安全建立 DOM，避免 XSS
    const aiText = document.createElement('div');
    aiText.className = 'ai-text';
    // 換行轉為 <br>，逐段安全插入
    text.split('\n').forEach((line, i, arr) => {
      aiText.appendChild(document.createTextNode(line));
      if (i < arr.length - 1) aiText.appendChild(document.createElement('br'));
    });

    // 呼叫成功才計數
    incrementAiUsage();
    const remaining = AI_DAILY_LIMIT - getAiUsageToday();

    const aiTs = document.createElement('div');
    aiTs.className = 'ai-timestamp';
    aiTs.textContent = `分析時間：${new Date().toLocaleString('zh-TW')}　｜　今日剩餘 ${remaining} 次`;

    contentEl.appendChild(aiText);
    contentEl.appendChild(aiTs);

  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.hidden = false;
    errorEl.textContent = '';

    const errMsg = document.createElement('div');
    errMsg.className = 'ai-error-msg';
    errMsg.textContent = '⚠️ 無法連線到 Claude AI';

    const errDetail = document.createElement('div');
    errDetail.className = 'ai-error-detail';
    errDetail.textContent = err.message;

    const errTip = document.createElement('div');
    errTip.className = 'ai-error-tip';
    errTip.textContent = '請確認：1. Claude API 金鑰是否正確  2. Cloudflare Worker CORS Proxy 是否已部署  3. 網路連線是否正常';

    errorEl.appendChild(errMsg);
    errorEl.appendChild(errDetail);
    errorEl.appendChild(errTip);
  }
}

function buildDailySummary() {
  const today   = DateUtil.todayStr();
  const record  = Storage.getRecord(today) || {};
  const days    = DateUtil.getLast7Days();
  const records = Storage.getAllRecords();
  const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

  let lines = [`📅 今日日期：${DateUtil.formatDisplayDate(today)}`];

  // Today weight
  if (record.weight != null) {
    lines.push(`⚖️ 今日體重：${record.weight.toFixed(1)} kg`);
  } else {
    lines.push('⚖️ 今日體重：未記錄');
  }

  // Today meals
  ['breakfast', 'lunch', 'dinner'].forEach(m => {
    const d = record[m];
    if (d?.content) {
      lines.push(`🍽️ ${mealNames[m]}：${d.content}（${d.calories || 0} kcal）`);
    } else {
      lines.push(`🍽️ ${mealNames[m]}：未記錄`);
    }
  });

  // 7-day weight trend
  lines.push('\n📈 近 7 日體重趨勢：');
  days.forEach(d => {
    const r = records[d];
    if (r?.weight != null) {
      lines.push(`  ${DateUtil.formatDate(d)}: ${r.weight.toFixed(1)} kg`);
    }
  });

  lines.push('\n請根據以上資料給予健康建議。');
  return lines.join('\n');
}

// ─── Service Worker Registration ───────────────────────────────────
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./service-worker.js');
    console.log('[App] SW registered:', reg.scope);

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.statechange === 'installed' && navigator.serviceWorker.controller) {
          showToast('App 已更新，重新整理以套用新版本');
        }
      });
    });
  } catch (err) {
    console.warn('[App] SW registration failed:', err);
  }
}

// ─── Dark Mode chart update ─────────────────────────────────────────
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (weightChartInstance) {
    weightChartInstance.destroy();
    weightChartInstance = null;
    if (Router.currentTab === 'history') App.renderWeightChart();
  }
});

// ─── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
