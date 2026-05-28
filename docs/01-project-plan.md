# 健康日記 PWA — 專案計畫

## 1. 專案目標

建置一個 iPhone 手機版 Progressive Web App，讓使用者能夠：
- 每日記錄體重（公斤，支援小數點）
- 三餐飲食日記（早餐 / 午餐 / 晚餐 + 熱量估算）
- 查看近 7 天歷史記錄與體重趨勢圖
- 未記錄時收到推播提醒
- 將資料同步給 Claude AI 取得個人化健康建議

---

## 2. 技術架構

### 前端

| 技術 | 用途 |
|------|------|
| HTML5 / CSS3 / Vanilla JS | 無框架 SPA |
| Web App Manifest | PWA 安裝支援 |
| Service Worker | 離線快取 + 推播處理 |
| Chart.js 4.x (CDN) | 體重趨勢折線圖 |
| localStorage | 本地資料儲存 |
| Web Notifications API | 本地提醒 |

### 後端 / 外部服務

| 服務 | 用途 |
|------|------|
| Anthropic Claude API | AI 健康建議分析 |
| Cloudflare Worker | CORS Proxy（繞過瀏覽器 CORS 限制） |

### 資料儲存策略
- **全部存在 localStorage**，無後端資料庫
- 資料格式：`{ "YYYY-MM-DD": { weight, breakfast, lunch, dinner } }`
- 可匯出 JSON 備份

---

## 3. 功能模組

### 3.1 今日記錄（Today）
- 顯示今日日期（星期幾）
- 體重記錄卡（漸層藍色卡片）
  - 大字顯示目前體重
  - ±0.1 kg 快速調整按鈕
  - 底部 Sheet Modal 輸入
- 三餐記錄卡（早餐 / 午餐 / 晚餐）
  - 每餐顯示食物描述 + 熱量
  - 底部 Sheet Modal 輸入 + 快速食物標籤
- 今日總熱量摘要（綠色卡片）

### 3.2 歷史記錄（History）
- 近 7 日體重折線圖（Chart.js）
  - 深藍色線條 + 填充漸層
  - spanGaps: true（允許有空值的日期）
- 每日記錄列表（最新在前）
  - 顯示體重 + 三餐摘要 + 總熱量
  - 未記錄日顯示為灰色

### 3.3 設定（Settings）
- **推播提醒**
  - 開關 Toggle
  - 提醒時間設定（time input）
  - VAPID 公鑰輸入（選填）
- **Claude AI**
  - API 金鑰（password input）
  - Cloudflare Worker Proxy URL
- **資料管理**
  - 匯出 JSON
  - 清除所有資料
- **安裝狀態**：偵測是否已加入主畫面

### 3.4 AI 健康分析
- 點擊 Header 🤖 按鈕觸發
- 發送近 7 天體重趨勢 + 今日三餐給 Claude
- Loading 動畫 → 顯示 AI 建議文字
- 錯誤狀態清晰提示

---

## 4. 推播通知策略

### iOS 限制
- iOS 16.4+ 才支援 Web Push
- **必須**以 standalone 模式（加入主畫面）才能使用
- 不支援 notification actions

### 實作方案（Hybrid）

| 情境 | 方案 |
|------|------|
| 有 VAPID 金鑰 + Standalone | Web Push API |
| 無 VAPID 金鑰 / 非 Standalone | setTimeout 本地通知 |

每日提醒流程：
1. 使用者開啟 App 時，`checkAndRemind()` 檢查今日是否有記錄
2. 若無記錄且推播已開啟，立即發送提醒
3. `scheduleLocalReminder()` 設定下次提醒時間（setTimeout）

---

## 5. 檔案結構

```
health-pwa/
├── index.html          # 主 HTML（3 Tab SPA）
├── style.css           # 所有樣式
├── app.js              # 核心邏輯
├── manifest.json       # PWA Manifest
├── service-worker.js   # SW：快取 + 推播
├── cloudflare-worker.js# Cloudflare Worker 範本
└── docs/
    ├── 01-project-plan.md
    ├── 02-uiux-spec.md
    └── 03-test-plan.md
```

---

## 6. 部署方式

### 最簡方式：GitHub Pages
1. 建立 GitHub 倉庫
2. 將所有檔案上傳
3. 啟用 GitHub Pages（Settings → Pages → main branch）
4. 在 iPhone Safari 開啟 `https://username.github.io/health-pwa`
5. 點擊「分享 → 加入主畫面」

### Cloudflare Worker（CORS Proxy）
1. 前往 workers.cloudflare.com
2. 新增 Worker，貼上 `cloudflare-worker.js` 內容
3. 部署並複製 Worker URL
4. 貼入 App 設定 → Proxy URL

---

## 7. 開發里程碑

| 里程碑 | 狀態 |
|--------|------|
| 架構設計 + 技術選型 | ✅ |
| UI/UX 設計規範 | ✅ |
| manifest.json | ✅ |
| service-worker.js | ✅ |
| cloudflare-worker.js | ✅ |
| style.css | ✅ |
| index.html | ✅ |
| app.js | ✅ |
| 測試驗證 | 待進行 |
| 部署上線 | 待進行 |
