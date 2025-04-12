# CalendarCraft 移行状況 (YYYY-MM-DD)

## 現在の状況

*   Next.js App Router への移行作業中（Vercel デプロイ目標）
*   既存のレイアウト（サイドメニュー）とカレンダー関連コンポーネントを `src` ディレクトリへ移行済み。
*   **進行中のタスク:** カレンダーコンポーネントの Next.js App Router への適応
    *   **サブタスク:** Server Component と Client Component の適切な分離 (`'use client'` ディレクティブの追加) - 完了
    *   **次のサブタスク:** データフェッチングの実装方法の変更

## 完了したタスク

### レイアウト構造の移行
*   ✅ `src/components/layout` ディレクトリを作成
*   ✅ `temp-backup` から `Layout.tsx` を `src/components/layout/` へ移行
*   ✅ `src/app/layout.tsx` で `Layout` コンポーネントを組み込み
*   ✅ 不要な `temp-backup` のレイアウトファイルを削除

### カレンダーコンポーネントの移行と準備
*   ✅ `src/components/calendar` ディレクトリを確認
*   ✅ `calendar-grid.tsx`: 最新版 (`src`) を確認、`temp-backup` 版を削除
*   ✅ `calendar-header.tsx`: `temp-backup` から `src` へ移行、`temp-backup` 版を削除
*   ✅ `day-cell.tsx`: 最新版 (`src`) を確認
*   ✅ `event-modal.tsx`: `src/components/calendar/EventModal.tsx` を正とし、`temp-backup` 版を削除
*   ✅ `export-button.tsx`: `temp-backup` から `src` へ移行、`temp-backup` 版を削除

### Server/Client Component の分離
*   ✅ `src/components/calendar/Calendar.tsx` に `'use client'` を確認
*   ✅ `src/components/calendar/calendar-grid.tsx` に `'use client'` を確認
*   ✅ `src/components/calendar/day-cell.tsx` に `'use client'` を確認
*   ✅ `src/components/calendar/EventModal.tsx` に `'use client'` を確認
*   ✅ `src/components/calendar/export-button.tsx` に `'use client'` を確認
*   ✅ `src/components/calendar/calendar-header.tsx` に `'use client'` を追加

## 次のステップ

1.  **データフェッチングの実装方法の変更:**
    *   `src/components/calendar/Calendar.tsx` (または関連するページコンポーネント) で Server Actions や Route Handlers を使用してイベント、タスク、勤怠データを取得するように修正する。
    *   Supabase との連携を確認する。
2.  **イベントハンドリングの調整:**
    *   `Calendar.tsx`, `MonthView.tsx` などで `onDateClick` や `onEventClick` が App Router 環境で正しく動作するか確認・修正する。
    *   `EventModal.tsx` の表示ロジックを確認・修正する。
3.  **チーム/個人表示の切り替え機能の実装:**
    *   `CalendarHeader` の状態を親コンポーネントで管理し、表示切り替えに応じてフェッチするデータを変更する。
4.  **イベント、タスク、出勤情報の統合表示:**
    *   `DayCell.tsx` で各種データが正しく表示されるか確認する。
