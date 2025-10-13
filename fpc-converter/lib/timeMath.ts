/**
 * Time utilities for working with HH:MM format times
 */

/**
 * Format a Date or string input to "HH:MM" 24-hour format
 */
export function fmtTimeLabel(input: Date | string | null | undefined): string | null {
  if (!input) return null;

  try {
    if (input instanceof Date) {
      const hours = input.getHours().toString().padStart(2, '0');
      const minutes = input.getMinutes().toString().padStart(2, '0');
      const result = `${hours}:${minutes}`;
      console.log(`fmtTimeLabel: Date input -> "${result}"`);
      return result;
    }

    // Handle string inputs
    const str = input.toString().trim();
    if (!str) return null;

    // Already in HH:MM:SS, HH:MM, or H:MM format
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(?:AM|PM))?$/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      
      // Handle AM/PM if present
      const ampm = str.match(/(AM|PM)/i);
      if (ampm) {
        if (ampm[0].toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        } else if (ampm[0].toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
      
      const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      console.log(`fmtTimeLabel: String input "${str}" -> "${result}"`);
      return result;
    }

    // Try parsing as a date string
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const hours = parsed.getHours().toString().padStart(2, '0');
      const minutes = parsed.getMinutes().toString().padStart(2, '0');
      const result = `${hours}:${minutes}`;
      console.log(`fmtTimeLabel: Date string "${str}" -> "${result}"`);
      return result;
    }

    console.log(`fmtTimeLabel: Could not parse "${str}"`);
    return null;
  } catch (e) {
    console.log(`fmtTimeLabel: Error parsing "${input}":`, e);
    return null;
  }
}

/**
 * Add minutes to a time in HH:MM format
 */
export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  const result = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  console.log(`addMinutes: "${time}" + ${minutes} minutes = "${result}"`);
  return result;
}

/**
 * Normalize a show name for comparison (lowercase, collapse spaces)
 * IMPORTANT: Keep episode/season numbers to distinguish different episodes
 */
function normalizeShow(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two show strings represent the EXACT same show (including episode)
 * This ensures shows with different episodes are NOT merged
 */
export function sameShow(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalizeShow(a) === normalizeShow(b);
}

/**
 * Check if a cell represents an empty/blank program slot
 */
export function isEmptySlot(text: string | null | undefined): boolean {
  if (!text) return true;
  const normalized = text.trim();
  return normalized === '' || normalized === '—' || normalized === '-' || normalized === '–';
}

