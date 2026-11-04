export function toLatinDigits(value: string): string {
  return value
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function normalizeSearchText(value: string): string {
  return toLatinDigits(value)
    .toLowerCase()
    .replace(/[\u064a\u0649]/g, '\u06cc')
    .replace(/\u0643/g, '\u06a9')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
