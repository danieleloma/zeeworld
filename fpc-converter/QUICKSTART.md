# 🚀 FPC Converter - Quick Start

Get up and running in 2 minutes!

## Step 1: Install (30 seconds)

```bash
cd fpc-converter
npm install
```

## Step 2: Run (10 seconds)

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## Step 3: Upload & Convert (1 minute)

1. **Drag & drop** your Excel file (or click to browse)
2. **Preview** the converted data in the table
3. **Click "Download XLSX"** to get your row-format file

Done! 🎉

---

## What to Upload

Your Excel file should have:
- **Time column** (6:00, 6:30, 7:00, etc.) in column A
- **Timezone headers** with "WAT" and/or "CAT"
- **Day columns** under each timezone (Mon, Tue, Wed, etc.)
- **Program cells** with show names

Example structure:
```
| Time  | WAT | Mon, Oct 6  | Tue, Oct 7  | ... |
|-------|-----|-------------|-------------|-----|
| 6:00  |     | Show Name   | Show Name   | ... |
| 6:30  |     | Show Name   | Different   | ... |
```

## What You Get

11-column row format:
- Region, Date, Start Time, End Time, Title, Season, Episode, Subtitle, Text Color, BG Color, Timezone

## Optional Configuration

Before uploading, you can customize:
- **Region**: Default is `ROA`
- **Timezone Order**: Default is `WAT,CAT`
- **Colors**: Text `#FFFFFF`, BG `#1A1A1A`
- **Merge 30-min slots**: Enabled by default

## Export Formats

Click any button to download:
- **XLSX** - Excel format (recommended)
- **CSV** - Comma-separated values
- **JSON** - Structured data

## Verify Installation

Test that everything works:
```bash
npm run test
```

Should show:
```
🎉 All acceptance tests passed!
✅ Passed: 41
```

## Troubleshooting

### Build Issues
```bash
npm install --force
npm run build
```

### Can't Find Time Column
- Ensure column A has times like "6:00", "6:30", "7:00"
- Times can be Date objects or strings

### No Timezone Headers
- Add a row with "WAT" or "CAT" text
- Should be in first 10 rows of the sheet

### Wrong Output
- Check EXAMPLES.md for detailed scenarios
- Verify your Excel matches the grid format

## Need Help?

1. **USAGE_GUIDE.md** - Detailed instructions
2. **EXAMPLES.md** - 10 detailed examples
3. **PROJECT_SUMMARY.md** - Technical details

## Production Build

```bash
npm run build
npm start
```

Or deploy to Vercel:
```bash
npx vercel
```

---

**That's it!** You're ready to convert FPC grid files to row format. 🎯

