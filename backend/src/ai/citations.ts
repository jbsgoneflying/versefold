/**
 * Citation validation: every Bible reference returned by a model is verified
 * against the Scripture source before it reaches the app. Invalid references
 * are dropped; a response that loses ALL its references is rejected.
 */
import { isValidPassageId, passageExists } from "../scripture.js";

export interface CitationReport {
  valid: string[];
  dropped: string[];
}

/** Common non-OSIS book abbreviations models emit -> canonical OSIS codes. */
const BOOK_ALIASES: Record<string, string> = {
  GN: "GEN", EX: "EXO", LV: "LEV", NM: "NUM", DT: "DEU",
  JSH: "JOS", JDGS: "JDG", RTH: "RUT", PS: "PSA", PSS: "PSA", PRV: "PRO", PR: "PRO",
  EC: "ECC", SS: "SNG", SOS: "SNG", IS: "ISA", JR: "JER", EZE: "EZK", DN: "DAN",
  HO: "HOS", JL: "JOL", AM: "AMO", OB: "OBA", JNH: "JON", MC: "MIC", NA: "NAM", NAH: "NAM",
  HB: "HAB", ZP: "ZEP", HG: "HAG", ZC: "ZEC", ML: "MAL",
  MT: "MAT", MK: "MRK", MR: "MRK", LK: "LUK", LU: "LUK", JN: "JHN", JO: "JHN",
  AC: "ACT", RM: "ROM", RO: "ROM", GA: "GAL", EP: "EPH", PHI: "PHP", CO: "COL",
  TI: "TIT", PHM: "PHM", HE: "HEB", JA: "JAS", JM: "JAS", JD: "JUD", RE: "REV", RV: "REV",
  "1COR": "1CO", "2COR": "2CO", "1TIM": "1TI", "2TIM": "2TI", "1PET": "1PE", "2PET": "2PE",
  "1THS": "1TH", "2THS": "2TH", MATT: "MAT", PROV: "PRO", ECCL: "ECC", DEUT: "DEU",
  JOSH: "JOS", JUDG: "JDG", NEHE: "NEH", ESTH: "EST", ISAI: "ISA", JERE: "JER",
  EZEK: "EZK", ZECH: "ZEC", ROMS: "ROM", GALA: "GAL", EPHE: "EPH", COLO: "COL",
  HEBR: "HEB", JAME: "JAS", REVE: "REV",
};

/** Full English book names -> OSIS codes (for prose-style refs like "Luke 15:11-32"). */
const BOOK_NAMES: Record<string, string> = {
  GENESIS: "GEN", EXODUS: "EXO", LEVITICUS: "LEV", NUMBERS: "NUM", DEUTERONOMY: "DEU",
  JOSHUA: "JOS", JUDGES: "JDG", RUTH: "RUT", "1SAMUEL": "1SA", "2SAMUEL": "2SA",
  "1KINGS": "1KI", "2KINGS": "2KI", "1CHRONICLES": "1CH", "2CHRONICLES": "2CH",
  EZRA: "EZR", NEHEMIAH: "NEH", ESTHER: "EST", JOB: "JOB", PSALM: "PSA", PSALMS: "PSA",
  PROVERBS: "PRO", ECCLESIASTES: "ECC", "SONGOFSOLOMON": "SNG", "SONGOFSONGS": "SNG",
  ISAIAH: "ISA", JEREMIAH: "JER", LAMENTATIONS: "LAM", EZEKIEL: "EZK", DANIEL: "DAN",
  HOSEA: "HOS", JOEL: "JOL", AMOS: "AMO", OBADIAH: "OBA", JONAH: "JON", MICAH: "MIC",
  NAHUM: "NAM", HABAKKUK: "HAB", ZEPHANIAH: "ZEP", HAGGAI: "HAG", ZECHARIAH: "ZEC",
  MALACHI: "MAL", MATTHEW: "MAT", MARK: "MRK", LUKE: "LUK", JOHN: "JHN", ACTS: "ACT",
  ROMANS: "ROM", "1CORINTHIANS": "1CO", "2CORINTHIANS": "2CO", GALATIANS: "GAL",
  EPHESIANS: "EPH", PHILIPPIANS: "PHP", COLOSSIANS: "COL", "1THESSALONIANS": "1TH",
  "2THESSALONIANS": "2TH", "1TIMOTHY": "1TI", "2TIMOTHY": "2TI", TITUS: "TIT",
  PHILEMON: "PHM", HEBREWS: "HEB", JAMES: "JAS", "1PETER": "1PE", "2PETER": "2PE",
  "1JOHN": "1JN", "2JOHN": "2JN", "3JOHN": "3JN", JUDE: "JUD", REVELATION: "REV",
};

function canonicalBook(code: string): string {
  return BOOK_ALIASES[code] ?? BOOK_NAMES[code] ?? code;
}

/** "Luke 15:11-32" / "1 Corinthians 8:1" / "John 3:16" -> OSIS, or null. */
function parseProseReference(raw: string): string | null {
  const m = raw
    .trim()
    .toUpperCase()
    .replace(/[\u2013\u2014]/g, "-")
    .match(/^([1-3]?\s?[A-Z]+(?:\s+OF\s+[A-Z]+)?)\s+(\d{1,3})(?::(\d{1,3}))?(?:-(\d{1,3})(?::(\d{1,3}))?)?$/);
  if (!m) return null;
  const book = canonicalBook(m[1].replace(/\s+/g, ""));
  if (book.length > 3) return null; // unknown book name
  const [, , chapter, verse, endA, endB] = m;
  if (!verse) return endA ? null : `${book}.${chapter}`; // whole chapter
  const start = `${book}.${chapter}.${verse}`;
  if (!endA) return start;
  // "15:11-32" (endA=verse) vs "15:11-16:3" (endA=chapter, endB=verse)
  return endB ? `${start}-${book}.${endA}.${endB}` : `${start}-${book}.${chapter}.${endA}`;
}

/**
 * Normalize common model shorthand into full OSIS form:
 *   "psa.23.1-6"        -> "PSA.23.1-PSA.23.6"
 *   "PSA.23.1–PSA.23.6" -> "PSA.23.1-PSA.23.6" (en/em dashes)
 *   "PSA.23.1-23.6"     -> "PSA.23.1-PSA.23.6"
 *   "LK.15.11"          -> "LUK.15.11" (book-code aliases)
 */
export function normalizeReference(raw: string): string {
  let ref = raw.trim().toUpperCase().replace(/[\u2013\u2014]/g, "-");
  // Canonicalize book codes/names on every segment (LK -> LUK, ROMANS -> ROM).
  ref = ref.replace(/([1-3]?[A-Z]{2,14})(?=\.)/g, (code) => canonicalBook(code));
  // Collapse degenerate self-ranges: MAT.24.15-MAT.24.15 -> MAT.24.15
  const selfRange = ref.match(/^(.+)-(.+)$/);
  if (selfRange && selfRange[1] === selfRange[2]) ref = selfRange[1];
  const shorthand = ref.match(/^([1-3]?[A-Z]{2,3})\.(\d{1,3})\.(\d{1,3})-(\d{1,3})$/);
  if (shorthand) {
    const [, book, chapter, v1, v2] = shorthand;
    return `${book}.${chapter}.${v1}-${book}.${chapter}.${v2}`;
  }
  const chapterShorthand = ref.match(/^([1-3]?[A-Z]{2,3})\.(\d{1,3})\.(\d{1,3})-(\d{1,3})\.(\d{1,3})$/);
  if (chapterShorthand) {
    const [, book, c1, v1, c2, v2] = chapterShorthand;
    return `${book}.${c1}.${v1}-${book}.${c2}.${v2}`;
  }
  // Last resort: prose-style references ("Luke 15:11-32", "1 Corinthians 8:1").
  if (!isValidPassageId(ref)) {
    const prose = parseProseReference(raw);
    if (prose) return prose;
  }
  return ref;
}

export async function validateCitations(
  translationKey: string,
  references: string[],
  opts: { requireAtLeastOne?: boolean } = {}
): Promise<CitationReport> {
  const valid: string[] = [];
  const dropped: string[] = [];

  for (const raw of references) {
    const ref = normalizeReference(raw);
    if (!isValidPassageId(ref)) {
      dropped.push(raw);
      continue;
    }
    if (await passageExists(translationKey, ref)) valid.push(ref);
    else dropped.push(raw);
  }

  if (opts.requireAtLeastOne && references.length > 0 && valid.length === 0) {
    const err = new Error(
      "Model response contained no valid Scripture references after validation; response rejected."
    );
    (err as Error & { statusCode: number }).statusCode = 502;
    throw err;
  }

  return { valid, dropped };
}
