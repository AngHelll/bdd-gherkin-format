/**
 * Smallest line-aligned replacement that turns `original` into `formatted`.
 * Offsets are into `original`; boundaries snap to line starts so an edit never
 * splits a CRLF pair.
 */

export interface MinimalEdit {
  start: number;
  end: number;
  text: string;
}

export function minimalEdit(original: string, formatted: string): MinimalEdit | null {
  if (original === formatted) {
    return null;
  }
  const maxPrefix = Math.min(original.length, formatted.length);
  let prefix = 0;
  while (prefix < maxPrefix && original.charCodeAt(prefix) === formatted.charCodeAt(prefix)) {
    prefix++;
  }
  prefix = original.lastIndexOf('\n', prefix - 1) + 1;

  const maxSuffix = Math.min(original.length, formatted.length) - prefix;
  let suffix = 0;
  while (
    suffix < maxSuffix &&
    original.charCodeAt(original.length - 1 - suffix) ===
      formatted.charCodeAt(formatted.length - 1 - suffix)
  ) {
    suffix++;
  }
  while (suffix > 0 && original.charCodeAt(original.length - suffix - 1) !== 10) {
    suffix--;
  }

  return {
    start: prefix,
    end: original.length - suffix,
    text: formatted.slice(prefix, formatted.length - suffix),
  };
}
