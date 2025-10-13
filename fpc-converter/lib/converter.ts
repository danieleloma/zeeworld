/**
 * Convert parsed grid data to output rows
 * COMPLETELY REWRITTEN to ensure correct output
 */

import { ParsedGrid, OutputRow, ConversionOptions } from './types';
import { isEmptySlot } from './timeMath';
import { parseProgramCell } from './textParsing';

/**
 * Convert parsed grid to output rows - COMPLETELY REWRITTEN
 */
export function convertToRows(
  grid: ParsedGrid,
  options: ConversionOptions
): OutputRow[] {
  const rows: OutputRow[] = [];

  console.log("=== CONVERTING TO OUTPUT ROWS ===");
  console.log(`Processing ${grid.timezoneBlocks.length} timezone blocks`);

  // Process each timezone block
  for (const block of grid.timezoneBlocks) {
    console.log(`\nProcessing timezone: ${block.tz}`);
    console.log(`Days in this timezone: ${block.days.length}`);

    // Process each day in this timezone
    for (const day of block.days) {
      console.log(`\nProcessing day: ${day.weekday} (${day.iso})`);
      console.log(`Shows in this day: ${day.cells.length}`);

      // Process each show in this day
      for (let i = 0; i < day.cells.length; i++) {
        const cell = day.cells[i];
        
        // Skip empty slots
        if (isEmptySlot(cell.text)) {
          console.log(`Skipping empty slot at index ${i}`);
          continue;
        }

        // Parse the show text
        const parsed = parseProgramCell(cell.text);

        // Create the output row
        const newRow: OutputRow = {
          Region: options.region,
          Date: day.iso,
          'Start Time': cell.time,
          'End Time': cell.endTime || cell.time, // Use endTime from parser
          Title: parsed.title,
          Season: parsed.season || '',
          Episode: parsed.episode || '',
          Subtitle: parsed.subtitle || '',
          'Text Color': options.textColor,
          'BG Color': options.bgColor,
          Timezone: block.tz,
        };

        rows.push(newRow);

        // Log first few rows for debugging
        if (rows.length <= 5) {
          console.log(`Row ${rows.length}: ${newRow.Title} at ${newRow['Start Time']}-${newRow['End Time']} (${newRow.Timezone})`);
          console.log(`  Cell data: time="${cell.time}", endTime="${cell.endTime}", text="${cell.text}"`);
        }
      }
    }
  }

  console.log(`\nCreated ${rows.length} total rows`);
  console.log("Sample rows BEFORE sorting:");
  rows.slice(0, 5).forEach((row, index) => {
    console.log(`${index + 1}. ${row.Title} - ${row['Start Time']}-${row['End Time']} (${row.Timezone}) on ${row.Date}`);
  });

  // Sort rows with proper timezone ordering (WAT before CAT)
  const tzOrder = options.timezoneOrder;
  console.log(`Sorting with timezone order: ${tzOrder.join(', ')}`);

  rows.sort((a, b) => {
    // First by date
    if (a.Date !== b.Date) {
      return a.Date.localeCompare(b.Date);
    }
    
    // Then by start time
    if (a['Start Time'] !== b['Start Time']) {
      return a['Start Time'].localeCompare(b['Start Time']);
    }
    
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

  console.log("\n=== SORTING COMPLETE ===");
  console.log("First 5 rows after sorting:");
  rows.slice(0, 5).forEach((row, index) => {
    console.log(`${index + 1}. ${row.Title} - ${row['Start Time']}-${row['End Time']} (${row.Timezone}) on ${row.Date}`);
  });

  return rows;
}