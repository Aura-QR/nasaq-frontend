/*
 * react-hook-form returns a checkbox group as an array of the ticked values,
 * but as false, a single string or undefined depending on how many boxes are
 * ticked and how the form was reset. The server wants an array or null —
 * null meaning "every school day", which is what an empty group means too.
 */
export const normalizeWorkDays = (value) => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  const days = [...new Set(list.filter(Boolean).map(String))];
  return days.length ? days : null;
};

/** Same days regardless of order — so an untouched group is not a change. */
export const sameWorkDays = (a, b) => {
  const x = normalizeWorkDays(a) || [];
  const y = normalizeWorkDays(b) || [];
  return x.length === y.length && x.every((day) => y.includes(day));
};
