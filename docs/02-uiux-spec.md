# 健康日記 PWA — UI/UX 設計規範

## 1. 設計原則

- **iPhone 原生感**：遵循 iOS Human Interface Guidelines，使用系統字體、底部 Sheet、圓角卡片
- **單手操作**：重要操作集中在底部，Tab Bar 固定於最下方
- **資訊層次清晰**：今日資料最突出，歷史次之，設定最低頻
- **深淺色模式**：自動跟隨系統設定（`prefers-color-scheme`）

---

## 2. 色彩系統

### 主色調（Cyan Blue）
| 用途 | Light Mode | Dark Mode |
|------|-----------|-----------|
| Primary | `#0891b2` | `#22d3ee` |
| Primary Light | `#22d3ee` | `#67e8f9` |
| Primary Dark | `#0e7490` | `#0891b2` |
| Secondary（綠） | `#10b981` | `#34d399` |
| Danger（紅） | `#ef4444` | `#ef4444` |

### 背景 / 文字
| 元素 | Light | Dark |
|------|-------|------|
| App 背景 | `#f0f9ff` | `#0a0f1e` |
| 卡片背景 | `#ffffff` | `#111827` |
| Input 背景 | `#f8fafc` | `#1e293b` |
| 文字主要 | `#0f172a` | `#f1f5f9` |
| 文字次要 | `#64748b` | `#94a3b8` |
| 文字輔助 | `#94a3b8` | `#475569` |
| 邊框 | `#e2e8f0` | `#1e293b` |

---

## 3. 字體

- **系統字體**：`-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif`
- **等寬字體**（程式碼）：`'SF Mono', 'Fira Code', monospace`

### 字體大小
| 用途 | 大小 | 粗細 |
|------|------|------|
| 頁面標題 | 1.125rem | 700 |
| 卡片標題 | 1rem | 700 |
| 體重數字 | 3.5rem | 800 |
| 正文 | 0.9375rem | 400 |
| 次要文字 | 0.875rem | 400 |
| 標籤 / 小字 | 0.75–0.8125rem | 500–600 |

---

## 4. 間距系統（8px Grid）

| 變數 | 值 |
|------|-----|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |

---

## 5. 元件設計

### 5.1 Header
- 高度 56px + Safe Area Top
- 背景：`linear-gradient(135deg, #0891b2, #0e7490)`
- 白色文字標題（左對齊）
- 右側 🤖 按鈕（圓形半透明）

### 5.2 卡片
- 圓角 `16px`
- 陰影 `0 1px 3px rgba(0,0,0,0.08)`
- 下方 `margin-bottom: 16px`
- 內距 `padding: 16px`
- 邊框 `1px solid var(--border-color)`

### 5.3 體重卡片（漸層）
- 背景：`linear-gradient(145deg, #0891b2, #0e7490)`
- 無邊框
- 體重數字：3.5rem / 800 weight / 白色
- 右上角 ✏️ 編輯按鈕（半透明白色圓形）

### 5.4 三餐卡片
- 標準白色卡片
- Header 區：圖示 + 名稱（左）、熱量 + 編輯按鈕（右）
- 分隔線後顯示食物描述文字
- 未記錄：斜體淺灰色

### 5.5 Bottom Sheet Modal
- 背景半透明 Blur（`backdrop-filter: blur(4px)`）
- Sheet 從底部滑入（translateY 動畫 400ms cubic-bezier）
- 頂部拉桿（36×4px 圓角灰條）
- 最大高度 85dvh（Claude Modal 92dvh）
- 圓角僅上方：`border-radius: 24px 24px 0 0`
- 底部 padding 含 Safe Area

### 5.6 Tab Bar
- 高度 60px + Safe Area Bottom
- 固定於視窗底部，最大寬度 430px 置中
- 3 個 Tab：📝 今日 / 📊 歷史 / ⚙️ 設定
- Active 狀態：頂部 3px 藍色指示條 + 圖示放大 1.15x
- Inactive：`text-muted` 顏色

### 5.7 Toggle Switch
- iOS 風格：51×31px
- 滑塊 27×27px，左右各有 2px padding
- Off：`border-color` 灰色背景
- On：`--color-primary` 藍色背景
- 過渡動畫 250ms

### 5.8 Toast 通知
- 固定在 Tab Bar 上方 16px
- 圓角膠囊形 pill（`border-radius: 9999px`）
- 深色背景 + 淺色文字
- 顯示 2.5 秒後自動消失
- 上下滑入動畫

---

## 6. 頁面佈局

### 6.1 今日頁（Today）
```
┌─────────────────────────┐
│ [Header] 今日記錄  [🤖] │
├─────────────────────────┤
│  2026年5月29日 星期五   │  ← 日期 Banner
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 體重          [✏️]│  │  ← 漸層藍色體重卡
│  │    68.5  kg       │  │
│  └───────────────────┘  │
│  三餐飲食               │  ← Section Title
│  ┌───────────────────┐  │
│  │🌅 早餐  350kcal[✏️]│  │
│  │ 燕麥粥加藍莓...    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │☀️ 午餐  650kcal[✏️]│  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │🌙 晚餐  — kcal [✏️]│  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 今日總熱量  1000kcal│  │  ← 綠色摘要卡
│  └───────────────────┘  │
├─────────────────────────┤
│  [📝今日] [📊歷史] [⚙️] │  ← Tab Bar
└─────────────────────────┘
```

### 6.2 歷史頁（History）
```
┌─────────────────────────┐
│ [Header] 健康歷史        │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 近7日體重趨勢      │  │
│  │  [折線圖 200px]    │  │
│  └───────────────────┘  │
│  每日記錄               │
│  ┌───────────────────┐  │
│  │5/29(五)    68.5kg │  │
│  │🌅 燕麥粥...  350  │  │
│  │☀️ 雞胸便當... 650 │  │
│  │         總計 1000 │  │
│  └───────────────────┘  │
│  ... (依日期排列)        │
└─────────────────────────┘
```

### 6.3 設定頁（Settings）
```
┌─────────────────────────┐
│ [Header] 設定            │
├─────────────────────────┤
│  推播提醒               │
│  ├ 🔔 每日提醒    [●]  │
│  ├ ⏰ 提醒時間   20:00 │
│  └ 🔑 VAPID 公鑰 [___] │
│  Claude AI 健康分析      │
│  ├ 🤖 API 金鑰   [___] │
│  └ 🌐 Proxy URL  [___] │
│       [儲存 AI 設定]    │
│  資料管理               │
│  ├ 📊 匯出資料  [匯出] │
│  └ 🗑️ 清除資料  [清除] │
│  安裝資訊               │
│  └ 📱 已安裝為 App     │
└─────────────────────────┘
```

---

## 7. 互動設計

### 觸控回饋
- 所有可點擊元素：`:active` 狀態（縮放 / 背景色變化）
- `-webkit-tap-highlight-color: transparent`（移除預設藍色高亮）
- 按鈕最小觸控面積 44×44px（Apple HIG 規範）

### 動畫時序
| 動畫類型 | 時間 | Easing |
|----------|------|--------|
| 快速回饋（hover/active）| 150ms | ease |
| 一般過渡（顏色/顯示）| 250ms | ease |
| Sheet 滑入/滑出 | 400ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Toast 顯示/隱藏 | 250ms | ease |

### Safe Area（iPhone 適配）
- Status Bar：`env(safe-area-inset-top)`
- Home Indicator：`env(safe-area-inset-bottom)`
- Tab Bar 底部自動含 Safe Area padding
- Modal 底部含 `max(safe-bottom, 16px)`

---

## 8. 無障礙設計

- 所有互動元素有 `aria-label`
- Tab Bar 使用 `role="tablist"` / `aria-selected`
- Modal 使用 `role="dialog"` / `aria-modal`
- Toast 使用 `role="status"` / `aria-live="polite"`
- 色彩對比符合 WCAG AA 標準
- 支援 `prefers-reduced-motion`（動畫可跟隨系統設定關閉）
