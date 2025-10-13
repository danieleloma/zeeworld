# FPC Converter - Examples

## Example 1: Basic Grid with WAT Timezone

### Input Excel Structure

```
|       | A     | B   | C          | D          | E          | F          | G          | H          | I          |
|-------|-------|-----|------------|------------|------------|------------|------------|------------|------------|
| 1     |       | WAT | Mon, Oct 6 | Tue, Oct 7 | Wed, Oct 8 | Thu, Oct 9 | Fri, Oct 10| Sat, Oct 11| Sun, Oct 12|
| 2     | Time  |     |            |            |            |            |            |            |            |
| 3     | 6:00  |     | News       | News       | News       | News       | News       | News       | News       |
| 4     | 6:30  |     | Morning    | Morning    | Morning    | Morning    | Morning    | Morning    | Morning    |
| 5     | 7:00  |     | Twist S1 EP 1 | Twist S1 EP 2 | Twist S1 EP 3 | Twist S1 EP 4 | Twist S1 EP 5 | Twist S1 EP 6 | Twist S1 EP 7 |
```

### Output (with merging enabled)

| Region | Date       | Start Time | End Time | Title   | Season | Episode | Subtitle | Text Color | BG Color | Timezone |
|--------|------------|------------|----------|---------|--------|---------|----------|------------|----------|----------|
| ROA    | 2025-10-06 | 06:00      | 06:30    | News    |        |         |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-06 | 06:30      | 07:00    | Morning |        |         |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-06 | 07:00      | 07:30    | Twist   | 1      | 1       |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-07 | 06:00      | 06:30    | News    |        |         |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-07 | 06:30      | 07:00    | Morning |        |         |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-07 | 07:00      | 07:30    | Twist   | 1      | 2       |          | #FFFFFF    | #1A1A1A  | WAT      |
| ...    | ...        | ...        | ...      | ...     | ...    | ...     | ...      | ...        | ...      | ...      |

## Example 2: Grid with Both WAT and CAT

### Input Excel Structure

```
|       | A     | B   | C          | D          | ... | H   | I          | J          | ... |
|-------|-------|-----|------------|------------|-----|-----|------------|------------|-----|
| 1     |       | WAT | Mon, Oct 6 | Tue, Oct 7 | ... | CAT | Mon, Oct 6 | Tue, Oct 7 | ... |
| 2     | Time  |     |            |            |     |     |            |            |     |
| 3     | 6:00  |     | Show A     | Show A     | ... |     | Show B     | Show B     | ... |
| 4     | 6:30  |     | Show A     | Show A     | ... |     | Show B     | Show B     | ... |
```

### Output (note timezone ordering: WAT before CAT)

| Region | Date       | Start Time | End Time | Title  | Season | Episode | Subtitle | Text Color | BG Color | Timezone |
|--------|------------|------------|----------|--------|--------|---------|----------|------------|----------|----------|
| ROA    | 2025-10-06 | 06:00      | 07:00    | Show A |        |         |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-06 | 06:00      | 07:00    | Show B |        |         |          | #FFFFFF    | #1A1A1A  | CAT      |
| ROA    | 2025-10-07 | 06:00      | 07:00    | Show A |        |         |          | #FFFFFF    | #1A1A1A  | WAT      |
| ROA    | 2025-10-07 | 06:00      | 07:00    | Show B |        |         |          | #FFFFFF    | #1A1A1A  | CAT      |

## Example 3: Complex Title Parsing

### Input

```
| Time  | Mon                                              |
|-------|--------------------------------------------------|
| 6:00  | Twist of Fate: New Era\nSeason S10 • Episode EP 36 |
| 6:30  | Hidden Intentions S1 EP 20                        |
| 7:00  | This Is Fate (Finale)                            |
| 7:30  | Morning News                                     |
| 8:00  | Drama Series S2                                  |
```

### Output

| Date       | Start Time | End Time | Title             | Season | Episode | Subtitle |
|------------|------------|----------|-------------------|--------|---------|----------|
| 2025-10-06 | 06:00      | 06:30    | Twist of Fate     | 10     | 36      | New Era  |
| 2025-10-06 | 06:30      | 07:00    | Hidden Intentions | 1      | 20      |          |
| 2025-10-06 | 07:00      | 07:30    | This Is Fate      |        |         | Finale   |
| 2025-10-06 | 07:30      | 08:00    | Morning News      |        |         |          |
| 2025-10-06 | 08:00      | 08:30    | Drama Series      |        |         |          |

**Note**: "Drama Series S2" has only season (no episode), so both season and episode are blank per spec.

## Example 4: 30-Minute Slot Merging

### Input (Contiguous Same Shows)

```
| Time  | Mon                |
|-------|--------------------|
| 6:00  | Hidden Intentions  |
| 6:30  | Hidden Intentions  |
| 7:00  | Hidden Intentions  |
| 7:30  | Different Show     |
| 8:00  | Another Show       |
| 8:30  | Another Show       |
```

### Output (with merging ENABLED)

| Start Time | End Time | Title             |
|------------|----------|-------------------|
| 06:00      | 07:30    | Hidden Intentions |
| 07:30      | 08:00    | Different Show    |
| 08:00      | 08:30    | Another Show      |

### Output (with merging DISABLED)

| Start Time | End Time | Title             |
|------------|----------|-------------------|
| 06:00      | 06:30    | Hidden Intentions |
| 06:30      | 07:00    | Hidden Intentions |
| 07:00      | 07:30    | Hidden Intentions |
| 07:30      | 08:00    | Different Show    |
| 08:00      | 08:30    | Another Show      |
| 08:30      | 09:00    | Another Show      |

## Example 5: Shows with Same Title but Different Episodes (No Merge)

### Input

```
| Time  | Mon                      |
|-------|--------------------------|
| 6:00  | Hidden Intentions S1 EP 1|
| 6:30  | Hidden Intentions S1 EP 2|
| 7:00  | Hidden Intentions S1 EP 3|
```

### Output (episodes differ, so NO merge even with merging enabled)

| Start Time | End Time | Title             | Season | Episode |
|------------|----------|-------------------|--------|---------|
| 06:00      | 06:30    | Hidden Intentions | 1      | 1       |
| 06:30      | 07:00    | Hidden Intentions | 1      | 2       |
| 07:00      | 07:30    | Hidden Intentions | 1      | 3       |

**Why**: The `sameShow()` function normalizes titles but considers the full text. Since "EP 1", "EP 2", "EP 3" are different, they don't merge.

## Example 6: Empty/Blank Slots

### Input

```
| Time  | Mon      |
|-------|----------|
| 6:00  | Show A   |
| 6:30  | —        |
| 7:00  |          |
| 7:30  | Show B   |
```

### Output

| Start Time | End Time | Title  |
|------------|----------|--------|
| 06:00      | 06:30    | Show A |
| 07:30      | 08:00    | Show B |

**Note**: Empty slots, dashes (—), and hyphens (-) are skipped.

## Example 7: Multiple Files Combined

### File 1: week1.xlsx
```
| Time  | Mon, Oct 6 |
|-------|------------|
| 6:00  | Show A     |
```

### File 2: week2.xlsx
```
| Time  | Mon, Oct 13 |
|-------|-------------|
| 6:00  | Show B      |
```

### Combined Output (after uploading both files)

| Date       | Start Time | End Time | Title  |
|------------|------------|----------|--------|
| 2025-10-06 | 06:00      | 06:30    | Show A |
| 2025-10-13 | 06:00      | 06:30    | Show B |

## Example 8: Custom Configuration

### Configuration
- Region: `SA`
- Timezone Order: `CAT,WAT` (reverse order)
- Text Color: `#000000`
- BG Color: `#FFFF00`

### Output

| Region | Date       | Start Time | End Time | Title  | Text Color | BG Color | Timezone |
|--------|------------|------------|----------|--------|------------|----------|----------|
| SA     | 2025-10-06 | 06:00      | 06:30    | News   | #000000    | #FFFF00  | CAT      |
| SA     | 2025-10-06 | 06:00      | 06:30    | Sports | #000000    | #FFFF00  | WAT      |

**Note**: CAT appears before WAT because timezone order is set to `CAT,WAT`.

## Example 9: Time Crossing Midnight

### Input

```
| Time  | Mon      |
|-------|----------|
| 23:00 | Late Show|
| 23:30 | Late Show|
| 0:00  | Late Show|
| 0:30  | News     |
```

### Output (with merging)

| Date       | Start Time | End Time | Title     |
|------------|------------|----------|-----------|
| 2025-10-06 | 23:00      | 00:30    | Late Show |
| 2025-10-07 | 00:30      | 01:00    | News      |

**Note**: Times wrap around midnight correctly (00:30 = 12:30 AM next day).

## Example 10: Date Inference

### Input (missing some dates)

```
|       | A     | B   | C          | D   | E          | F          | G          |
|-------|-------|-----|------------|-----|------------|------------|------------|
| 1     |       | WAT | Mon, Oct 6 | Tue | Wed        | Thu, Oct 9 | Fri        |
| 2     | Time  |     |            |     |            |            |            |
| 3     | 6:00  |     | Show       | Show| Show       | Show       | Show       |
```

### Output (dates inferred)

| Date       | Start Time | Title |
|------------|------------|-------|
| 2025-10-06 | 06:00      | Show  | ← Given
| 2025-10-07 | 06:00      | Show  | ← Inferred (Mon + 1 day)
| 2025-10-08 | 06:00      | Show  | ← Inferred (Mon + 2 days)
| 2025-10-09 | 06:00      | Show  | ← Given
| 2025-10-10 | 06:00      | Show  | ← Inferred (Thu + 1 day)

The parser infers missing dates based on:
1. Weekday sequence (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
2. Known anchor dates in the row
3. Sequential day offset calculation

