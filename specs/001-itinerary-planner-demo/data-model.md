# Data Model: 多日旅遊行程編排 Demo

## Trip

整個應用程式唯一的 aggregate root。

| Field | Type | Rules |
|-------|------|-------|
| schemaVersion | `1` | 必須等於目前支援版本 |
| id | string | 非空 UUID |
| title | string | trim 後 1–80 字元 |
| startDate | `YYYY-MM-DD \| null` | 有值時必須是有效日期 |
| places | `Place[]` | place id 唯一 |
| placements | `Placement[]` | 每個 place 恰好一筆 |
| days | `DayPlan[]` | 至少一筆，day id 唯一 |

## Place

| Field | Type | Rules |
|-------|------|-------|
| id | string | 非空 UUID |
| name | string | trim 後 1–80 字元 |
| locationQuery | string | trim 後 1–80 字元；未輸入時等於 name |
| notes | string | 最多 1,000 字元 |
| defaultDurationMinutes | integer | 1–1,440，預設 60 |

同名及相同 location query 允許存在，identity 只由 id 決定。

## DayPlan

| Field | Type | Rules |
|-------|------|-------|
| id | string | 非空 UUID |
| date | `YYYY-MM-DD \| null` | startDate 有值時按日連續；否則可空白 |
| label | string | `Day N` 的本地化顯示文字 |

## Placement

| Field | Type | Rules |
|-------|------|-------|
| id | string | 非空 UUID |
| placeId | string | 必須指向存在的 Place，且一對一 |
| dayId | `string \| null` | null 表示備案區，否則指向存在的 DayPlan |
| order | integer | 同一容器內由 0 開始、連續且唯一 |
| startTime | `HH:mm \| null` | 備案區時必須為 null |
| durationMinutes | integer | 1–1,440 |

### State transitions

- 新增 Place：同時建立 `dayId: null` 的 Placement，放在備案最後。
- 移入日期：設定 dayId、加入目標 index；保留 duration，startTime 預設 null。
- 移回備案：dayId 與 startTime 設為 null，加入備案最後。
- 日期間移動：更新 dayId 與 order，保留 startTime 及 duration。
- 刪除日期：相關 Placement 依原 order 移回備案並清除 startTime。
- 刪除 Place：同時刪除對應 Placement。
- 每個 transition 後正規化受影響容器的 order。

## ImportResult

| Field | Type | Rules |
|-------|------|-------|
| places | `NewPlaceInput[]` | 依有效輸入行順序排列 |
| errors | `ImportError[]` | 依 lineNumber 排列 |

`ImportError` 包含 1-based `lineNumber`、原始 `line` 與繁體中文 `message`。

## StoredTripDocument

localStorage 內的 JSON 就是完整 Trip。讀取流程：

1. key 不存在：回傳 starter trip。
2. JSON parse 失敗：備份原始字串，回傳 starter trip 與 recovery message。
3. schemaVersion 或 shape 不支援：同上，不做猜測性 migration。
4. 驗證成功：正規化 order 後回傳 Trip。
