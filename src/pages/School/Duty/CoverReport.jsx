import { useCallback, useEffect, useState } from "react";
import {
  Box,
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
import { WarningAmberRounded } from "@mui/icons-material";
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

  return (
    <AppContainer>
      <Box dir="rtl" sx={{ width: "100%", maxWidth: 1280, mx: "auto", pb: 4 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 3, bgcolor: "#FFFCF7" }}>
        <Typography variant="h5" fontWeight={700}>
          تقرير الاحتياطي
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          مين شايل الاحتياطي، ومين محتاج تغطية
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !report ? null : (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Stat label="حصص احتياطي" value={totals.coverAssigned ?? 0} />
            <Stat label="مدرسين شالوا" value={totals.teachersWhoCovered ?? 0} />
            <Stat label="متوسط لكل مدرس" value={totals.averagePerCarrier ?? 0} />
            <Stat label="استئذانات معتمدة" value={totals.approvedLeaves ?? 0} />
          </Stack>

          {(report.overloaded ?? []).length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                bgcolor: "#FDF6EC",
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
              }}
            >
              <WarningAmberRounded color="warning" />
              <Box>
                <Typography variant="body1" fontWeight={700}>
                  حمل غير متوازن
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.overloaded
                    .map((row) => `${row.name} (${row.covered})`)
                    .join("، ")}{" "}
                  — شايلين ضعف اللي باقي المدرسين شايلينه.
                </Typography>
              </Box>
            </Paper>
          )}

          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: "#FFFCF7" }}>
            {rows.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                مفيش احتياطي ولا استئذان في الفترة دي.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>المعلم</TableCell>
                    <TableCell align="center">شال احتياطي</TableCell>
                    <TableCell align="center">اتغطّى عنه</TableCell>
                    <TableCell align="center">استئذانات</TableCell>
                    <TableCell align="center">أيام حضور</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* بيوصلوا مرتّبين بالأتقل — مش بنعيد ترتيبهم. */}
                  {rows.map((row) => (
                    <TableRow key={row.teacherId}>
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Typography variant="body2">{row.name}</Typography>
                          {(report.overloaded ?? []).some(
                            (item) => item.teacherId === row.teacherId
                          ) && (
                            <Chip size="small" color="warning" label="حمل زائد" />
                          )}
                        </Stack>
                        {heaviest > 0 && (
                          <LinearProgress
                            variant="determinate"
                            value={(row.covered / heaviest) * 100}
                            sx={{ mt: 0.75, height: 5, borderRadius: 3 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700}>
                          {row.covered}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{row.neededCover}</TableCell>
                      <TableCell align="center">{row.approvedLeaves}</TableCell>
                      <TableCell align="center">{row.daysPresent}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      )}
    </Box>
    </AppContainer>
  );
};

const Stat = ({ label, value }) => (
  <Paper
    elevation={0}
    sx={{ p: 2, borderRadius: 3, flex: 1, bgcolor: "#FFFCF7" }}
  >
    <Typography variant="h5" fontWeight={700}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Paper>
);

export default CoverReport;
