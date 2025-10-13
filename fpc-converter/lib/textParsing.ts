/**
 * Parse program cell text to extract title, season, episode, and subtitle
 */

export interface ParsedProgram {
  title: string;
  season?: string;
  episode?: string;
  subtitle?: string;
}

const SEASON_PATTS = [
  /\bSeason\s*S?(\d{1,3})\b/i,
  /\bS(?:eason)?\s*(\d{1,3})\b/i,
];
const EPISODE_PATTS = [
  /\bEpisode\s*(?:E|EP)?\s*(\d{1,4})\b/i,
  /\bEP\s*(\d{1,4})\b/i,
];

/**
 * Parse a program cell string into structured data with token-anchored parsing
 * 
 * Examples:
 * - "Twist of Fate: New Era\nSeason S10 • Episode EP 36" 
 *   → { title: "Twist of Fate", season: "10", episode: "36", subtitle: "New Era" }
 * - "Hidden Intentions S1 EP 20" 
 *   → { title: "Hidden Intentions", season: "1", episode: "20" }
 * - "This Is Fate (Finale)" 
 *   → { title: "This Is Fate", subtitle: "Finale" }
 */
export function parseProgramCell(raw: string): ParsedProgram {
  // Preserve original text; normalize only for parsing
  const original = raw ?? "";
  const flat = original.replace(/\s+/g, " ").trim();

  if (!flat) {
    return { title: '' };
  }

  // Title = text before the first season/episode token occurrence
  const firstTokenIdx = (() => {
    const idxs = [
      flat.search(/\bSeason\b/i),
      flat.search(/\bEpisode\b/i),
      flat.search(/\bS(?:eason)?\s*\d{1,3}\b/i),
      flat.search(/\bEP\s*\d{1,4}\b/i),
    ].filter(i => i >= 0);
    return idxs.length ? Math.min(...idxs) : -1;
  })();

  let titlePart = firstTokenIdx >= 0 ? flat.slice(0, firstTokenIdx).trim() : flat;
  
  // Clean up title - remove trailing separators and bullet points
  titlePart = titlePart.replace(/[-•·:]+$/, '').trim();

  // Optional subtitle: split on first ":" or trailing "(...)" after title
  let subtitle: string | undefined;
  const mParen = titlePart.match(/\(([^)]+)\)\s*$/);
  if (mParen) { 
    subtitle = mParen[1].trim(); 
    titlePart = titlePart.replace(/\([^)]+\)\s*$/, "").trim(); 
  }
  const colonIdx = titlePart.indexOf(":");
  if (colonIdx > -1) { 
    subtitle = (subtitle ?? titlePart.slice(colonIdx + 1).trim()); 
    titlePart = titlePart.slice(0, colonIdx).trim(); 
  }

  // Season/Episode strictly token-anchored
  const season = coalesceMatch(SEASON_PATTS, flat);
  const episode = coalesceMatch(EPISODE_PATTS, flat);

  // If only one of season/episode exists, omit both
  const out: ParsedProgram = { title: titlePart };
  if (season && episode) { 
    out.season = season; 
    out.episode = episode; 
  }
  if (subtitle) out.subtitle = subtitle;

  return out;
}

function coalesceMatch(patts: RegExp[], s: string): string | undefined {
  for (const p of patts) {
    const m = s.match(p);
    if (m?.[1]) return String(Number(m[1])); // normalize numeric string
  }
  return undefined;
}

