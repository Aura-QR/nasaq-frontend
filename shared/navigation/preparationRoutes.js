// Compatibility for school preparation links shared with a teacher. The target
// still passes through the teacher role guard and the API's ownership checks.
export function teacherPreparationRedirect(pathname) {
  const match = String(pathname || '').match(
    /^\/school\/preparation(\/(?:add|edit\/[^/]+|[^/]+))?\/?$/
  );
  return match ? `/teacher/preparations${match[1] || ''}` : null;
}
