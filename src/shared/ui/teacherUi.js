export const TEACHER_UI = {
  maxWidth: 1400,
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#fff",
    color: "#122F4D",
    fontFamily: "Tajawal, sans-serif",
    px: { xs: 1, md: 2 },
    py: { xs: 1, md: 1.25 },
  },
  container: {
    width: "100%",
    maxWidth: 1400,
    mx: "auto",
  },
  hero: {
    minHeight: { xs: 94, md: 104 },
    px: { xs: 1.5, md: 2 },
    py: { xs: 1.1, md: 1.25 },
    borderRadius: { xs: 2.5, md: 3 },
  },
  heroLogo: {
    width: { xs: 48, md: 52 },
    height: { xs: 48, md: 52 },
    borderRadius: 2,
  },
  heroTitle: {
    fontSize: { xs: "23px", md: "28px" },
    lineHeight: 1.05,
    fontWeight: 900,
  },
  heroSubtitle: {
    mt: 0.35,
    fontSize: { xs: "9px", md: "10px" },
  },
  statCard: {
    minHeight: 76,
    p: 1.15,
    borderRadius: 2.4,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 2,
  },
  section: {
    p: { xs: 1, md: 1.15 },
    borderRadius: 2.5,
  },
  field: {
    minHeight: 40,
    borderRadius: 2,
  },
  button: {
    minHeight: 34,
    px: 1.25,
    borderRadius: 1.8,
    fontSize: "8.5px",
    fontWeight: 900,
  },
  listCard: {
    minHeight: 62,
    p: 0.9,
    borderRadius: 2,
  },
  studentCard: {
    minHeight: 68,
    p: 0.85,
    borderRadius: 2,
  },
  emptyState: {
    minHeight: 170,
  },
};

export default TEACHER_UI;
