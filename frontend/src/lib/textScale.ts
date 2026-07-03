export type TextScale = "normal" | "lg" | "xl";

const STORAGE_KEY = "ssai_text_scale";
const ORDER: TextScale[] = ["normal", "lg", "xl"];

export function getStoredTextScale(): TextScale {
  const stored = localStorage.getItem(STORAGE_KEY);
  return (ORDER as string[]).includes(stored || "") ? (stored as TextScale) : "normal";
}

export function applyTextScale(scale: TextScale) {
  if (scale === "normal") {
    document.documentElement.removeAttribute("data-text-scale");
  } else {
    document.documentElement.setAttribute("data-text-scale", scale);
  }
  localStorage.setItem(STORAGE_KEY, scale);
}

export function nextTextScale(current: TextScale): TextScale {
  const idx = ORDER.indexOf(current);
  return ORDER[(idx + 1) % ORDER.length];
}
