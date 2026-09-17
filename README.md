# Traveling Design

一個 local-first、Markdown-first 的旅遊行程編排 demo。使用者直接用 Markdown
建立備案與日期，再以拖曳調整配置及順序；Markdown、CSV、JSON 與 Google Maps
路線都由同一份有效行程即時產生。

本專案使用 [GitHub Spec Kit](https://github.com/github/spec-kit) 進行 Spec-Driven Development。需求、技術設計與工作拆分分別維護在 `spec.md`、`plan.md` 與 `tasks.md`。

## 環境需求

- Node.js 22.23.2
- npm
- GitHub Spec Kit 1.0.6
- Codex

## Spec Kit 流程

Codex integration 位於 `.agents/skills`，在 Codex 中依序使用：

```text
$speckit-constitution
$speckit-specify
$speckit-clarify
$speckit-plan
$speckit-checklist
$speckit-tasks
$speckit-analyze
$speckit-implement
$speckit-converge
```

每個步驟都必須 review 產出的 artifact；需求有變更時，從 `spec.md` 開始修正，而不是直接改程式碼。

## MVP 邊界

- 單一、多日旅程
- 單一 Markdown 編輯器建立旅程、日期、時間及景點
- 備案區與每日行程間的 pointer／keyboard 拖曳排序
- 每天以 `00:00`–`23:00` hourly timeline 顯示，拖入小時格會回寫 `@HH:00`
- 拖曳後自動回寫標準 Markdown
- 即時 Markdown、CSV、JSON 輸出
- Markdown 中的開始時間、停留時間與衝突提示
- Google Maps Search／Directions URL
- 瀏覽器 localStorage 保存
- 無後端、無登入、無 Google API key、無內嵌地圖

## 本機啟動

先確認目前 terminal 使用 Node 22。若有 nvm：

```bash
nvm use
```

若使用本計畫安裝的 Homebrew `node@22`：

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
node --version
```

接著安裝依賴並啟動：

```bash
npm ci
npm run dev
```

Vite 預設會顯示 `http://localhost:5173`。首次執行瀏覽器測試前，先安裝 Chromium：

```bash
npx playwright install chromium
```

## 驗證

```bash
npm test
npm run build
npm run test:e2e
```

GitHub Actions 會對 push 及 pull request 執行相同 gates。Node 版本同時固定於
`.nvmrc`、`.node-version` 與 `package.json#engines`。

## Markdown 格式

使用 heading 建立備案與日期，每行一個景點：

```md
# 東京旅行

## 備案

- 上野公園 | 上野公園 | 60 | 賞櫻

## Day 1 | 2026-10-03

- @09:00 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
```

景點欄位依序為 `名稱 | 地圖搜尋文字 | 停留分鐘 | 備註`，排定景點可在名稱前加
`@HH:MM`。地圖搜尋文字省略時使用名稱，停留時間省略時為 60 分鐘。文件只在
完全有效時更新畫面；無效草稿會顯示行號並保留最後一次有效行程。

## 架構與規格

- `src/domain/`：完整 Markdown parser／serializer、CSV／JSON、時間衝突、Maps URL 等純函式
- `src/app/tripReducer.ts`：維持 Place／Placement invariant 的狀態轉換
- `src/persistence/`：versioned localStorage 與損毀資料 recovery
- `src/components/`：display-only 可排序景點卡與每日欄位
- `specs/001-itinerary-planner-demo/spec.md`：產品行為與驗收條件
- `specs/001-itinerary-planner-demo/plan.md`：技術設計
- `specs/001-itinerary-planner-demo/tasks.md`：實作順序與完成紀錄
- `specs/001-itinerary-planner-demo/quickstart.md`：手動驗收流程

Google Maps 功能只產生 Search／Directions URL，不使用 Maps SDK、API key 或任何付費 API。
