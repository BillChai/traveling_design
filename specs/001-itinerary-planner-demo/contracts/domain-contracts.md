# Domain Contracts

## Markdown import

```ts
parsePlacesMarkdown(input: string): ImportResult
```

- 接受 `- `、`* `、`+ ` 或 `1. ` 開頭，也接受沒有 list marker 的非空行。
- 移除 marker 後以 `|` 切成最多四個欄位。
- 欄位依序為 name、locationQuery、durationMinutes、notes。
- name 空白或 duration 不是 1–1,440 整數時，該行進入 errors。
- 不因單行錯誤丟出 exception；有效行仍在 places。

## Time calculation

```ts
calculateEndTime(startTime: string | null, durationMinutes: number): string | null
findScheduleWarnings(items: ScheduledItem[]): Record<string, ScheduleWarning[]>
```

- startTime 為 null 時 end time 為 null。
- 時間只在同一曆日 00:00–23:59 內計算；跨午夜結束時間以 `次日 HH:mm` 顯示。
- overlap 使用半開區間 `[start, end)`；前一站結束等於下一站開始不衝突。
- order warning 比較畫面 order 與有時間項目的遞增順序。

## Trip reducer

```ts
tripReducer(state: Trip, action: TripAction): Trip
```

支援：更新旅程、增加／刪除日期、增加／更新／刪除景點、批次增加景點、
跨容器移動、容器內排序、更新 schedule。未知 action 不存在於 union；無效 payload
由 UI 阻擋，reducer 仍必須維持 entity reference 與唯一 placement invariants。

## Persistence

```ts
loadTrip(storage: Storage): LoadTripResult
saveTrip(storage: Storage, trip: Trip): SaveTripResult
```

- primary key：`traveling-design.trip.v1`。
- load 不向外丟出 storage／parse exception。
- corrupted value 備份至 `traveling-design.trip.backup.<ISO timestamp>`。
- storage unavailable 時回傳可顯示的錯誤，不改變 memory state。

## Google Maps URL

```ts
buildGoogleMapsLinks(places: RoutePlace[]): MapLink[]
```

- 0 站回傳空陣列。
- 1 站回傳 Search URL。
- 2 站以上回傳 Directions URL，第一站為 origin、最後一站為 destination。
- 不包含 `travelmode`。
- 每段最多五站且網址長度最多 2,048。
- 多段路線共享邊界站點並保留完整順序。
