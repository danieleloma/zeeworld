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

  // STEP 1: Detect the broadcast day start time from the first show in the Excel sheet
  // The first row we created represents the first show from the Excel file
  let broadcastDayStartHour = 5; // Default fallback
  
  if (rows.length > 0) {
    const firstShowTime = rows[0]['Start Time'];
    broadcastDayStartHour = parseInt(firstShowTime.split(':')[0], 10);
    console.log(`Detected broadcast day start time from first show: ${firstShowTime} (hour: ${broadcastDayStartHour})`);
  }

  // Sort rows with proper timezone ordering (WAT before CAT)
  const tzOrder = options.timezoneOrder;
  console.log(`Sorting with timezone order: ${tzOrder.join(', ')}`);

  // Helper function to convert time to sortable value
  // Broadcast day starts at detected hour (e.g., 05:00 or 06:00), so times before that should sort after 23:59
  const timeToSortValue = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // If time is before the broadcast day start hour, add 24 hours to make it sort after 23:59
    if (hours < broadcastDayStartHour) {
      return totalMinutes + (24 * 60);
    }
    return totalMinutes;
  };

  rows.sort((a, b) => {
    // First by date
    if (a.Date !== b.Date) {
      return a.Date.localeCompare(b.Date);
    }
    
    // Then by start time (with broadcast day logic: 05:00-04:59)
    if (a['Start Time'] !== b['Start Time']) {
      const aTime = timeToSortValue(a['Start Time']);
      const bTime = timeToSortValue(b['Start Time']);
      return aTime - bTime;
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