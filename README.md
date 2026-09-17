# Traveling Design

一個 local-first 的旅遊行程編排 demo。使用者可以建立景點備案、安排多日行程、設定時間，並依景點順序開啟 Google Maps 路線。

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
- UI 單筆新增與 Markdown 批次匯入
- 備案區與每日行程間的拖曳排序
- 手動開始時間、停留時間與衝突提示
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

每行一個景點，允許一般文字或 Markdown list marker：

```md
- 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
- 上野公園
```

欄位依序為 `名稱 | 地圖搜尋文字 | 停留分鐘 | 備註`。地圖搜尋文字省略時使用名稱，
停留時間省略時為 60 分鐘；無效行會顯示行號，其他有效行仍會匯入。

## 架構與規格

- `src/domain/`：Markdown、日期、時間衝突、Maps URL 等純函式
- `src/app/tripReducer.ts`：維持 Place／Placement invariant 的狀態轉換
- `src/persistence/`：versioned localStorage 與損毀資料 recovery
- `src/components/`：表單、可排序景點卡與每日欄位
- `specs/001-itinerary-planner-demo/spec.md`：產品行為與驗收條件
- `specs/001-itinerary-planner-demo/plan.md`：技術設計
- `specs/001-itinerary-planner-demo/tasks.md`：實作順序與完成紀錄
- `specs/001-itinerary-planner-demo/quickstart.md`：手動驗收流程

Google Maps 功能只產生 Search／Directions URL，不使用 Maps SDK、API key 或任何付費 API。
