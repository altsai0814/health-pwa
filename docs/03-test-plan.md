# 健康日記 PWA — 測試計畫

## 1. 測試環境

| 環境 | 規格 |
|------|------|
| 主要裝置 | iPhone（iOS 16.4+）Safari |
| 次要裝置 | iPhone（iOS 15）Safari |
| 桌面測試 | Chrome / Edge（PWA 桌面安裝） |
| 模擬工具 | Chrome DevTools → iPhone 15 Pro 模擬 |
| 部署環境 | HTTPS（必須，Service Worker 與 Push 要求）|

---

## 2. 功能測試清單

### 2.1 PWA 基本功能

| 測試項目 | 預期結果 | 狀態 |
|----------|----------|------|
| 首次載入 | 頁面正常顯示，無 console 錯誤 | ⬜ |
| Manifest 載入 | manifest.json 被正確解析 | ⬜ |
| Service Worker 註冊 | SW 狀態為 activated | ⬜ |
| 離線存取 | 斷網後重新整理仍可正常顯示 | ⬜ |
| 加入主畫面（iOS）| 設定頁顯示「已安裝為 App」 | ⬜ |
| Standalone 模式 | 無 Safari 工具列，全螢幕顯示 | ⬜ |
| Safe Area 適配 | 劉海 / Dynamic Island 不遮擋內容 | ⬜ |
| Home Indicator | Tab Bar 底部不被 Home Indicator 遮擋 | ⬜ |

### 2.2 今日記錄頁

| 測試項目 | 預期結果 | 狀態 |
|----------|----------|------|
| 今日日期正確顯示 | 顯示當天日期與星期 | ⬜ |
| 點擊體重 ✏️ 按鈕 | 開啟體重輸入 Sheet | ⬜ |
| 輸入有效體重（60.5）| 儲存後卡片顯示 60.5 kg | ⬜ |
| 輸入無效體重（5）| 顯示錯誤 Toast | ⬜ |
| ±0.1 按鈕 | 體重值正確增減 0.1 | ⬜ |
| 快速預設按鈕 | 點擊後填入對應值 | ⬜ |
| 點擊早餐 ✏️ 按鈕 | 開啟早餐輸入 Sheet | ⬜ |
| 食物快速標籤 | 點擊後附加到文字框 | ⬜ |
| 熱量快速填入 | 點擊 300/500/700/800/1000 填入 | ⬜ |
| 儲存早餐 | 卡片顯示食物描述 + 熱量 | ⬜ |
| 記錄三餐後 | 今日總熱量正確加總 | ⬜ |
| Sheet 背景點擊 | 關閉 Sheet | ⬜ |
| Sheet ✕ 按鈕 | 關閉 Sheet | ⬜ |
| 重新整理後 | 已記錄資料仍存在 | ⬜ |

### 2.3 歷史記錄頁

| 測試項目 | 預期結果 | 狀態 |
|----------|----------|------|
| 切換到歷史頁 | 正常顯示 | ⬜ |
| 有資料時折線圖 | 顯示體重折線（spanGaps 允許空值）| ⬜ |
| 無資料時 | 顯示「暫無記錄資料」| ⬜ |
| 歷史列表排序 | 最新日期在前 | ⬜ |
| 未記錄的日期 | 顯示灰色「未記錄」| ⬜ |
| 記錄日期顯示 | 體重 badge + 三餐描述 + 總熱量 | ⬜ |
| 圖表深色模式 | 深色背景下圖表正常顯示 | ⬜ |

### 2.4 設定頁

| 測試項目 | 預期結果 | 狀態 |
|----------|----------|------|
| 切換到設定頁 | 正常顯示現有設定 | ⬜ |
| 開啟推播 Toggle | 彈出通知權限請求 | ⬜ |
| 拒絕通知權限 | Toggle 恢復關閉 + 顯示 Toast | ⬜ |
| 允許通知權限 | 顯示「推播提醒已開啟」Toast | ⬜ |
| 修改提醒時間 | 顯示「提醒時間已設定」Toast | ⬜ |
| 輸入 API Key | 儲存後重新整理值仍存在 | ⬜ |
| 輸入 Proxy URL | 儲存後重新整理值仍存在 | ⬜ |
| 點擊儲存 AI 設定 | 顯示成功 Toast | ⬜ |
| 點擊匯出 | 下載 `health-data-YYYY-MM-DD.json` | ⬜ |
| 點擊清除資料（確認）| 所有記錄被清除 | ⬜ |
| 點擊清除資料（取消）| 資料保留 | ⬜ |
| 非 standalone 模式 | 顯示「尚未安裝 + 安裝說明」| ⬜ |

### 2.5 AI 健康分析

| 測試項目 | 預期結果 | 狀態 |
|----------|----------|------|
| 無 API Key 點擊 🤖 | 導向設定頁 + Toast 提示 | ⬜ |
| 無 Proxy URL 點擊 🤖 | 導向設定頁 + Toast 提示 | ⬜ |
| 正確設定後點擊 🤖 | 開啟 AI Modal + 顯示 Loading | ⬜ |
| API 呼叫成功 | 顯示 Claude 建議文字 + 時間戳 | ⬜ |
| API 金鑰錯誤 | 顯示錯誤訊息 + 排查提示 | ⬜ |
| Proxy URL 錯誤 | 顯示錯誤訊息 | ⬜ |
| 網路中斷 | 顯示錯誤訊息 | ⬜ |
| 點擊背景 / ✕ | 關閉 AI Modal | ⬜ |

### 2.6 推播提醒

| 測試項目 | 預期結果 | 狀態 |
|----------|----------|------|
| App 開啟時有記錄 | 不發送提醒 | ⬜ |
| App 開啟時無記錄 | 發送本地通知（需通知權限）| ⬜ |
| 點擊通知 | 開啟 App 的今日頁 | ⬜ |
| 設定提醒時間後 | setTimeout 正確排程 | ⬜ |

---

## 3. 跨瀏覽器 / 裝置測試

| 環境 | Chart.js | 通知 | SW | 安裝 |
|------|----------|------|-----|------|
| iPhone Safari（iOS 16.4+）| ✅ | ✅ | ✅ | ✅ |
| iPhone Safari（iOS 15）| ✅ | ❌ | ✅ | ✅ |
| Android Chrome | ✅ | ✅ | ✅ | ✅ |
| Chrome Desktop | ✅ | ✅ | ✅ | ✅ |
| Firefox Desktop | ✅ | ✅ | ✅ | ✅ |
| Safari Desktop（macOS）| ✅ | ✅ | ✅ | ✅ |

---

## 4. 效能測試

| 指標 | 目標 | 測試工具 |
|------|------|----------|
| 首次內容繪製（FCP）| < 1.5s | Chrome DevTools Lighthouse |
| 最大內容繪製（LCP）| < 2.5s | Lighthouse |
| 互動準備時間（TTI）| < 3s | Lighthouse |
| PWA 評分 | > 90 | Lighthouse |
| 離線功能 | 可用 | Lighthouse |
| localStorage 讀寫 | < 10ms | 手動計時 |

---

## 5. 安全性測試

| 測試項目 | 說明 |
|----------|------|
| XSS 防護 | 所有使用者輸入透過 `escapeHtml()` 處理後才插入 DOM |
| API Key 儲存 | 以 `password` type input 顯示，不在 URL 或 log 中暴露 |
| HTTPS 要求 | Service Worker 僅能在 HTTPS 環境執行 |
| Proxy 驗證 | API Key 在 `x-claude-api-key` header 傳遞（非 URL 參數）|
| localStorage 隔離 | 所有 key 以 `health_` 前綴避免衝突 |

---

## 6. 已知限制與注意事項

| 限制 | 說明 | 因應方式 |
|------|------|----------|
| iOS Push 需 Standalone | iOS 16.4+ 且需加入主畫面 | 設定頁顯示安裝說明 |
| CORS Proxy 必要 | 瀏覽器直接呼叫 Claude API 被 CORS 阻擋 | 部署 Cloudflare Worker |
| localStorage 容量 | 一般 5-10MB 上限 | 每筆記錄極小，數年份資料不超過 1MB |
| 離線 AI 分析 | Claude API 需要網路連線 | 顯示明確錯誤訊息 |
| iOS 15 推播 | 不支援 Web Push | 降級為 setTimeout 本地提醒 |

---

## 7. 測試執行方式

### 本地測試（需要 HTTPS）
```bash
# 使用 npx serve 建立本地 HTTPS（Chrome 允許 localhost）
npx serve . -l 3000

# 或使用 VS Code Live Server 擴充功能
```

### iOS 模擬測試
1. Chrome DevTools → 右上角 ⋮ → More tools → Sensors
2. Geolocation：不需要
3. 開啟 Responsive Design Mode → iPhone 15 Pro

### 實機測試
1. 將檔案部署至 HTTPS 主機（GitHub Pages 推薦）
2. iPhone Safari 開啟網址
3. 加入主畫面後以 App 模式測試

### Service Worker 調試
```
Chrome DevTools → Application → Service Workers
```
