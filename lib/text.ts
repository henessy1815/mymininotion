export type CharCount = { total: number; nonSpace: number };

// Counts what the user sees as one character: 👍🏽, 👨‍👩‍👧 and \r\n are each 1.
const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });

export function countCharacters(text: string): CharCount {
  let total = 0;
  let nonSpace = 0;
  for (const { segment } of segmenter.segment(text)) {
    total++;
    // trim() removes every whitespace and line terminator, incl. U+3000 and \r\n.
    if (segment.trim() !== '') nonSpace++;
  }
  return { total, nonSpace };
}
