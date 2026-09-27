export const getEntityId = (value) =>
  String(value?._id || value?.id || value || "").trim();

export const unwrapApiData = (response) =>
  response?.data?.data ?? response?.data ?? response;

export const extractApiList = (response) => {
  const payload = unwrapApiData(response);
  if (Array.isArray(payload)) return payload;

  return (
    [
      payload?.docs,
      payload?.items,
      payload?.results,
      payload?.records,
      payload?.academicYears,
      payload?.years,
      payload?.terms,
      payload?.data,
    ].find(Array.isArray) || []
  );
};

export const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toISOString().slice(0, 10);
};

export const formatAcademicDate = (value) => {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const getAcademicYearStatus = (value) =>
  String(value || "").toLowerCase();

export const getAcademicYearStatusLabel = (value) =>
  getAcademicYearStatus(value) === "active" ? "نشطة" : "مؤرشفة";

export const getTermStatusLabel = (value) => {
  const status = String(value || "").toLowerCase();
  if (status === "active") return "نشط";
  if (status === "closed") return "مغلق";
  return "قادم";
};

export const sortAcademicYears = (years) =>
  [...(Array.isArray(years) ? years : [])].sort((a, b) => {
    const activeDiff =
      Number(getAcademicYearStatus(b?.status) === "active") -
      Number(getAcademicYearStatus(a?.status) === "active");
    if (activeDiff !== 0) return activeDiff;

    return (
      new Date(b?.startDate || 0).getTime() -
      new Date(a?.startDate || 0).getTime()
    );
  });

export const sortTerms = (terms) =>
  [...(Array.isArray(terms) ? terms : [])].sort(
    (a, b) => Number(a?.order || 0) - Number(b?.order || 0)
  );
