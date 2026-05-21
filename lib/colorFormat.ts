/** #RGB / #RRGGBB / RRGGBB を #rrggbb に正規化。不正なら null */
export function normalizeHex(
  input: string
): string | null {
  let value = input.trim().toLowerCase();

  if (!value) {
    return null;
  }

  if (value.startsWith("#")) {
    value = value.slice(1);
  }

  if (/^[0-9a-f]{3}$/.test(value)) {
    return (
      "#" +
      value
        .split("")
        .map((c) => c + c)
        .join("")
    );
  }

  if (/^[0-9a-f]{6}$/.test(value)) {
    return "#" + value;
  }

  return null;
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);

  if (!normalized) {
    return null;
  }

  const value = normalized.slice(1);

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex(
  r: number,
  g: number,
  b: number
): string | null {
  const channels = [r, g, b];

  if (
    channels.some(
      (n) =>
        !Number.isFinite(n) ||
        n < 0 ||
        n > 255
    )
  ) {
    return null;
  }

  return (
    "#" +
    channels
      .map((n) =>
        Math.round(n)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

/** #hex / rgb(r,g,b) などを #rrggbb に変換 */
export function parseColorInput(
  input: string
): string | null {
  const trimmed = input.trim();

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i
  );

  if (rgbMatch) {
    return rgbToHex(
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3])
    );
  }

  return normalizeHex(trimmed);
}
