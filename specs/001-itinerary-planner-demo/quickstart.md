# Quickstart Validation

## Prerequisites

- Node.js 22.23.2
- npm
- Current desktop browser

## Setup

```bash
npm ci
npm run dev
```

開啟 Vite 顯示的 localhost URL。

## Automated gates

```bash
npm test
npm run build
npm run test:e2e
```

預期三個命令皆以 exit code 0 結束。

## End-to-end scenario

1. 在 Markdown 匯入區貼上：

   ```md
   - 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
   - 東京晴空塔 | 東京スカイツリー | 120
   - 上野公園
   - 谷中銀座 | 谷中銀座 | 60
   ```

2. 匯入後確認四站都在備案區。
3. 新增 Day 2，將兩站移到 Day 1、兩站移到 Day 2。
4. 重新排列 Day 1，設定 09:00／90 分鐘與 10:00／60 分鐘，確認顯示重疊警告。
5. 改成 10:30 後確認重疊警告消失。
6. 只使用移動按鈕將一站移回備案，再移回 Day 1。
7. 重新整理，確認旅程內容與順序不變。
8. 開啟 Day 1 路線，確認 Google Maps URL 未包含 `travelmode` 且站點順序正確。

## Recovery scenario

1. 在 DevTools 將 `traveling-design.trip.v1` 改成無效 JSON。
2. 重新整理。
3. 應用程式應顯示 recovery 訊息與可操作的初始旅程。
4. localStorage 應存在 `traveling-design.trip.backup.` 開頭的備份 key。

## Performance baseline

`src/app/tripReducer.performance.test.ts` 建立 14 天與 50 個景點的固定資料集，執行新增、
跨日移動及排序操作。每個狀態更新在測試環境的 200 毫秒 budget 內完成；測試不呼叫
網路或依賴 wall-clock 日期。
