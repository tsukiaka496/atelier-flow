export const MEMO_IMPORTANCE_NORMAL = 1;
export const MEMO_IMPORTANCE_HIGH = 2;

export function normalizeMemoImportance(
  value: unknown
): number {
  const num =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(num)) {
    return MEMO_IMPORTANCE_NORMAL;
  }

  if (num >= 4) {
    return MEMO_IMPORTANCE_HIGH;
  }

  if (num >= MEMO_IMPORTANCE_HIGH) {
    return MEMO_IMPORTANCE_HIGH;
  }

  return MEMO_IMPORTANCE_NORMAL;
}

export function isMemoImportant(
  importance: number
): boolean {
  return importance >= MEMO_IMPORTANCE_HIGH;
}

export function memoImportanceLabel(
  importance: number
): string {
  return isMemoImportant(importance)
    ? "重要"
    : "普通";
}
