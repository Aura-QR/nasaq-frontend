export const TEACHER_UI = {
  maxWidth: 1680,
  page: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#fff",
    color: "#122F4D",
    fontFamily: "Tajawal, sans-serif",
    px: { xs: 1.5, sm: 2.5, md: 3.5, lg: 4.5 },
    py: { xs: 1.5, sm: 2, md: 2.5 },
  },
  container: {
    width: "100%",
    maxWidth: 1680,
    mx: "auto",
  },
  hero: {
    minHeight: { xs: 110, md: 130 },
    px: { xs: 2, sm: 2.5, md: 3 },
    py: { xs: 1.8, md: 2.2 },
    borderRadius: { xs: 2.5, md: 3 },
  },
  heroLogo: {
    width: { xs: 52, md: 62 },
    height: { xs: 52, md: 62 },
    borderRadius: 2,
  },
  heroTitle: {
    fontSize: { xs: "24px", sm: "28px", md: "32px" },
    lineHeight: 1.2,
    fontWeight: 900,
  },
  heroSubtitle: {
    mt: 0.5,
    fontSize: { xs: "12px", sm: "13px", md: "14px" },
  },
  statCard: {
    minHeight: 88,
    p: { xs: 1.5, sm: 1.8 },
    borderRadius: 2.4,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 2,
  },
  section: {
    p: { xs: 1.5, sm: 2, md: 2.2 },
    borderRadius: 2.5,
  },
  field: {
    minHeight: 44,
    borderRadius: 2,
  },
  button: {
    minHeight: 40,
    px: 1.8,
    borderRadius: 2,
    fontSize: "13px",
    fontWeight: 800,
  },
  listCard: {
    minHeight: 72,
    p: 1.2,
    borderRadius: 2,
  },
  studentCard: {
    minHeight: 76,
    p: 1.1,
    borderRadius: 2,
  },
  emptyState: {
    minHeight: 190,
  },
};

export default TEACHER_UI;
