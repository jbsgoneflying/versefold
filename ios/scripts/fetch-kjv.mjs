#!/usr/bin/env node
/**
 * Builds the bundled public-domain KJV for offline reading.
 * Source: github.com/aruljohn/Bible-kjv (public-domain KJV text).
 * Output: ios/Versefold/Resources/kjv/<OSIS>.json  +  index.json
 *
 * KJV is public domain; bundling is permitted by the rights policy
 * (backend/config/translations.json -> kjv.rights.offlineStorage = true).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BOOKS = [
  ["GEN", "Genesis"], ["EXO", "Exodus"], ["LEV", "Leviticus"], ["NUM", "Numbers"], ["DEU", "Deuteronomy"],
  ["JOS", "Joshua"], ["JDG", "Judges"], ["RUT", "Ruth"], ["1SA", "1Samuel"], ["2SA", "2Samuel"],
  ["1KI", "1Kings"], ["2KI", "2Kings"], ["1CH", "1Chronicles"], ["2CH", "2Chronicles"], ["EZR", "Ezra"],
  ["NEH", "Nehemiah"], ["EST", "Esther"], ["JOB", "Job"], ["PSA", "Psalms"], ["PRO", "Proverbs"],
  ["ECC", "Ecclesiastes"], ["SNG", "SongofSolomon"], ["ISA", "Isaiah"], ["JER", "Jeremiah"],
  ["LAM", "Lamentations"], ["EZK", "Ezekiel"], ["DAN", "Daniel"], ["HOS", "Hosea"], ["JOL", "Joel"],
  ["AMO", "Amos"], ["OBA", "Obadiah"], ["JON", "Jonah"], ["MIC", "Micah"], ["NAM", "Nahum"],
  ["HAB", "Habakkuk"], ["ZEP", "Zephaniah"], ["HAG", "Haggai"], ["ZEC", "Zechariah"], ["MAL", "Malachi"],
  ["MAT", "Matthew"], ["MRK", "Mark"], ["LUK", "Luke"], ["JHN", "John"], ["ACT", "Acts"],
  ["ROM", "Romans"], ["1CO", "1Corinthians"], ["2CO", "2Corinthians"], ["GAL", "Galatians"],
  ["EPH", "Ephesians"], ["PHP", "Philippians"], ["COL", "Colossians"], ["1TH", "1Thessalonians"],
  ["2TH", "2Thessalonians"], ["1TI", "1Timothy"], ["2TI", "2Timothy"], ["TIT", "Titus"],
  ["PHM", "Philemon"], ["HEB", "Hebrews"], ["JAS", "James"], ["1PE", "1Peter"], ["2PE", "2Peter"],
  ["1JN", "1John"], ["2JN", "2John"], ["3JN", "3John"], ["JUD", "Jude"], ["REV", "Revelation"],
];

const DISPLAY_NAMES = {
  "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Kings", "2KI": "2 Kings",
  "1CH": "1 Chronicles", "2CH": "2 Chronicles", SNG: "Song of Solomon",
  "1CO": "1 Corinthians", "2CO": "2 Corinthians", "1TH": "1 Thessalonians",
  "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
  "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John",
};

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../Versefold/Resources/kjv");
mkdirSync(outDir, { recursive: true });

const index = [];
for (const [osis, file] of BOOKS) {
  const url = `https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${file}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${file}: ${res.status}`);
  const raw = await res.json();
  const displayName = DISPLAY_NAMES[osis] ?? raw.book;
  const book = {
    osis,
    name: displayName,
    chapters: raw.chapters.map((ch) => ({
      chapter: Number(ch.chapter),
      verses: ch.verses.map((v) => ({ v: Number(v.verse), t: v.text })),
    })),
  };
  writeFileSync(join(outDir, `${osis}.json`), JSON.stringify(book));
  index.push({ osis, name: displayName, chapters: book.chapters.length });
  process.stdout.write(`${osis} `);
}
writeFileSync(
  join(outDir, "index.json"),
  JSON.stringify({ translation: "KJV", copyright: "Public Domain (Crown copyright in the UK)", books: index })
);
console.log(`\nDone: ${index.length} books -> ${outDir}`);
