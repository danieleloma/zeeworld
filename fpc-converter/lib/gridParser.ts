/**
 * Parse grid-format Excel files into structured data
 * COMPLETELY REWRITTEN to ensure correct output
 */

import * as XLSX from 'xlsx';
import { fmtTimeLabel, isEmptySlot } from './timeMath';
import { ParsedGrid, TimezoneBlock, DayColumn, ProgramCell } from './types';

/**
 * Parse a date from various formats found in day headers
 */
function parseDateFromHeader(headerText: string, year?: number): string | null {
  if (!headerText) return null;

  const monthNames: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  const text = headerText.toLowerCase().trim();
  
  let month: number | null = null;
  let day: number | null = null;

  // Look for month name
  for (const [name, idx] of Object.entries(monthNames)) {
    if (text.includes(name)) {
      month = idx;
      break;
    }
  }

  // Look for day number
  const dayMatch = text.match(/\b(\d{1,2})\b/);
  if (dayMatch) {
    day = parseInt(dayMatch[1], 10);
  }
  
  // Handle formats like "29-Sep", "30-Sep", "1-Oct", "2-Oct"
  const dashFormatMatch = text.match(/(\d{1,2})-([a-z]{3})/);
  if (dashFormatMatch && !month) {
    day = parseInt(dashFormatMatch[1], 10);
    const monthAbbr = dashFormatMatch[2];
    const monthAbbrMap: { [key: string]: number } = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    if (monthAbbrMap[monthAbbr] !== undefined) {
      month = monthAbbrMap[monthAbbr];
    }
  }

  if (month !== null && day !== null) {
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
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * Add minutes to a time string
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const totalMinutes = timeToMinutes(timeStr);
  if (totalMinutes === null) return timeStr;
  
  const newTotalMinutes = (totalMinutes + minutes) % (24 * 60);
  const hours = Math.floor(newTotalMinutes / 60);
  const mins = newTotalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get cell merge information from Excel worksheet
 */
function getCellRowSpan(sheet: XLSX.WorkSheet, row: number, col: number): number {
  const merges = sheet['!merges'] || [];
  
  for (const merge of merges) {
    if (merge.s.r === row && merge.s.c === col) {
      return merge.e.r - merge.s.r + 1;
    }
  }
  
  return 1;
}

/**
 * Determine time slot duration by analyzing time differences
 */
function determineTimeSlotDuration(timeLabels: string[]): number {
  if (timeLabels.length < 2) return 30;

  const timeDiffs: number[] = [];
  
  for (let i = 1; i < timeLabels.length; i++) {
    const prevTime = timeLabels[i - 1];
    const currTime = timeLabels[i];
    
    const prevMinutes = timeToMinutes(prevTime);
    const currMinutes = timeToMinutes(currTime);
    
    if (prevMinutes !== null && currMinutes !== null) {
      let diff = currMinutes - prevMinutes;
      
      // Handle day rollover
      if (diff < 0) {
        diff += 24 * 60;
      }
      
      timeDiffs.push(diff);
    }
  }
  
  if (timeDiffs.length === 0) return 30;
  
  // Find the most common time difference
  const diffCounts: { [key: number]: number } = {};
  timeDiffs.forEach(diff => {
    diffCounts[diff] = (diffCounts[diff] || 0) + 1;
  });
  
  const mostCommonDiff = Object.keys(diffCounts).reduce((a, b) => 
    diffCounts[parseInt(a)] > diffCounts[parseInt(b)] ? a : b
  );
  
  return parseInt(mostCommonDiff);
}

/**
 * Preserve exact dates from source file
 */
function preserveSourceDates(days: Array<{ weekday: string | null; iso: string | null }>): string[] {
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result: string[] = [];

  // Find first valid date as anchor
  let anchorDate: Date | null = null;
  let anchorIndex = -1;

  for (let i = 0; i < days.length; i++) {
    if (days[i].iso) {
      anchorDate = new Date(days[i].iso!);
      anchorIndex = i;
      break;
    }
  }

  // Process each day
  for (let i = 0; i < days.length; i++) {
    if (days[i].iso) {
      result.push(days[i].iso!);
    } else if (days[i].weekday && anchorDate) {
      const weekdayIdx = weekdayOrder.indexOf(days[i].weekday!);
      if (weekdayIdx >= 0) {
        const offset = i - anchorIndex;
        const date = new Date(anchorDate);
        date.setDate(anchorDate.getDate() + offset);
        const yyyy = date.getFullYear();
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        result.push(`${yyyy}-${mm}-${dd}`);
      } else {
        result.push('');
      }
    } else {
      result.push('');
    }
  }

  return result;
}

/**
 * Parse an Excel workbook in grid format - COMPLETELY REWRITTEN
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

  console.log('=== PARSING EXCEL FILE ===');
  console.log('Data dimensions:', data.length, 'rows x', data[0]?.length || 0, 'columns');

  // STEP 1: Find timezone columns (WAT, CAT, EAT)
  const timezoneCols: Array<{ tz: string; colIdx: number }> = [];
  
  // Look in first 5 columns for timezone headers
  for (let col = 0; col < Math.min(5, data[0]?.length || 0); col++) {
    for (let row = 0; row < Math.min(10, data.length); row++) {
      const cell = String(data[row]?.[col] || '').toUpperCase().trim();
      if (cell === 'WAT' || cell === 'CAT' || cell === 'EAT') {
        timezoneCols.push({ tz: cell, colIdx: col });
        console.log(`Found timezone: ${cell} at column ${col}, row ${row}`);
        break;
      }
    }
  }

  console.log('Found timezone columns:', timezoneCols);

  if (timezoneCols.length === 0) {
    issues.push('No timezone columns (WAT/CAT/EAT) found');
    return { timezoneBlocks, issues };
  }

  console.log('Found timezone columns:', timezoneCols);

  // STEP 2: For each timezone, find the time column and day columns
  for (const tzCol of timezoneCols) {
    console.log(`\n=== PROCESSING TIMEZONE: ${tzCol.tz} ===`);

    // Find time column for this timezone
    let timeColIdx = tzCol.colIdx;
    let hasTimeData = false;

    // Check if the timezone column itself has time data
    for (let row = 0; row < Math.min(20, data.length); row++) {
      const cell = data[row]?.[tzCol.colIdx];
      if (cell && fmtTimeLabel(cell)) {
        hasTimeData = true;
        console.log(`Found time data in timezone column ${tzCol.tz} at row ${row}: ${cell}`);
        break;
      }
    }

    // If no time data in timezone column, look for a separate time column
    if (!hasTimeData) {
      for (let col = 0; col < Math.min(5, data[0]?.length || 0); col++) {
        for (let row = 0; row < Math.min(20, data.length); row++) {
          const cell = data[row]?.[col];
          if (cell && fmtTimeLabel(cell)) {
            timeColIdx = col;
            hasTimeData = true;
            console.log(`Found time column at ${col} for timezone ${tzCol.tz}`);
            break;
          }
        }
        if (hasTimeData) break;
      }
    }

    if (!hasTimeData) {
      console.log(`No time data found for timezone ${tzCol.tz}`);
      continue;
    }

    // STEP 3: Extract all time labels from the time column
    const timeLabels: string[] = [];
    for (let row = 0; row < data.length; row++) {
      const timeCell = data[row]?.[timeColIdx];
      const formattedTime = fmtTimeLabel(timeCell);
      if (formattedTime) {
        timeLabels.push(formattedTime);
      }
    }

    console.log(`Time labels for ${tzCol.tz}:`, timeLabels.slice(0, 10), '...');
    console.log(`First time: ${timeLabels[0]}, Last time: ${timeLabels[timeLabels.length - 1]}`);

    if (timeLabels.length === 0) {
      issues.push(`No time data found for ${tzCol.tz}`);
      continue;
    }

    // STEP 4: Determine time slot duration
    const timeSlotDuration = determineTimeSlotDuration(timeLabels);
    console.log(`Time slot duration: ${timeSlotDuration} minutes`);

    // STEP 5: Find day columns
    const days: Array<{ weekday: string | null; iso: string | null; colIdx: number }> = [];
    
    // Start looking for day columns after the timezone columns
    // Based on the file structure, day columns start from column 2
    const startCol = Math.max(...timezoneCols.map(tz => tz.colIdx)) + 1;
    console.log(`Looking for day columns starting from column ${startCol}`);
    
    for (let col = startCol; col < (data[0]?.length || 0); col++) {
      let foundWeekday = null;
      let foundDate = null;
      
      // Look for day/date headers in first few rows
      // Based on the file structure: row 1 has weekdays, row 2 has dates
      for (let row = 0; row < Math.min(5, data.length); row++) {
        const cell = String(data[row]?.[col] || '');
        const weekday = extractWeekday(cell);
        const iso = parseDateFromHeader(cell);
        
        if (weekday) foundWeekday = weekday;
        if (iso) foundDate = iso;
      }
      
      // If we found day info, add it
      if (foundWeekday || foundDate) {
        days.push({ weekday: foundWeekday, iso: foundDate, colIdx: col });
        console.log(`Found day at col ${col}: ${foundWeekday} (${foundDate})`);
      } else {
        // Check if this column has program content (infer day)
        let hasProgramContent = false;
        for (let row = 3; row < Math.min(20, data.length); row++) { // Start from row 3 where shows begin
          const cell = String(data[row]?.[col] || '').trim();
          if (cell && cell !== '' && cell !== '—' && cell !== '-' && !fmtTimeLabel(cell)) {
            hasProgramContent = true;
            break;
          }
        }
        
        if (hasProgramContent) {
          // Infer day based on position
          const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          let inferredWeekday = null;
          
          if (days.length > 0) {
            const lastDay = days[days.length - 1];
            const lastWeekday = lastDay.weekday;
            const lastIdx = weekdayOrder.indexOf(lastWeekday || '');
            if (lastIdx >= 0) {
              const nextIdx = (lastIdx + 1) % weekdayOrder.length;
              inferredWeekday = weekdayOrder[nextIdx];
            }
          } else {
            inferredWeekday = 'Mon';
          }
          
          if (inferredWeekday) {
            days.push({ weekday: inferredWeekday, iso: null, colIdx: col });
            console.log(`Inferred day at col ${col}: ${inferredWeekday}`);
          }
        }
      }
    }

    console.log(`Found ${days.length} day columns for ${tzCol.tz}`);

    // STEP 6: Preserve dates
    const preservedDates = preserveSourceDates(days);
    console.log('Preserved dates:', preservedDates);

    // STEP 7: Extract program cells for each day
    const dayColumns: DayColumn[] = [];
    
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const iso = preservedDates[dayIdx] || day.iso || '';
      
      if (!iso) {
        issues.push(`Could not determine date for ${day.weekday} in ${tzCol.tz}`);
        continue;
      }

      console.log(`\nProcessing day: ${day.weekday} (${iso}) at column ${day.colIdx}`);

      const cells: ProgramCell[] = [];
      const processedRows = new Set<number>();

      // Process each row in the time column
      for (let row = 0; row < data.length; row++) {
        if (processedRows.has(row)) continue;

        const timeCell = data[row]?.[timeColIdx];
        const formattedTime = fmtTimeLabel(timeCell);
        
        if (formattedTime) {
          const programCell = String(data[row]?.[day.colIdx] || '').trim();
          
          // Skip empty slots
          if (!programCell || programCell === '' || programCell === '—' || programCell === '-') {
            processedRows.add(row);
            continue;
          }

          // Get row span from Excel merge information
          const rowSpan = getCellRowSpan(worksheet, row, day.colIdx);
          
          // Mark all rows in the span as processed
          for (let i = 0; i < rowSpan; i++) {
            processedRows.add(row + i);
          }

          const duration = rowSpan * timeSlotDuration;
          const endTime = addMinutesToTime(formattedTime, duration);

          const cell: ProgramCell = {
            time: formattedTime,
            endTime: endTime,
            text: programCell,
            rowIndex: row,
          };

          cells.push(cell);
          
          console.log(`Show: "${programCell}" at ${formattedTime}-${endTime} (${duration}min, spans ${rowSpan} rows)`);
        }
      }

      console.log(`Created ${cells.length} program cells for ${day.weekday}`);

      dayColumns.push({
        weekday: day.weekday || '',
        iso,
        cells,
      });
    }

    timezoneBlocks.push({
      tz: tzCol.tz,
      days: dayColumns,
    });
  }

  console.log('\n=== PARSING COMPLETE ===');
  console.log(`Created ${timezoneBlocks.length} timezone blocks`);
  timezoneBlocks.forEach(block => {
    console.log(`${block.tz}: ${block.days.length} days, ${block.days.reduce((sum, day) => sum + day.cells.length, 0)} total shows`);
  });

  return { timezoneBlocks, issues };
}