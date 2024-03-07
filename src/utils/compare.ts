import { CustomType, compareCustomTypes } from 'bitbadgesjs-sdk';

export function compareObjects<T extends CustomType<T>, U extends CustomType<U>>(
  a: T | T[] | undefined | null | string | bigint,
  b: U | U[] | undefined | null | string | bigint
): boolean {
  if (typeof a !== typeof b) return false;

  if (a === undefined || a === null) return b === undefined || b === null;
  if (b === undefined || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!compareCustomTypes(a[i], b[i], true)) return false;
    }
    return true;
  } else {
    return compareCustomTypes(a as T, b as U, true);
  }
}
