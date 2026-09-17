export type Rgb = { r: number; g: number; b: number };

const AARRGGBB = /^[0-9A-Fa-f]{8}$/;
const HEX6 = /^#?([0-9A-Fa-f]{6})$/;

export function parseHexColor(hex: string): Rgb | null {
  const match = HEX6.exec(hex.trim());
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function colorsEqual(a: Rgb, b: Rgb): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

/** Parse a Paint.NET palette (.txt) into RGB colors (alpha discarded). */
export function parsePaintNetPalette(text: string): Rgb[] {
  const colors: Rgb[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";")) continue;
    if (!AARRGGBB.test(line)) {
      throw new Error(`Invalid color entry: "${line}" (expected AARRGGBB hex)`);
    }
    colors.push({
      r: parseInt(line.slice(2, 4), 16),
      g: parseInt(line.slice(4, 6), 16),
      b: parseInt(line.slice(6, 8), 16),
    });
  }

  if (colors.length === 0) {
    throw new Error("No colors found in palette file");
  }

  return colors;
}

export function filterIgnoredColors(
  colors: Rgb[],
  ignore: Rgb | null,
): Rgb[] {
  if (!ignore) return colors;
  return colors.filter((c) => !colorsEqual(c, ignore));
}

export function paletteNameFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "");
  return base.replace(/\.[^.]+$/, "") || "Converted Palette";
}

/** Emit a GIMP Palette (.gpl) string. */
export function toGpl(
  colors: Rgb[],
  name: string,
  columns = 16,
): string {
  const lines = [
    "GIMP Palette",
    `Name: ${name}`,
    `Columns: ${columns}`,
    "#",
    ...colors.map(({ r, g, b }) => `${r} ${g} ${b}`),
    "",
  ];
  return lines.join("\n");
}

export function convertPaintNetToGpl(
  text: string,
  options: {
    name: string;
    ignoreColor?: Rgb | null;
    columns?: number;
  },
): { colors: Rgb[]; gpl: string } {
  const parsed = parsePaintNetPalette(text);
  const colors = filterIgnoredColors(parsed, options.ignoreColor ?? null);
  if (colors.length === 0) {
    throw new Error("No colors left after applying ignore filter");
  }
  return {
    colors,
    gpl: toGpl(colors, options.name, options.columns ?? 16),
  };
}
