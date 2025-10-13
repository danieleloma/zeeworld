/**
 * Acceptance tests to verify core functionality
 * Run this with: npx ts-node test/acceptance-tests.ts
 */

import { parseProgramCell } from '../lib/textParsing';
import { sameShow, addMinutes, fmtTimeLabel } from '../lib/timeMath';

console.log('🧪 Running Acceptance Tests...\n');

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, actual?: any, expected?: any) {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (actual !== undefined && expected !== undefined) {
      console.log(`   Expected:`, expected);
      console.log(`   Actual:`, actual);
    }
    failed++;
  }
}

// Test 1: Season/Episode Split
console.log('--- Test 1: Season/Episode Split ---\n');

const test1a = parseProgramCell("Twist of Fate: New Era\nSeason S10 • Episode EP 36");
test('1a: Title extraction', test1a.title === 'Twist of Fate', test1a.title, 'Twist of Fate');
test('1a: Season extraction', test1a.season === '10', test1a.season, '10');
test('1a: Episode extraction', test1a.episode === '36', test1a.episode, '36');
test('1a: Subtitle extraction', test1a.subtitle === 'New Era', test1a.subtitle, 'New Era');

const test1b = parseProgramCell("Hidden Intentions S1 EP 20");
test('1b: Title extraction', test1b.title === 'Hidden Intentions', test1b.title, 'Hidden Intentions');
test('1b: Season extraction', test1b.season === '1', test1b.season, '1');
test('1b: Episode extraction', test1b.episode === '20', test1b.episode, '20');

const test1c = parseProgramCell("This Is Fate S1");
test('1c: Only season present - both should be empty', test1c.season === undefined && test1c.episode === undefined);

const test1d = parseProgramCell("This Is Fate EP 5");
test('1d: Only episode present - both should be empty', test1d.season === undefined && test1d.episode === undefined);

const test1e = parseProgramCell("This Is Fate (Finale)");
test('1e: Parenthetical subtitle', test1e.subtitle === 'Finale', test1e.subtitle, 'Finale');
test('1e: Title without parenthetical', test1e.title === 'This Is Fate', test1e.title, 'This Is Fate');

console.log('\n--- Test 2: Time Math ---\n');

test('2a: Add 30 minutes', addMinutes('06:00', 30) === '06:30');
test('2b: Add 60 minutes', addMinutes('06:00', 60) === '07:00');
test('2c: Add 90 minutes', addMinutes('06:00', 90) === '07:30');
test('2d: Cross midnight', addMinutes('23:30', 60) === '00:30');

test('2e: Format Date object', fmtTimeLabel(new Date(2025, 0, 1, 6, 30)) === '06:30');
test('2f: Format time string', fmtTimeLabel('6:00') === '06:00');
test('2g: Format time string with AM', fmtTimeLabel('6:00 AM') === '06:00');
test('2h: Format time string with PM', fmtTimeLabel('6:00 PM') === '18:00');

console.log('\n--- Test 3: Show Comparison ---\n');

test('3a: Same show (exact match)', sameShow('Hidden Intentions', 'Hidden Intentions'));
test('3b: Same show (case insensitive)', sameShow('HIDDEN INTENTIONS', 'hidden intentions'));
test('3c: Same show (with season/episode)', sameShow('Hidden Intentions S1 EP 20', 'Hidden Intentions S1 EP 21'));
test('3d: Different shows', !sameShow('Hidden Intentions', 'Twist of Fate'));
test('3e: Empty comparison', !sameShow('', ''));
test('3f: Null comparison', !sameShow(null, 'Something'));

console.log('\n--- Test 4: Complex Title Parsing ---\n');

const test4a = parseProgramCell("Zee World: The Best of Drama\nSeason 2 Episode 15");
test('4a: Title with colon and subtitle', test4a.title === 'Zee World', test4a.title, 'Zee World');
test('4a: Subtitle after colon', test4a.subtitle === 'The Best of Drama', test4a.subtitle, 'The Best of Drama');
test('4a: Season', test4a.season === '2', test4a.season, '2');
test('4a: Episode', test4a.episode === '15', test4a.episode, '15');

const test4b = parseProgramCell("Morning Show • Season S5 • Episode EP 100");
test('4b: Title with bullets', test4b.title === 'Morning Show', test4b.title, 'Morning Show');
test('4b: Season from S5', test4b.season === '5', test4b.season, '5');
test('4b: Episode from EP 100', test4b.episode === '100', test4b.episode, '100');

const test4c = parseProgramCell("News");
test('4c: Simple title', test4c.title === 'News', test4c.title, 'News');
test('4c: No season', test4c.season === undefined);
test('4c: No episode', test4c.episode === undefined);
test('4c: No subtitle', test4c.subtitle === undefined);

console.log('\n--- Test 5: Edge Cases ---\n');

const test5a = parseProgramCell("");
test('5a: Empty string returns empty title', test5a.title === '');

const test5b = parseProgramCell("   ");
test('5b: Whitespace only returns empty title', test5b.title === '');

const test5c = parseProgramCell("Show Name\n\nS2\n\nEP 10");
test('5c: Multiple newlines handled', test5c.title === 'Show Name', test5c.title, 'Show Name');
test('5c: Season extracted', test5c.season === '2', test5c.season, '2');
test('5c: Episode extracted', test5c.episode === '10', test5c.episode, '10');

console.log('\n================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log('================================\n');

if (failed === 0) {
  console.log('🎉 All acceptance tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review.\n');
  process.exit(1);
}

