/**
 * Static seat-map layout for reserved-seating events (currently the NLT
 * Anniversary). The map itself is fixed configuration — only the *bookings*
 * live in the database (public.event_seat_bookings), keyed by seat label.
 *
 * Two sections, each split into an upper and lower block:
 *   Section A  — seats 1-A … 91-A, numbered left→right, top→bottom.
 *   Section B  — seats 1-B … 80-B, numbered right→left (ascending toward the
 *                aisle), so within a row the highest number sits on the left.
 */

type BlockDef = {
  rows: number;
  cols: number;
  /** first seat number in this block */
  start: number;
  /** numbering direction across a row */
  order: 'ltr' | 'rtl';
  /** left padding in grid columns, so a narrow block can right-align */
  colOffset?: number;
};

type SectionDef = {
  id: 'A' | 'B';
  title: string;
  suffix: 'A' | 'B';
  /** total grid columns the section spans (widest block) */
  gridCols: number;
  /** empty seat-height rows rendered above the section's blocks */
  topSpacerRows?: number;
  blocks: BlockDef[];
};

const SECTIONS: SectionDef[] = [
  {
    id: 'A',
    title: 'Section A',
    suffix: 'A',
    gridCols: 7,
    blocks: [
      { rows: 5, cols: 7, start: 1, order: 'ltr' },
      { rows: 8, cols: 7, start: 36, order: 'ltr' },
    ],
  },
  {
    id: 'B',
    title: 'Section B',
    suffix: 'B',
    gridCols: 7,
    // first row is left empty; Section B seats start on the second row
    topSpacerRows: 1,
    blocks: [
      // upper block is 6 wide and right-aligned against the 7-wide lower block
      { rows: 4, cols: 6, start: 1, order: 'rtl', colOffset: 1 },
      { rows: 8, cols: 7, start: 25, order: 'rtl' },
    ],
  },
];

export type Seat = { label: string; col: number };
export type SeatBlock = { gridCols: number; rows: Seat[][] };
export type SeatSection = {
  id: 'A' | 'B';
  title: string;
  gridCols: number;
  topSpacerRows: number;
  blocks: SeatBlock[];
};

function buildSection(def: SectionDef): SeatSection {
  const blocks = def.blocks.map((block): SeatBlock => {
    const rows: Seat[][] = [];
    for (let r = 0; r < block.rows; r += 1) {
      const row: Seat[] = [];
      for (let p = 1; p <= block.cols; p += 1) {
        const offset = block.order === 'rtl' ? block.cols - p : p - 1;
        const n = block.start + r * block.cols + offset;
        row.push({ label: `${n}-${def.suffix}`, col: p + (block.colOffset ?? 0) });
      }
      rows.push(row);
    }
    return { gridCols: def.gridCols, rows };
  });
  return {
    id: def.id,
    title: def.title,
    gridCols: def.gridCols,
    topSpacerRows: def.topSpacerRows ?? 0,
    blocks,
  };
}

/** Render-ready seat map (sections → blocks → rows → seats). */
export const SEAT_MAP: SeatSection[] = SECTIONS.map(buildSection);

/** Every valid seat label in the map. */
export const ALL_SEAT_LABELS: string[] = SEAT_MAP.flatMap((s) =>
  s.blocks.flatMap((b) => b.rows.flatMap((row) => row.map((seat) => seat.label)))
);

const SEAT_LABEL_SET = new Set(ALL_SEAT_LABELS);

export function isValidSeatLabel(label: string): boolean {
  return SEAT_LABEL_SET.has(label);
}

/** Total seats in the venue. */
export const TOTAL_SEATS = ALL_SEAT_LABELS.length;

/** Max seats a single booking may reserve at once. */
export const MAX_SEATS_PER_BOOKING = 10;
