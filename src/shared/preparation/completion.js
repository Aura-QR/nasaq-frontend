/**
 * Is a preparation finished?
 *
 * The server owns this rule. It is the same four requirements
 * `POST /preparation/:id/submit` enforces — a lesson from the curriculum, at
 * least one objective, digital content, and one resource — and the list
 * endpoints report the answer as `isComplete`.
 *
 * Reading it locally used to be the only option, because list rows arrived
 * without `resources`, `objectives` or `digitalContentIds`. That is why the
 * schedule and the preparations page each fetched every preparation
 * individually before they could colour a single cell: up to five hundred
 * requests to recompute something the server already knew. The local reading
 * below survives only as a fallback for a row from an API that predates the
 * field — during a deploy, the two services are not upgraded at the same
 * moment.
 */

const normalizeId = (value) => String(value?._id ?? value?.id ?? value ?? "");

/** A list of blanks is not a list of objectives. */
const hasNonBlankValue = (value) =>
  Array.isArray(value) &&
  value.some((item) =>
    String(item?.text || item?.title || item?.name || item || "").trim()
  );

export const getPreparationResourceCount = (preparation) => {
  if (Array.isArray(preparation?.resources)) return preparation.resources.length;

  const directCount = Number(preparation?.resourcesCount || 0);
  if (directCount > 0) return directCount;

  return ["enrichments", "homeworks", "exams", "activities", "assignments"].reduce(
    (total, key) =>
      total + (Array.isArray(preparation?.[key]) ? preparation[key].length : 0),
    0
  );
};

export const isPreparationComplete = (preparation) => {
  if (!preparation) return false;

  // The server's answer settles it — including when it says "not finished".
  // Falling through on `false` would let the local guess overrule the rule
  // that actually governs submission.
  if (typeof preparation.isComplete === "boolean") return preparation.isComplete;
  if (preparation.completed === true) return true;

  return (
    Boolean(normalizeId(preparation?.lessonId || preparation?.lesson)) &&
    hasNonBlankValue(preparation?.objectives) &&
    Array.isArray(preparation?.digitalContentIds) &&
    preparation.digitalContentIds.length > 0 &&
    getPreparationResourceCount(preparation) > 0
  );
};
