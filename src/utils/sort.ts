/**
 * Sorting utilities — ports of Angular CommonService sort methods.
 * All return a new sorted array (no mutation).
 */

/** Sort by date field, latest first. Null/empty dates go last. */
export function sortByDateLatest<T>(array: T[], key: keyof T): T[] {
  return [...array].sort((a, b) => {
    const dateA = a[key] ? new Date(a[key] as string | number) : null;
    const dateB = b[key] ? new Date(b[key] as string | number) : null;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return Number(dateB) - Number(dateA);
  });
}

/** Sort by a string/number property ascending. */
export function sortByProperty<T>(array: T[], key: keyof T): T[] {
  return [...array].sort((a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0));
}

/** Sort alphanumerically by a string field (e.g. "item2" before "item10"). */
export function sortByAlphanumeric<T>(array: T[], key: keyof T): T[] {
  return [...array].sort((a, b) => {
    const valA = String(a[key] ?? '');
    const valB = String(b[key] ?? '');
    return valA.localeCompare(valB, undefined, { numeric: true });
  });
}
