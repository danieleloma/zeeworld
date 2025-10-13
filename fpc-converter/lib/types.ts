/**
 * Output row format matching the specification
 */
export interface OutputRow {
  Region: string;
  Date: string; // ISO YYYY-MM-DD
  'Start Time': string; // HH:MM
  'End Time': string; // HH:MM
  Title: string;
  Season: string;
  Episode: string;
  Subtitle: string;
  'Text Color': string;
  'BG Color': string;
  Timezone: string;
}

/**
 * Configuration options for conversion
 */
export interface ConversionOptions {
  region: string;
  timezoneOrder: string[]; // e.g., ['WAT', 'CAT']
  textColor: string;
  bgColor: string;
  mergeSlots: boolean;
}

/**
 * A single program cell with time and text
 */
export interface ProgramCell {
  time: string; // HH:MM format
  text: string;
  endTime?: string; // HH:MM format (optional, calculated by parser)
  rowIndex: number; // Original row index from sheet
}

/**
 * A day column with its parsed data
 */
export interface DayColumn {
  weekday: string; // Mon, Tue, Wed, etc.
  iso: string; // YYYY-MM-DD
  cells: ProgramCell[];
}

/**
 * A timezone block with its day columns
 */
export interface TimezoneBlock {
  tz: string; // WAT, CAT, etc.
  days: DayColumn[];
}

/**
 * Parsed grid structure
 */
export interface ParsedGrid {
  timezoneBlocks: TimezoneBlock[];
  issues: string[];
}

