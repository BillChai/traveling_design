# Implementation Plan: Google Maps 路線預覽

## Technical Approach

- 在 `src/domain/maps.ts` 新增 pure Embed URL builder，重用現有 route segment 的 `placeIds`，確保外部連結與 iframe 站點順序一致。
- 一站建立 `https://www.google.com/maps/embed/v1/place`；多站建立 `.../directions`，只傳 `key`、`origin`、`destination`、`waypoints`。
- `App` 讀取 `import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY` 並以 prop 傳入 `DayColumn`。
- `DayColumn` 在有 key 時渲染 lazy iframe；無 key 時渲染設定提示，原有 route links 不變。
- `.env.example` 只保存空白變數名稱；真實 key 放在已被 `.gitignore` 排除的 `.env.local`。

## Constitution Check

- 核心編排、儲存與普通 Google Maps URLs 仍是 local-first、keyless。
- Maps Embed SKU 無使用費；不加入任何可累積費用的 Maps API。
- Embed preview 是 optional enhancement，缺少 key 或網路時不阻塞產品。
- URL generation 維持 pure function，測試不發出網路 request。

## Verification

1. Unit tests：Embed URL 的 mode、順序、waypoints、分段與無 `mode`。
2. Component tests：有 key iframe、無 key fallback、原有 route link。
3. Production build：確認 Vite env typing 與 bundle。
4. Playwright：既有 Markdown、拖曳、輸出與 route link smoke 不退步。
