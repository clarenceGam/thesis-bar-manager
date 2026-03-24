/**
 * Parse a MySQL UTC timestamp string correctly.
 * MySQL returns timestamps as 'YYYY-MM-DD HH:MM:SS' with no timezone indicator.
 * JavaScript's new Date() treats strings without timezone as LOCAL time, causing
 * timestamps to appear 8 hours behind in UTC+8 regions.
 * This function appends 'Z' to force UTC interpretation.
 */
export const parseUTC = (ts) => {
  if (!ts) return null;
  const s = String(ts).trim();
  // Already has timezone info (ISO with Z or offset)
  if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  // MySQL format: '2026-03-25 06:46:00' → '2026-03-25T06:46:00Z'
  return new Date(s.replace(' ', 'T') + 'Z');
};
