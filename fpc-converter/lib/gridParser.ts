/**
 * Parse grid-format Excel files into structured data
 */

import * as XLSX from 'xlsx';
import { fmtTimeLabel, isEmptySlot, sameShow } from './timeMath';
import { ParsedGrid, TimezoneBlock, DayColumn, ProgramCell } from './types';

interface CellValue {
  v?: any;
  w?: string;
  t?: string;
}

/**
 * Parse a date from various formats found in day headers
 * Returns the exact date as found in the source file
 */
function parseDateFromHeader(headerText: string, year?: number): string | null {
  if (!headerText) return null;

  // Try to extract date portions
  // Patterns: "Mon, Oct 6", "Mon 6 Oct", "Mon Oct 6", "29-Sep", "30-Sep", "1-Oct", "2-Oct", etc.
  const monthNames: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  const text = headerText.toLowerCase().trim();
  
  // Extract month and day
  let month: number | null = null;
  let day: number | null = null;

  // Look for month name
  for (const [name, idx] of Object.entries(monthNames)) {
    if (text.includes(name)) {
      month = idx;
      break;
    }
  }

  // Look for day number (1-31) - handle formats like "29-Sep", "30-Sep", "1-Oct"
  const dayMatch = text.match(/\b(\d{1,2})\b/);
  if (dayMatch) {
    day = parseInt(dayMatch[1], 10);
  }
  
  // Also try to parse formats like "29-Sep", "30-Sep", "1-Oct", "2-Oct"
  const dashFormatMatch = text.match(/(\d{1,2})-([a-z]{3})/);
  if (dashFormatMatch && !month) {
    day = parseInt(dashFormatMatch[1], 10);
    const monthAbbr = dashFormatMatch[2];
    // Map month abbreviations
    const monthAbbrMap: { [key: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    if (monthAbbrMap[monthAbbr] !== undefined) {
      month = monthAbbrMap[monthAbbr];
    }
  }

  if (month !== null && day !== null) {
    // Use the year from the source file if provided, otherwise use current year
    const useYear = year || new Date().getFullYear();
    const date = new Date(useYear, month, day);
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

/**
 * Extract weekday from header text
 */
function extractWeekday(headerText: string): string | null {
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const text = headerText.trim();
  
  for (const day of weekdays) {
    if (text.includes(day)) {
      return day;
    }
  }
  
  return null;
}

/**
 * Preserve exact dates from source file, only infer when absolutely necessary
 */
function preserveSourceDates(days: Array<{ weekday: string | null; iso: string | null }>): string[] {
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result: string[] = [];

  // Find first valid date as anchor for inference
  let anchorDate: Date | null = null;
  let anchorIndex = -1;

  for (let i = 0; i < days.length; i++) {
    if (days[i].iso) {
      anchorDate = new Date(days[i].iso!);
      anchorIndex = i;
      break;
    }
  }

  // Process each day, preserving source dates exactly
  for (let i = 0; i < days.length; i++) {
    if (days[i].iso) {
      // Use the exact date from the source file
      result.push(days[i].iso!);
      console.log(`Using source date for day ${i}: ${days[i].iso}`);
    } else if (days[i].weekday && anchorDate) {
      // Only infer if we have a valid anchor date and no source date
      const weekdayIdx = weekdayOrder.indexOf(days[i].weekday!);
      if (weekdayIdx >= 0) {
        const offset = i - anchorIndex;
        const date = new Date(anchorDate);
        date.setDate(anchorDate.getDate() + offset);
        const yyyy = date.getFullYear();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const inferredDate = `${yyyy}-${mm}-${dd}`;
        result.push(inferredDate);
        console.log(`Inferred date for day ${i} (${days[i].weekday}): ${inferredDate}`);
      } else {
        result.push('');
        console.log(`No date for day ${i} - invalid weekday: ${days[i].weekday}`);
      }
    } else {
      result.push('');
      console.log(`No date for day ${i} - no source date or weekday`);
    }
  }

  return result;
}

/**
 * Determine time slot duration by analyzing time differences
 */
function determineTimeSlotDuration(timeLabels: string[]): number {
  if (timeLabels.length < 2) {
    return 30; // Default to 30 minutes
  }

  const timeDiffs: number[] = [];
  
  for (let i = 1; i < timeLabels.length; i++) {
    const prevTime = timeLabels[i - 1];
    const currTime = timeLabels[i];
    
    const prevMinutes = timeToMinutes(prevTime);
    const currMinutes = timeToMinutes(currTime);
    
    if (prevMinutes !== null && currMinutes !== null) {
      let diff = currMinutes - prevMinutes;
      
      // Handle day rollover (e.g., 23:30 to 00:00)
      if (diff < 0) {
        diff += 24 * 60; // Add 24 hours
      }
      
      timeDiffs.push(diff);
    }
  }
  
  if (timeDiffs.length === 0) {
    return 30; // Default
  }
  
  // Find the most common time difference
  const diffCounts: { [key: number]: number } = {};
  timeDiffs.forEach(diff => {
    diffCounts[diff] = (diffCounts[diff] || 0) + 1;
  });
  
  const mostCommonDiff = Object.keys(diffCounts).reduce((a, b) => 
    diffCounts[parseInt(a)] > diffCounts[parseInt(b)] ? a : b
  );
  
  const duration = parseInt(mostCommonDiff);
  console.log(`Time differences found:`, timeDiffs);
  console.log(`Most common difference: ${duration} minutes`);
  
  return duration;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    console.log(`timeToMinutes: Invalid time format "${timeStr}"`);
    return null;
  }
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const totalMinutes = hours * 60 + minutes;
  
  console.log(`timeToMinutes: "${timeStr}" -> ${totalMinutes} minutes`);
  return totalMinutes;
}

/**
 * Add minutes to a time string
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const totalMinutes = timeToMinutes(timeStr);
  if (totalMinutes === null) {
    console.log(`addMinutesToTime: Invalid time string "${timeStr}"`);
    return timeStr;
  }
  
  const newTotalMinutes = (totalMinutes + minutes) % (24 * 60);
  const hours = Math.floor(newTotalMinutes / 60);
  const mins = newTotalMinutes % 60;
  
  const result = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  console.log(`addMinutesToTime: "${timeStr}" + ${minutes} minutes = "${result}"`);
  return result;
}

/**
 * Get cell merge information from Excel worksheet
 * Returns the number of rows a cell spans (1 if not merged)
 */
function getCellRowSpan(sheet: XLSX.WorkSheet, row: number, col: number): number {
  // SheetJS stores merge information in sheet['!merges']
  const merges = sheet['!merges'] || [];
  
  for (const merge of merges) {
    // Check if this cell is the start of a merged range
    if (merge.s.r === row && merge.s.c === col) {
      // Return the number of rows in the merge (end row - start row + 1)
      const rowSpan = merge.e.r - merge.s.r + 1;
      console.log(`Cell at row ${row}, col ${col} is merged: spans ${rowSpan} rows (from row ${merge.s.r} to ${merge.e.r})`);
      return rowSpan;
    }
  }
  
  // Not merged, spans 1 row
  return 1;
}

/**
 * Analyze show durations by detecting Excel cell merges
 * This determines actual show duration based on how many rows a cell spans
 */
function analyzeShowDurations(
  data: any[][],
  timeColIdx: number,
  dayColIdx: number,
  timeLabels: string[],
  timeSlotDuration: number,
  sheet: XLSX.WorkSheet
): Array<{ startTime: string; endTime: string; text: string; startRow: number; duration: number }> {
  const runs: Array<{ startTime: string; endTime: string; text: string; startRow: number; duration: number }> = [];
  
  // Track processed rows to avoid duplicates from merged cells
  const processedRows = new Set<number>();
  
  console.log(`Analyzing show durations for column ${dayColIdx}, time slot: ${timeSlotDuration} minutes`);
  console.log(`Sheet has ${(sheet['!merges'] || []).length} merge ranges`);
  console.log(`Time labels:`, timeLabels);
  console.log(`Time column index: ${timeColIdx}, Day column index: ${dayColIdx}`);
  console.log(`First few rows of data:`);
  for (let row = 0; row < Math.min(10, data.length); row++) {
    const timeCell = data[row]?.[timeColIdx];
    const programCell = data[row]?.[dayColIdx];
    console.log(`  Row ${row}: Time="${timeCell}" -> "${fmtTimeLabel(timeCell)}", Program="${programCell}"`);
  }
  
  for (let row = 0; row < data.length; row++) {
    if (processedRows.has(row)) {
      continue;
    }
    
    const timeCell = data[row]?.[timeColIdx];
    const formattedTime = fmtTimeLabel(timeCell);
    
    if (formattedTime) {
      const programCell = String(data[row]?.[dayColIdx] || '').trim();
      
      console.log(`Row ${row}: Time="${formattedTime}", Program="${programCell}"`);
      
      // Skip empty slots
      if (!programCell || programCell === '' || programCell === '—' || programCell === '-') {
        console.log(`  -> Skipping empty slot at row ${row}`);
        processedRows.add(row);
        continue;
      }
      
      // Get the actual row span from Excel merge information
      const rowSpan = getCellRowSpan(sheet, row, dayColIdx);
      
      // Mark all rows in the span as processed
      for (let i = 0; i < rowSpan; i++) {
        processedRows.add(row + i);
      }
      
      const duration = rowSpan * timeSlotDuration;
      const endTime = addMinutesToTime(formattedTime, duration);
      
      runs.push({
        startTime: formattedTime,
        endTime: endTime,
        text: programCell,
        startRow: row,
        duration: duration
      });
      
      console.log(`Show at row ${row}: "${programCell}" spans ${rowSpan} cells = ${duration} minutes (${formattedTime} - ${endTime})`);
    }
  }
  
  return runs;
}

/**
 * Parse an Excel workbook in grid format
 */
export function parseGrid(workbook: XLSX.WorkBook): ParsedGrid {
  const issues: string[] = [];
  const timezoneBlocks: TimezoneBlock[] = [];

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    issues.push('No sheets found in workbook');
    return { timezoneBlocks, issues };
  }

  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to 2D array
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (data.length === 0) {
    issues.push('Sheet is empty');
    return { timezoneBlocks, issues };
  }

  // Debug: Log the first few rows and columns to understand the structure
  console.log('=== EXCEL DATA STRUCTURE DEBUG ===');
  console.log('Data dimensions:', data.length, 'rows x', data[0]?.length || 0, 'columns');
  console.log('First 10 rows, first 10 columns:');
  for (let row = 0; row < Math.min(10, data.length); row++) {
    const rowData = data[row]?.slice(0, 10) || [];
    console.log(`Row ${row}:`, rowData.map(cell => `"${cell}"`).join(' | '));
  }
  console.log('=== END DATA STRUCTURE DEBUG ===');

  // Find timezone columns first (WAT/CAT in first few columns)
  const timezoneCols: Array<{ tz: string; colIdx: number }> = [];
  for (let col = 0; col < Math.min(5, data[0]?.length || 0); col++) {
    for (let row = 0; row < Math.min(5, data.length); row++) {
      const cell = String(data[row]?.[col] || '').toUpperCase();
      if (cell === 'WAT' || cell === 'CAT' || cell === 'EAT') {
        timezoneCols.push({ tz: cell, colIdx: col });
        console.log(`Found timezone column: ${cell} at col ${col}`);
        break;
      }
    }
  }

  // Find the actual time column (the one with time values)
  let timeColIdx = -1;
  for (let col = 0; col < Math.min(5, data[0]?.length || 0); col++) {
    for (let row = 0; row < Math.min(10, data.length); row++) {
      const cell = data[row]?.[col];
      if (cell && fmtTimeLabel(cell)) {
        timeColIdx = col;
        console.log(`Found time column at index ${timeColIdx} with time: ${fmtTimeLabel(cell)}`);
        break;
      }
    }
    if (timeColIdx >= 0) break;
  }

  // If we found timezone columns but no time column, the timezone columns might contain the time data
  if (timeColIdx === -1 && timezoneCols.length > 0) {
    console.log('No time column found, checking if timezone columns contain time data...');
    for (const tzCol of timezoneCols) {
      for (let row = 0; row < Math.min(10, data.length); row++) {
        const cell = data[row]?.[tzCol.colIdx];
        if (cell && fmtTimeLabel(cell)) {
          timeColIdx = tzCol.colIdx;
          console.log(`Found time data in timezone column ${tzCol.tz} at index ${timeColIdx} with time: ${fmtTimeLabel(cell)}`);
          break;
        }
      }
      if (timeColIdx >= 0) break;
    }
  }

  if (timeColIdx === -1) {
    issues.push('Could not find time column');
    return { timezoneBlocks, issues };
  }

  // Use the timezone columns we found, or scan for timezone headers
  let tzHeaders: Array<{ tz: string; colIdx: number }> = [];
  
  if (timezoneCols.length > 0) {
    // We found timezone columns directly
    // Create separate timezone blocks for each timezone column
    // Each timezone column should have its own time data
    for (const tzCol of timezoneCols) {
      // Check if this timezone column has time data - search more rows
      let hasTimeData = false;
      for (let row = 0; row < Math.min(20, data.length); row++) {
        const cell = data[row]?.[tzCol.colIdx];
        if (cell && fmtTimeLabel(cell)) {
          hasTimeData = true;
          console.log(`Found time data in timezone column ${tzCol.tz} at row ${row}: ${cell}`);
          break;
        }
      }
      
      if (hasTimeData) {
        tzHeaders.push({ tz: tzCol.tz, colIdx: tzCol.colIdx });
        console.log(`Using timezone column ${tzCol.tz} with time data at ${tzCol.colIdx}`);
      } else {
        // Check if this timezone column is associated with the main time column
        // This handles cases where WAT/CAT are headers but time data is in a separate column
        console.log(`No time data found in timezone column ${tzCol.tz} at ${tzCol.colIdx}, checking if it's a header for the main time column`);
        if (timeColIdx >= 0) {
          tzHeaders.push({ tz: tzCol.tz, colIdx: timeColIdx });
          console.log(`Using timezone column ${tzCol.tz} as header for main time column ${timeColIdx}`);
        } else {
          console.log(`Skipping timezone column ${tzCol.tz} at ${tzCol.colIdx} - no time data and no main time column`);
        }
      }
    }
    console.log('Using found timezone columns:', tzHeaders);
  } else {
    // Scan first 10 rows to find timezone headers
    console.log('Scanning for timezone headers...');
    console.log('Data preview (first 10 rows, first 10 cols):', data.slice(0, 10).map(row => row.slice(0, 10)));
    
    for (let row = 0; row < Math.min(10, data.length); row++) {
      for (let col = timeColIdx + 1; col < data[row].length; col++) {
        const cell = String(data[row][col] || '').toUpperCase();
        console.log(`Row ${row}, Col ${col}: "${cell}"`);
        if (cell.includes('WAT') || cell.includes('CAT') || cell.includes('EAT')) {
          let tz = 'WAT';
          if (cell.includes('CAT')) tz = 'CAT';
          else if (cell.includes('EAT')) tz = 'EAT';
          
          console.log(`Found timezone: ${tz} at row ${row}, col ${col}`);
          // Check if not already found
          if (!tzHeaders.find(h => h.tz === tz && Math.abs(h.colIdx - col) < 3)) {
            tzHeaders.push({ tz, colIdx: col });
          }
        }
      }
    }
  }

  // If no timezone headers found in cells, look for them as direct column headers
  // This handles the case where WAT/CAT are directly above time values
  if (tzHeaders.length === 0) {
    console.log('No timezone headers found in first scan, trying alternative detection...');
    for (let col = timeColIdx + 1; col < Math.min(data[0]?.length || 0, timeColIdx + 20); col++) {
      // Check if this column has timezone-like structure
      let hasTimeValues = false;
      let tzName = '';
      
      // Look for timezone name in first few rows
      for (let row = 0; row < Math.min(5, data.length); row++) {
        const cell = String(data[row][col] || '').toUpperCase();
        console.log(`Alt scan - Row ${row}, Col ${col}: "${cell}"`);
        if (cell === 'WAT' || cell === 'CAT' || cell === 'EAT') {
          tzName = cell;
          console.log(`Found timezone in alt scan: ${tzName} at row ${row}, col ${col}`);
          break;
        }
      }
      
      // Check if this column has time values (indicating it's a timezone block)
      for (let row = 1; row < Math.min(10, data.length); row++) {
        const cell = data[row]?.[col];
        if (cell && fmtTimeLabel(cell)) {
          hasTimeValues = true;
          console.log(`Found time value in col ${col}, row ${row}: ${cell}`);
          break;
        }
      }
      
      if (tzName && hasTimeValues) {
        console.log(`Adding timezone header: ${tzName} at col ${col}`);
        tzHeaders.push({ tz: tzName, colIdx: col });
      }
    }
  }

  if (tzHeaders.length === 0) {
    // If we found timezone columns but no timezone headers, create them from the timezone columns
    if (timezoneCols.length > 0) {
      console.log('No timezone headers found, creating from timezone columns...');
      for (const tzCol of timezoneCols) {
        // Check if this timezone column has time data - search more rows
        let hasTimeData = false;
        for (let row = 0; row < Math.min(20, data.length); row++) {
          const cell = data[row]?.[tzCol.colIdx];
          if (cell && fmtTimeLabel(cell)) {
            hasTimeData = true;
            console.log(`Found time data in timezone column ${tzCol.tz} at row ${row}: ${cell}`);
            break;
          }
        }
        
        if (hasTimeData) {
          tzHeaders.push({ tz: tzCol.tz, colIdx: tzCol.colIdx });
          console.log(`Creating timezone header: ${tzCol.tz} using time column ${tzCol.colIdx}`);
        } else {
          // Fallback to the main time column if no time data in timezone column
          if (timeColIdx >= 0) {
            tzHeaders.push({ tz: tzCol.tz, colIdx: timeColIdx });
            console.log(`Creating timezone header: ${tzCol.tz} using main time column ${timeColIdx}`);
          } else {
            console.log(`Skipping timezone column ${tzCol.tz} - no time data and no main time column`);
          }
        }
      }
    } else {
      issues.push('No timezone headers (WAT/CAT/EAT) found');
      return { timezoneBlocks, issues };
    }
  }

  // Sort by column index
  tzHeaders.sort((a, b) => a.colIdx - b.colIdx);

  // For each timezone, find day headers
  for (const tzHeader of tzHeaders) {
    const days: Array<{ weekday: string | null; iso: string | null; colIdx: number }> = [];
    
    // Look for day headers in the columns after the timezone columns
    // Start from the column after the last timezone column
    const startCol = Math.max(...tzHeaders.map(tz => tz.colIdx)) + 1;
    console.log(`Looking for day headers starting from column ${startCol}, total columns: ${data[0]?.length || 0}`);
    
    // Scan ALL columns to find day headers - capture all weeks in the file
    for (let col = startCol; col < (data[0]?.length || 0); col++) {
      // Check if this column has day/date headers
      let foundDay = false;
      
      // Look for day headers in the first few rows
      let foundWeekday = null;
      let foundDate = null;
      
      for (let row = 0; row < Math.min(5, data.length); row++) {
        const cell = String(data[row]?.[col] || '');
        const weekday = extractWeekday(cell);
        const iso = parseDateFromHeader(cell);
        
        if (weekday) {
          foundWeekday = weekday;
        }
        if (iso) {
          foundDate = iso;
        }
      }
      
      // If we found either a weekday or date in this column, add it
      if (foundWeekday || foundDate) {
        days.push({ 
          weekday: foundWeekday, 
          iso: foundDate, 
          colIdx: col 
        });
        foundDay = true;
        console.log(`Found day header at col ${col}: weekday: ${foundWeekday}, date: ${foundDate}`);
      }
      
      // If no day header found, check if it's a program column
      if (!foundDay) {
        let hasProgramContent = false;
        for (let row = 2; row < Math.min(20, data.length); row++) {
          const cell = String(data[row]?.[col] || '').trim();
          if (cell && cell !== '' && cell !== '—' && cell !== '-' && !fmtTimeLabel(cell)) {
            hasProgramContent = true;
            break;
          }
        }
        
        if (hasProgramContent) {
          // Try to infer the day based on position and previous days
          // This supports multiple weeks by wrapping around after Sunday
          const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          let inferredWeekday = null;
          
          if (days.length > 0) {
            const lastDay = days[days.length - 1];
            const lastWeekday = lastDay.weekday;
            const lastIdx = weekdayOrder.indexOf(lastWeekday || '');
            if (lastIdx >= 0) {
              // Wrap around to next day (after Sun comes Mon for week 2)
              const nextIdx = (lastIdx + 1) % weekdayOrder.length;
              inferredWeekday = weekdayOrder[nextIdx];
            }
          } else {
            // First day, assume Monday
            inferredWeekday = 'Mon';
          }
          
          if (inferredWeekday) {
            days.push({ 
              weekday: inferredWeekday, 
              iso: null, 
              colIdx: col 
            });
            console.log(`Inferred day header at col ${col}: ${inferredWeekday} (based on program content)`);
          } else {
            console.log(`Skipping column ${col} - has program content but can't infer day`);
          }
        }
      }
    }

    console.log(`==========================================`);
    console.log(`Processing timezone: ${tzHeader.tz}`);
    console.log(`Total day columns found: ${days.length}`);
    console.log(`Day columns:`, days.map(d => `Col ${d.colIdx}: ${d.weekday || '?'} (${d.iso || 'no date'})`));
    console.log(`==========================================`);

    // Build time labels from the sheet's time column (preserve chronological order)
    // Include ALL times from the time column, not just those with program content
    // The program content check will be done later in analyzeShowDurations
    const timeLabels: string[] = [];
    for (let row = 0; row < data.length; row++) {
      const timeCell = data[row]?.[tzHeader.colIdx];
      const formattedTime = fmtTimeLabel(timeCell);
      if (formattedTime) {
        timeLabels.push(formattedTime);
        console.log(`Found time for ${tzHeader.tz}: ${formattedTime} at row ${row}`);
      }
    }
    console.log(`Time labels for ${tzHeader.tz}:`, timeLabels);
    console.log(`First time label: ${timeLabels[0]}, Last time label: ${timeLabels[timeLabels.length - 1]}`);
    console.log(`First 5 time labels:`, timeLabels.slice(0, 5));

    // Determine time slot duration by analyzing the time differences
    const timeSlotDuration = determineTimeSlotDuration(timeLabels);
    console.log(`Detected time slot duration for ${tzHeader.tz}: ${timeSlotDuration} minutes`);

    if (timeLabels.length === 0) {
      issues.push(`No time data found for ${tzHeader.tz}`);
      continue;
    }

    console.log(`Found ${timeLabels.length} time labels for ${tzHeader.tz}:`, timeLabels.slice(0, 5));

    // Extract program cells for each day
    const dayColumns: DayColumn[] = [];
    
    // Preserve exact dates from source file
    console.log(`Days found for ${tzHeader.tz}:`, days);
    const preservedDates = preserveSourceDates(days);
    console.log(`Preserved dates for ${tzHeader.tz}:`, preservedDates);
    
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const iso = preservedDates[dayIdx] || day.iso || '';
      
      if (!iso) {
        issues.push(`Could not determine date for ${day.weekday} in ${tzHeader.tz}`);
        continue;
      }

      const cells: ProgramCell[] = [];

      // Analyze show durations by detecting Excel cell merges
      const showRuns = analyzeShowDurations(data, tzHeader.colIdx, day.colIdx, timeLabels, timeSlotDuration, worksheet);
      console.log(`Show runs for ${day.weekday} (${iso}):`, showRuns);
      
      // Convert show runs to program cells
      console.log(`Converting ${showRuns.length} show runs to program cells for ${day.weekday}`);
      showRuns.forEach((run, index) => {
        if (index < 3) {
          console.log(`Show run ${index}: time="${run.startTime}", endTime="${run.endTime}", text="${run.text}"`);
        }
        const programCell = {
          time: run.startTime,
          endTime: run.endTime,
          text: run.text,
          rowIndex: run.startRow,
        };
        console.log(`Creating program cell ${index}:`, programCell);
        cells.push(programCell);
      });
      console.log(`Created ${cells.length} program cells for ${day.weekday}`);
      console.log(`First 3 program cells:`, cells.slice(0, 3));

      dayColumns.push({
        weekday: day.weekday || '',
        iso,
        cells,
      });
    }

    timezoneBlocks.push({
      tz: tzHeader.tz,
      days: dayColumns,
    });
  }

  return { timezoneBlocks, issues };
}

