import { useCallback, useEffect, useState } from "react";
import {
  Box,
   Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  BalanceRounded,
  GroupsRounded,
  QueryStatsRounded,
  RefreshRounded,
  TaskAltRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import AppContainer from "@/components/Container/Container";

import { fetchCoverReport, toDateInput } from "@/APIs/school/duty";

const monthStart = () => {
  const now = new Date();
  return toDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
};

/**
 * مين شايل الاحتياطي.
 *
 * أول سؤال بيتسأل بعد ما الاحتياطي يشتغل: نفس المدرسين المتعاونين بياخدوا كل
 * حاجة، ومحدش بياخد باله غير لما يشتكوا — وساعتها تبقى مشكلة شخصية مش مشكلة
 * توزيع. الأرقام بتخليها ظاهرة وهي لسه الحاجة التانية.
 */
const CoverReport = () => {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(() => toDateInput());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const response = await fetchCoverReport({ from, to });

    if (response.status) {
      setReport(response.data);
    } else {
      setReport(null);
      toast.error(response.message);
    }

    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = report?.totals ?? {};
  const rows = (report?.teachers ?? []).filter(
    (row) => Number(row.covered ?? 0) > 0
  );
  const heaviest = rows[0]?.covered ?? 0;

  const statCards = [
    { label: "حصص احتياطي", value: totals.coverAssigned ?? 0, icon: <QueryStatsRounded /> },
    { label: "مدرسين شالوا", value: totals.teachersWhoCovered ?? 0, icon: <GroupsRounded /> },
    { label: "متوسط لكل مدرس", value: totals.averagePerCarrier ?? 0, icon: <BalanceRounded /> },
    { label: "استئذانات معتمدة", value: totals.approvedLeaves ?? 0, icon: <TaskAltRounded /> },
  ];

  return (
    <AppContainer>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minWidth: 0,
          pb: 4,
          color: "var(--color-text)",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: { xs: 1.5, md: 2.4 },
            py: 1.6,
            border: "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow: "0 10px 24px rgba(18,47,77,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <Typography
                  component="h1"
                  sx={{
                    color: "var(--color-navy-deep)",
                    fontSize: { xs: "21px", md: "25px" },
                    fontWeight: 800,
                  }}
                >
                  تقرير الاحتياطي
                </Typography>
                <Chip
                  size="small"
                  label={rows.length}
                  sx={{
                    color: "var(--color-gold-dark)",
                    bgcolor: "var(--color-gold-soft)",
                    fontWeight: 800,
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 0.45, color: "var(--color-muted)", fontSize: "11px" }}>
                راقب توزيع حصص الاحتياطي واكتشف الحمل غير المتوازن قبل ما يتحول لمشكلة.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <TextField
                type="date"
                size="small"
                label="من"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date"
                size="small"
                label="إلى"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshRounded />}
                onClick={load}
                disabled={loading}
                sx={{ minHeight: 40, borderRadius: "11px", fontWeight: 800 }}
              >
                تحديث
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {loading ? (
          <Paper
            elevation={0}
            sx={{
              minHeight: 280,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(36,74,112,0.08)",
              borderRadius: "18px",
              bgcolor: "var(--color-cream)",
            }}
          >
            <CircularProgress />
          </Paper>
        ) : !report ? null : (
          <>
            {/* Stats */}
            <Box
              sx={{
                mb: 1.25,
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              {statCards.map((card) => (
                <Stat key={card.label} {...card} />
              ))}
            </Box>

            {(report.overloaded ?? []).length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.35,
                  mb: 1.25,
                  border: "1px solid rgba(206,143,46,0.22)",
                  borderRadius: "14px",
                  bgcolor: "rgba(251,240,216,0.42)",
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                }}
              >
                <WarningAmberRounded sx={{ color: "var(--color-gold-dark)" }} />
                <Box>
                  <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "12px", fontWeight: 800 }}>
                    حمل غير متوازن
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: "var(--color-muted)", fontSize: "10px" }}>
                    {report.overloaded.map((row) => `${row.name} (${row.covered})`).join("، ")} —
                    شايلين ضعف اللي باقي المدرسين شايلينه.
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Table */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.2, md: 1.6 },
                border: "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",
                bgcolor: "var(--color-cream)",
                overflow: "hidden",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                <Box>
                  <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "15px", fontWeight: 800 }}>
                    توزيع الاحتياطي على المعلمين
                  </Typography>
                  <Typography sx={{ mt: 0.2, color: "var(--color-muted)", fontSize: "9.5px" }}>
                    المدرسون ظاهرون بترتيب الحمل القادم من الـBackend.
                  </Typography>
                </Box>
                <Chip size="small" label={`${rows.length} معلم`} sx={{ fontWeight: 800 }} />
              </Stack>

              {rows.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 190 }}>
                  <QueryStatsRounded sx={{ fontSize: 46, color: "var(--color-muted)" }} />
                  <Typography sx={{ mt: 0.8, color: "var(--color-navy-deep)", fontWeight: 800 }}>
                    لا توجد بيانات احتياطي
                  </Typography>
                  <Typography sx={{ mt: 0.3, color: "var(--color-muted)", fontSize: "10px" }}>
                    غيّر الفترة الزمنية لعرض تكليفات سابقة.
                  </Typography>
                </Stack>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 720 }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          "& th": {
                            color: "var(--color-muted)",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            borderBottom: "1px solid rgba(36,74,112,0.08)",
                            bgcolor: "rgba(36,74,112,0.025)",
                          },
                        }}
                      >
                        <TableCell>المعلم</TableCell>
                        <TableCell align="center">شال احتياطي</TableCell>
                        <TableCell align="center">اتغطّى عنه</TableCell>
                        <TableCell align="center">استئذانات</TableCell>
                        <TableCell align="center">أيام حضور</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => {
                        const overloaded = (report.overloaded ?? []).some(
                          (item) => item.teacherId === row.teacherId
                        );

                        return (
                          <TableRow
                            key={row.teacherId}
                            hover
                            sx={{
                              "& td": {
                                py: 1.15,
                                borderBottom: "1px solid rgba(36,74,112,0.06)",
                              },
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Stack direction="row" gap={0.7} alignItems="center" flexWrap="wrap">
                                    <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "11px", fontWeight: 800 }}>
                                      {row.name}
                                    </Typography>
                                    {overloaded && (
                                      <Chip
                                        size="small"
                                        color="warning"
                                        label="حمل زائد"
                                        sx={{ height: 21, fontSize: "8.5px", fontWeight: 800 }}
                                      />
                                    )}
                                  </Stack>
                                  {heaviest > 0 && (
                                    <LinearProgress
                                      variant="determinate"
                                      value={(row.covered / heaviest) * 100}
                                      sx={{ mt: 0.7, height: 4, borderRadius: 3, maxWidth: 220 }}
                                    />
                                  )}
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Typography sx={{ color: "var(--color-navy-deep)", fontSize: "11px", fontWeight: 800 }}>
                                {row.covered}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: "10.5px" }}>{row.neededCover}</TableCell>
                            <TableCell align="center" sx={{ fontSize: "10.5px" }}>{row.approvedLeaves}</TableCell>
                            <TableCell align="center" sx={{ fontSize: "10.5px" }}>{row.daysPresent}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Box>
    </AppContainer>
  );
};

const Stat = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.3,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: "1px solid rgba(36,74,112,0.08)",
      borderRadius: "18px",
      bgcolor: "var(--color-cream)",
    }}
  >
    <Box>
      <Typography sx={{ color: "var(--color-muted)", fontSize: "10px", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.35, color: "var(--color-navy-deep)", fontSize: "21px", fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
    <Box
      sx={{
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        color: "var(--color-gold-dark)",
        bgcolor: "var(--color-gold-soft)",
        borderRadius: "12px",
      }}
    >
      {icon}
    </Box>
  </Paper>
);

export default CoverReport;
