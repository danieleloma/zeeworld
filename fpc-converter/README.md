# FPC Grid → Row Converter

A web application to convert FPC grid-format Excel files (TV schedules with timezone blocks) into row-format data (XLSX/CSV/JSON).

## Features

- **Client-side processing** - All conversion happens in your browser for privacy
- **Grid format detection** - Automatically finds timezone headers (WAT/CAT) and day columns
- **Smart merging** - Contiguous 30-minute slots with the same show merge into single rows
- **Title parsing** - Extracts Title, Season, Episode, and Subtitle from mixed cell text
- **Multiple export formats** - Download as XLSX, CSV, or JSON
- **Flexible configuration** - Customize region, timezone order, colors, and merging behavior

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Configure settings** (optional):
   - Set Region (default: ROA)
   - Set Timezone Order (default: WAT,CAT)
   - Set Text and Background colors
   - Toggle 30-minute slot merging

2. **Upload Excel files**:
   - Drag & drop or click to select .xlsx/.xls files
   - Multiple files are supported (results will be combined)

3. **Preview results**:
   - View converted data in paginated table
   - Search and filter rows
   - Check for any parsing issues

4. **Export data**:
   - Download as XLSX, CSV, or JSON

## Input Format

The app expects Excel files in "grid format":

- **Column A**: Time labels (6:00, 6:30, 7:00, etc.)
- **Timezone headers**: Rows containing "WAT" or "CAT"
- **Day columns**: Under each timezone, 7 columns for Mon–Sun with dates
- **Program cells**: Show titles, potentially with season/episode info

## Output Format

Each row contains:
- Region
- Date (YYYY-MM-DD)
- Start Time (HH:MM)
- End Time (HH:MM)
- Title
- Season
- Episode
- Subtitle
- Text Color
- BG Color
- Timezone

## Technical Details

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **SheetJS (xlsx)** for Excel processing with `cellDates: true`
- No server-side processing - all operations run in the browser

## Parsing Rules

1. **Time format**: All times are read and output as HH:MM (24-hour) without conversion
2. **30-minute merging**: Adjacent slots with the same show (normalized) merge into single rows
3. **Season/Episode**: Both must be present, or both are omitted
4. **Timezone precedence**: When sorting, timezone order follows user configuration (WAT before CAT by default)
5. **Missing dates**: Inferred from week sequence when not explicitly present

## License

MIT

