# FPC Converter - Usage Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## Expected Input Format

### Grid Format Structure

Your Excel file should have this structure:

```
| Time  | WAT                | Mon, Oct 6 | Tue, Oct 7 | ... | CAT                | Mon, Oct 6 | Tue, Oct 7 | ... |
|-------|-------------------|------------|------------|-----|-------------------|------------|------------|-----|
| 6:00  |                   | Show Name  | Show Name  | ... |                   | Show Name  | Show Name  | ... |
| 6:30  |                   | Show Name  | Show Name  | ... |                   | Show Name  | Show Name  | ... |
| 7:00  |                   | Different  | Different  | ... |                   | Different  | Different  | ... |
```

### Key Requirements

1. **Time Column**: First column should contain times (6:00, 6:30, 7:00, etc.)
2. **Timezone Headers**: Look for rows containing "WAT" or "CAT"
3. **Day Headers**: Under each timezone, 7 columns for Mon-Sun with dates
4. **Program Cells**: Show titles, which can include:
   - Season info: "Season S10", "S1", "Season 2"
   - Episode info: "Episode EP 36", "EP 20", "Episode 5"
   - Subtitles: "Show: Subtitle" or "Show (Subtitle)"

### Example Program Cell Formats

✅ **Supported formats**:
- `Twist of Fate: New Era\nSeason S10 • Episode EP 36`
- `Hidden Intentions S1 EP 20`
- `This Is Fate (Finale)`
- `Morning News`
- `Drama Series S2 Episode 15`

## Configuration Options

### Region
- Default: `ROA`
- Common values: `SA`, `ROA`, `EMEA`
- Applied to all output rows

### Timezone Order
- Default: `WAT,CAT`
- Determines sorting precedence when same date/time/title exists in multiple timezones
- WAT rows appear before CAT rows by default

### Colors
- **Text Color**: Default `#FFFFFF` (white)
- **BG Color**: Default `#1A1A1A` (dark gray)
- Use color picker or enter hex values manually

### Merge Contiguous 30-min Slots
- **Enabled (default)**: Adjacent 30-minute slots with the same show merge into single rows
- **Disabled**: Each 30-minute slot becomes a separate row

## Output Format

Each row contains 11 columns:

1. **Region**: Your configured region
2. **Date**: YYYY-MM-DD format (e.g., 2025-10-06)
3. **Start Time**: HH:MM format (e.g., 06:00)
4. **End Time**: HH:MM format (e.g., 06:30 or 07:00 if merged)
5. **Title**: Main show title
6. **Season**: Season number (blank if not found or only one of season/episode present)
7. **Episode**: Episode number (blank if not found or only one of season/episode present)
8. **Subtitle**: Additional show info
9. **Text Color**: Hex color code
10. **BG Color**: Hex color code
11. **Timezone**: WAT, CAT, etc.

## Export Options

### XLSX (Recommended)
- Full Excel format with proper data types
- Can be opened in Excel, Google Sheets, etc.
- Preserves all data accurately

### CSV
- Comma-separated values
- Universal compatibility
- Good for importing to databases or other tools

### JSON
- Structured data format
- Perfect for APIs or further processing
- Each row is an object with field names

## Parsing Examples

### Example 1: Title/Season/Episode Splitting

**Input**: `"Twist of Fate: New Era\nSeason S10 • Episode EP 36"`

**Output**:
- Title: `Twist of Fate`
- Season: `10`
- Episode: `36`
- Subtitle: `New Era`

### Example 2: 30-Minute Merging

**Input Grid**:
```
Time  | Mon
------|------------------
6:00  | Hidden Intentions
6:30  | Hidden Intentions
7:00  | News
```

**Output (with merging enabled)**:
- Row 1: Start=06:00, End=07:00, Title=Hidden Intentions
- Row 2: Start=07:00, End=07:30, Title=News

**Output (with merging disabled)**:
- Row 1: Start=06:00, End=06:30, Title=Hidden Intentions
- Row 2: Start=06:30, End=07:00, Title=Hidden Intentions
- Row 3: Start=07:00, End=07:30, Title=News

### Example 3: Timezone Precedence

If the same show appears at the same time in both WAT and CAT timezones, the output will list WAT first, then CAT (based on configured timezone order).

## Troubleshooting

### "No timezone headers found"
- Ensure your Excel has cells containing "WAT" or "CAT"
- Check that headers are in the first 10 rows

### "Could not find time column"
- Ensure the first column contains time values (6:00, 6:30, etc.)
- Times can be formatted as Date objects or strings

### Missing dates
- The app will attempt to infer dates from the week sequence
- Provide at least one valid date for best results

### Parsing issues
- Check the "Issues Detected" section for specific problems
- Review your Excel file structure

## Testing

Run acceptance tests to verify core functionality:

```bash
npx ts-node --project tsconfig.test.json test/acceptance-tests.ts
```

All tests should pass:
- Season/Episode splitting
- Time math and merging
- Show comparison logic
- Complex title parsing
- Edge cases

## Performance

- **Client-side processing**: All operations run in your browser
- **Privacy**: Files never leave your computer
- **Speed**: Handles files with thousands of rows efficiently
- **Multiple files**: Can process and combine multiple Excel files at once

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Tips

1. **Check preview before exporting**: Review the preview table to ensure data looks correct
2. **Use search**: Filter preview table to find specific shows or dates
3. **Multiple files**: Upload multiple weekly schedules to combine them
4. **Save configurations**: Browser may remember your settings between sessions
5. **Accessibility**: All form controls are keyboard-accessible

## Support

For issues or questions:
1. Check this guide first
2. Review the "Issues Detected" section in the app
3. Run the acceptance tests to verify functionality
4. Check browser console for detailed error messages

