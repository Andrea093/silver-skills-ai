// pdf-parse (and the pdf.js it wraps) extracts text in whatever order the PDF's content stream
// lists it — for a plain single-column CV that's the real reading order, but for a two-column
// résumé template (Canva and similar tools are full of these: a narrow sidebar with contact/
// skills next to a wide main column with experience) it interleaves lines from both columns,
// which scrambles cvParser.ts's line-by-line section detection ("Habilidades" can end up
// sandwiched mid-paragraph in "Experiencia").
//
// This is a drop-in replacement for pdf-parse's default `pagerender` option: same signature, but
// instead of just grouping items into lines by y-position and joining in stream order, it first
// looks for a vertical gap in where lines *start* on the x-axis — a real column gutter — and, only
// when one exists, splits items into two groups by that gap and reads the left column fully
// top-to-bottom before the right column, instead of interleaving them. A normal single-column CV
// (where lines start at all sorts of x positions, no consistent gap) is left exactly as pdf.js
// ordered it, so this only changes behavior for the layouts that actually need it.

interface RawTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
}

interface Line {
  y: number;
  text: string;
}

const Y_MERGE_TOLERANCE = 2; // pdf.js gives sub-pixel y jitter for items that are visually on one line
const MIN_ITEMS_FOR_COLUMN_CHECK = 8; // too little content on a page to trust the column heuristic
// Wide enough to catch an asymmetric layout (a narrow sidebar can put the real gutter as far over
// as ~15-20% of the page width), but still excludes gaps right at the very edge, which are more
// likely a paragraph/bullet indent than an actual second column.
const GUTTER_BAND_LO_RATIO = 0.12;
const GUTTER_BAND_HI_RATIO = 0.88;
const MIN_GUTTER_RATIO = 0.05; // minimum gap width (as a fraction of page width) to count as a real gutter, not just normal word/margin spacing

/**
 * Looks for the widest gap between consecutive item start-x positions that falls in the page's
 * central band. A genuine two-column layout has most lines in each column starting at one of two
 * consistent x positions, leaving a real empty gutter between them; a single-column CV has lines
 * starting at all sorts of x positions (paragraph edges, bullet indents, section headers), so no
 * such consistent gap exists. Returns the gap's midpoint (the column boundary) or null.
 */
function findColumnSplitX(items: RawTextItem[], pageWidth: number): number | null {
  if (items.length < MIN_ITEMS_FOR_COLUMN_CHECK || pageWidth <= 0) return null;
  const xs = Array.from(new Set(items.map((i) => i.x))).sort((a, b) => a - b);
  if (xs.length < 2) return null;

  const bandLo = pageWidth * GUTTER_BAND_LO_RATIO;
  const bandHi = pageWidth * GUTTER_BAND_HI_RATIO;
  const minGutter = pageWidth * MIN_GUTTER_RATIO;

  let bestGap = 0;
  let bestSplit: number | null = null;
  for (let i = 1; i < xs.length; i++) {
    const gap = xs[i] - xs[i - 1];
    const mid = (xs[i] + xs[i - 1]) / 2;
    if (mid >= bandLo && mid <= bandHi && gap > bestGap) {
      bestGap = gap;
      bestSplit = mid;
    }
  }
  if (bestGap < minGutter) return null;

  // Require real content confidently on both sides — a gap with only a couple of stray items on
  // one side is more likely a single indented line than an actual second column.
  const leftCount = items.filter((i) => i.x < (bestSplit as number)).length;
  const rightCount = items.length - leftCount;
  const minSide = Math.max(3, Math.round(items.length * 0.15));
  if (leftCount < minSide || rightCount < minSide) return null;

  return bestSplit;
}

function groupIntoLines(items: RawTextItem[]): Line[] {
  const lineGroups: { y: number; items: RawTextItem[] }[] = [];
  for (const item of items) {
    const existing = lineGroups.find((g) => Math.abs(g.y - item.y) <= Y_MERGE_TOLERANCE);
    if (existing) existing.items.push(item);
    else lineGroups.push({ y: item.y, items: [item] });
  }
  return lineGroups.map(({ y, items: lineItems }) => {
    lineItems.sort((a, b) => a.x - b.x);
    return { y, text: lineItems.map((i) => i.str).join("") };
  });
}

/** Reading order: top of the page first (pdf.js y grows upward from the bottom). */
function topToBottom(lines: Line[]): Line[] {
  return [...lines].sort((a, b) => b.y - a.y);
}

export function columnAwarePageRender(pageData: any): Promise<string> {
  return pageData
    .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
    .then((textContent: { items: any[] }) => {
      const items: RawTextItem[] = textContent.items
        .filter((it) => it.str && it.str.length > 0)
        .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5], width: it.width || 0 }));

      if (items.length === 0) return "";

      const pageWidth = pageData.getViewport(1, 0).width as number;
      const splitX = findColumnSplitX(items, pageWidth);

      if (splitX === null) {
        return topToBottom(groupIntoLines(items))
          .map((l) => l.text)
          .join("\n");
      }

      const left = topToBottom(groupIntoLines(items.filter((i) => i.x < splitX)));
      const right = topToBottom(groupIntoLines(items.filter((i) => i.x >= splitX)));
      return [...left, ...right].map((l) => l.text).join("\n");
    });
}
