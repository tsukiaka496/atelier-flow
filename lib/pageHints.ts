export type PageHint = {
  title: string;
  body: string;
  bullets?: string[];
};

/**
 * 画面ごとの使い方ヒント。
 * キーは pathname のプレフィックス（長いもの優先で照合）。
 */
export const PAGE_HINTS: Record<string, PageHint> = {
  "/": {
    title: "ホームの使い方",
    body: "今週の仕事・予定・締切・作業を、日ごとにまとめて確認する画面です。",
    bullets: [
      "左右の矢印や日付バッジで週・日を切り替えます",
      "選択した日の作業・メモをタップして完了にできます",
      "日付未設定の作業・メモは、下の箱の中をスクロールして確認できます",
    ],
  },
  "/month": {
    title: "月カレンダーの使い方",
    body: "仕事や予定をカレンダー上で追加・編集し、月の予定を一覧します。",
    bullets: [
      "日セルをタップして仕事・予定を追加・編集できます",
      "設定の表示モードで詳細／簡易を切り替えられます",
      "仕事と予定で色が分かれるので、一目で区別できます",
    ],
  },
  "/projects/new": {
    title: "案件作成の使い方",
    body: "案件または趣味を選び、内容・色・納期・作業リストを入力して登録します。",
    bullets: [
      "「案件」と「趣味」を切り替えて入力項目を変えられます",
      "趣味では依頼主は出さず、描きたいものを入力します",
      "作業の順番と日程はあとから別々に編集できます",
    ],
  },
  "/projects": {
    title: "案件一覧の使い方",
    body: "制作案件と趣味を一覧で確認し、詳細や新規作成へ進みます。",
    bullets: [
      "納期順／進捗順と昇順／降順で並び替えできます",
      "完了済みの表示切替でリストを整理できます",
      "＋から新しい案件または趣味を作成します",
    ],
  },
  "/memos": {
    title: "メモの使い方",
    body: "短いメモを素早く残し、日付・重要度・グループで整理します。",
    bullets: [
      "上部の入力欄からすぐメモを追加できます",
      "グループで分けて、日付順／重要度順と昇順／降順で並べられます",
      "完了したメモはタップでチェックできます",
    ],
  },
  "/settings": {
    title: "設定の使い方",
    body: "テーマ色・背景・月表示モードなど、見た目の好みを調整します。",
    bullets: [
      "アクセント色でナビや選択状態の色が変わります",
      "月表示は詳細／簡易モードを選べます",
      "バックアップの書き出し・読み込み・全削除もここから行えます",
    ],
  },
  "/timeline": {
    title: "時間スケジュールの使い方",
    body: "0〜24時の表に、平日／休日ごとの1日の流れを置ける画面です。",
    bullets: [
      "平日・休日タブを切り替えてそれぞれの予定を編集します",
      "開始〜終了を一度に指定できます（例: 4時〜12時＝睡眠）",
      "空き時間をタップして追加、入っている予定をタップして編集します",
    ],
  },
};

const PAGE_HINT_PREFIXES = [
  "/projects/new",
  "/timeline",
  "/settings",
  "/memos",
  "/month",
  "/projects",
  "/",
] as const;

/** pathname から対応するヒントを解決する（プレフィックス照合） */
export function getPageHint(
  pathname: string
): PageHint | undefined {
  for (const prefix of PAGE_HINT_PREFIXES) {
    if (prefix === "/") {
      if (pathname === "/" || pathname === "") {
        return PAGE_HINTS["/"];
      }
      continue;
    }

    if (
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`)
    ) {
      return PAGE_HINTS[prefix];
    }
  }

  return undefined;
}
