# Quickstart Validation

## Setup

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
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

三個命令都必須以 exit code 0 結束。

## Markdown-first scenario

1. 在「Markdown 行程」貼上：

   ```md
   # 東京旅行

   ## 備案
   - 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
   - 東京晴空塔 | 東京スカイツリー | 120
   - 上野公園 | 上野公園 | 60
   - 谷中銀座 | 谷中銀座 | 60

   ## Day 1 | 2026-10-03

   ## Day 2 | 2026-10-04
   ```

2. 確認四站都出現在備案，Day 1／Day 2 為空。
3. 確認每一天顯示 `00:00` 至 `23:00` 共 24 個 hourly slots，以及「未設定時間」。
4. 將兩站拖入 Day 1 的 09:00／11:00，兩站拖入 Day 2 的指定小時。
5. 確認左側 Markdown 自動將景點行移入對應 heading，並加入相應的 `@HH:00`。
6. 把 Day 1 第二站改成 `@10:00`，確認結束時間與重疊警告。
7. 確認下方 Markdown、CSV、JSON 都採用目前容器、時間及順序。
8. 開啟 Day 1 Google Maps 路線，確認沒有 `travelmode` 且站點順序正確。
9. 重新整理，確認內容與順序不變。

## Invalid draft scenario

1. 把任一停留時間改成 `0`。
2. 確認顯示原始行號及錯誤原因。
3. 確認 textarea 保留無效草稿，右側仍顯示最後一次有效行程。
4. 修正為 `60`，確認右側與三種輸出同步更新。

## Recovery scenario

1. 在 DevTools 將 `traveling-design.trip.v1` 改成無效 JSON。
2. 重新整理。
3. 應用程式應顯示 recovery 訊息與 starter Markdown。
4. localStorage 應存在 `traveling-design.trip.backup.` 開頭的備份 key。
