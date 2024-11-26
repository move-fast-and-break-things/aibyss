const RGB_RE = /^rgb\((\d+), *(\d+), *(\d+)\)$/i;
const RGBA_RE = /^rgba\((\d+), *(\d+), *(\d+), *\d+(?:\.\d+)?\)$/i;

export function setRgbColorOpacity({ color, opacity }: {
  color: string;
  opacity: number;
}): string {
  const rgbMatch = color.match(RGB_RE);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
  }

  const rgbaMatch = color.match(RGBA_RE);
  if (!rgbaMatch) {
    throw new Error("unexpected color format");
  }

  return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
}
