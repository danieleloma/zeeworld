/**
 * Convert parsed grid data to output rows
 */

import { ParsedGrid, OutputRow, ConversionOptions, DayColumn } from './types';
import { addMinutes, sameShow, isEmptySlot } from './timeMath';
import { parseProgramCell } from './textParsing';

interface MergedSlot {
  startTime: string;
  endTime: string;
  text: string;
  rowIndex: number;
}

/**
 * Merge contiguous slots with the same show
 * Note: This function is now deprecated since gridParser handles show duration analysis
 * using Excel merge information, which is more accurate than time-based merging
 */
function mergeSlots(cells: Array<{ time: string; text: string; rowIndex: number }>): MergedSlot[] {
  // Since gridParser already handles show duration analysis using Excel merge information,
  // we should not merge here as it would override the accurate duration calculations
  // Instead, just convert the cells to MergedSlot format
  return cells.map(cell => ({
    startTime: cell.time,
    endTime: addMinutes(cell.time, 30), // This will be overridden by the actual endTime from gridParser
    text: cell.text,
    rowIndex: cell.rowIndex
  }));
}

/**
 * Convert parsed grid to output rows
 */
export function convertToRows(
  grid: ParsedGrid,
  options: ConversionOptions
): OutputRow[] {
  const rows: OutputRow[] = [];

  console.log("=== CONVERSION DEBUG ===");
  console.log("Number of timezone blocks:", grid.timezoneBlocks.length);
  console.log("Timezone blocks:", grid.timezoneBlocks);

  for (const block of grid.timezoneBlocks) {
    console.log(`Processing timezone block: ${block.tz} with ${block.days.length} days`);
    for (const day of block.days) {
      console.log(`Processing day: ${day.weekday} (${day.iso}) with ${day.cells.length} cells`);
      console.log(`Sample cells for ${day.weekday}:`, day.cells.slice(0, 3));
      // The gridParser now handles show duration analysis
      // Use the endTime calculated by the parser, or fallback to 30 minutes
      let slots: MergedSlot[];
      
      // Always use the endTime calculated by gridParser (from Excel merge information)
      // This is more accurate than time-based merging
      slots = day.cells.map((c, index) => {
        const slot = {
          startTime: c.time,
          endTime: c.endTime || addMinutes(c.time, 30), // Use actual endTime from gridParser
          text: c.text,
          rowIndex: c.rowIndex,
        };
        if (index < 3) {
          console.log(`Creating slot ${index} from cell:`, c, '-> slot:', slot);
          console.log(`Cell time: "${c.time}", Cell endTime: "${c.endTime}"`);
          console.log(`Slot startTime: "${slot.startTime}", Slot endTime: "${slot.endTime}"`);
        }
        return slot;
      });
      console.log(`Sample slots for ${day.weekday}:`, slots.slice(0, 3));

      for (const slot of slots) {
        if (isEmptySlot(slot.text)) continue;

        const parsed = parseProgramCell(slot.text);

        const newRow: OutputRow = {
          Region: options.region,
          Date: day.iso,
          'Start Time': slot.startTime,
          'End Time': slot.endTime,
          Title: parsed.title,
          Season: parsed.season || '',
          Episode: parsed.episode || '',
          Subtitle: parsed.subtitle || '',
          'Text Color': options.textColor,
          'BG Color': options.bgColor,
          Timezone: block.tz,
        };
        rows.push(newRow);
        if (rows.length <= 3) {
          console.log("Sample output row:", newRow);
          console.log("Slot used for this row:", slot);
          console.log("Slot startTime:", slot.startTime, "Slot endTime:", slot.endTime);
          console.log("NewRow Start Time:", newRow['Start Time'], "NewRow End Time:", newRow['End Time']);
        }
      }
    }
  }
  console.log("=== END CONVERSION DEBUG ===");

  // Sort rows with proper timezone ordering (WAT before CAT)
  const tzOrder = options.timezoneOrder;
  console.log("Sorting with timezone order:", tzOrder);
  console.log("Sample rows before sorting:", rows.slice(0, 3));
  
  rows.sort((a, b) => {
    // First by date
    if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
    
    // Then by start time
    if (a['Start Time'] !== b['Start Time']) return a['Start Time'].localeCompare(b['Start Time']);
    
    // Then by timezone order (WAT before CAT)
    const aIdx = tzOrder.indexOf(a.Timezone);
    const bIdx = tzOrder.indexOf(b.Timezone);
    if (aIdx !== bIdx) {
      // If timezone not in order, put it last
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    }
    
    // Finally by title
    return a.Title.localeCompare(b.Title);
  });
  
  console.log("Sample rows after sorting:", rows.slice(0, 3));

  return rows;
}

