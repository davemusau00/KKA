import { Matter, PracticeArea } from '../types';

const PRACTICE_AREA_CODES: Record<PracticeArea, string> = {
  'Personal Injury': 'PI',
  'Commercial': 'COM',
  'Conveyancing': 'CNV',
  'Family': 'FAM',
};

/**
 * Generates the next sequential matter reference number based on practice area and current year.
 * Pattern: KKA/{CODE}/{YYYY}/{SEQ:04d} (e.g. KKA/PI/2026/0014)
 * Guarantees uniqueness by scanning existing matters for the highest sequence number in that category and year.
 */
export function generateSequentialMatterReference(
  practiceArea: PracticeArea,
  existingMatters: Matter[],
  targetYear: number = new Date().getFullYear()
): string {
  const code = PRACTICE_AREA_CODES[practiceArea] || 'GEN';
  const prefix = `KKA/${code}/${targetYear}/`;

  let maxSequence = 0;

  for (const m of existingMatters) {
    const ref = m.internalReference || '';
    if (ref.startsWith(prefix)) {
      const seqStr = ref.substring(prefix.length);
      const parsedSeq = parseInt(seqStr, 10);
      if (!isNaN(parsedSeq) && parsedSeq > maxSequence) {
        maxSequence = parsedSeq;
      }
    }
  }

  // Next sequence number
  const nextSeq = maxSequence + 1;
  const paddedSeq = String(nextSeq).padStart(4, '0');

  return `${prefix}${paddedSeq}`;
}
