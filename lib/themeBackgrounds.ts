import type { ThemeSettings } from "@/lib/storage";

export const BUILTIN_BACKGROUND_IMAGES = [
  { src: "", label: "なし" },
  {
    src: "/backgrounds/marble.jpg",
    label: "大理石",
  },
  {
    src: "/backgrounds/aurora.jpg",
    label: "オーロラ",
  },
  {
    src: "/backgrounds/night-sky.jpg",
    label: "夜空",
  },
] as const;

export const MAX_CUSTOM_BACKGROUND_IMAGES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TARGET_DATA_URL_BYTES = 1_400_000;
const MAX_EDGE_PX = 1600;

export type BackgroundImageChoice = {
  src: string;
  label: string;
  isCustom: boolean;
};

export function normalizeCustomBackgroundImages(
  images: string[] | undefined
): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter(
    (src) =>
      typeof src === "string" &&
      src.length > 0
  );
}

export function getBackgroundImageChoices(
  customImages: string[]
): BackgroundImageChoice[] {
  const builtins: BackgroundImageChoice[] =
    BUILTIN_BACKGROUND_IMAGES.map(
      (item) => ({
        src: item.src,
        label: item.label,
        isCustom: false,
      })
    );

  const customs: BackgroundImageChoice[] =
    customImages.map((src, index) => ({
      src,
      label: `追加 ${index + 1}`,
      isCustom: true,
    }));

  return [...builtins, ...customs];
}

export function addCustomBackgroundImage(
  theme: ThemeSettings,
  dataUrl: string
): ThemeSettings {
  const custom = normalizeCustomBackgroundImages(
    theme.customBackgroundImages
  );

  if (custom.includes(dataUrl)) {
    return {
      ...theme,
      backgroundImage: dataUrl,
      customBackgroundImages: custom,
    };
  }

  const nextCustom = [
    ...custom,
    dataUrl,
  ].slice(-MAX_CUSTOM_BACKGROUND_IMAGES);

  return {
    ...theme,
    backgroundImage: dataUrl,
    customBackgroundImages: nextCustom,
  };
}

export function removeCustomBackgroundImage(
  theme: ThemeSettings,
  src: string
): ThemeSettings {
  const custom = normalizeCustomBackgroundImages(
    theme.customBackgroundImages
  ).filter((item) => item !== src);

  return {
    ...theme,
    backgroundImage:
      theme.backgroundImage === src
        ? ""
        : theme.backgroundImage,
    customBackgroundImages: custom,
  };
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil(base64.length * 0.75);
}

export async function compressImageFileToDataUrl(
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "画像ファイル（JPG / PNG など）を選んでください"
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      "5MB 以下の画像を選んでください"
    );
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_EDGE_PX /
      Math.max(bitmap.width, bitmap.height)
  );
  const width = Math.max(
    1,
    Math.round(bitmap.width * scale)
  );
  const height = Math.max(
    1,
    Math.round(bitmap.height * scale)
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "画像の読み込みに失敗しました"
    );
  }

  context.drawImage(
    bitmap,
    0,
    0,
    width,
    height
  );
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL(
    "image/jpeg",
    quality
  );

  while (
    estimateDataUrlBytes(dataUrl) >
      TARGET_DATA_URL_BYTES &&
    quality > 0.45
  ) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL(
      "image/jpeg",
      quality
    );
  }

  return dataUrl;
}
