import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  AccessTimeRounded,
  CheckCircleRounded,
  GpsFixedRounded,
  HistoryRounded,
  LocationOffRounded,
  MyLocationRounded,
  RefreshRounded,
  RouterRounded,
  WarningAmberRounded,
} from "@mui/icons-material";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-toastify";

import {
  checkInTeacherAttendance,
  checkOutTeacherAttendance,
  fetchMyTeacherAttendance,
} from "@/APIs/school/teacherAttendance";

const DATE_LOCALE = "ar-EG-u-nu-latn";

const todayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const unwrapPage = (response) => {
  if (!response || response?.status === false) {
    return { rows: [], meta: {} };
  }

  // Backend shape:
  // { status, message, data: { data: [...], meta: {...} } }
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return { rows: payload, meta: {} };
  }

  if (Array.isArray(payload?.data)) {
    return {
      rows: payload.data,
      meta: payload.meta || {},
    };
  }

  return { rows: [], meta: payload?.meta || {} };
};

const extractRecord = (response) => {
  if (!response || response?.status === false) return null;
  const payload = response?.data ?? response;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return payload;
};

const normalizeDate = (record) => {
  const source =
    record?.date ||
    record?.attendanceDate ||
    record?.checkInDate ||
    record?.createdAt ||
    "";

  if (!source) return "";
  return String(source).slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "—";
  const text = String(value);

  if (/^\d{2}:\d{2}/.test(text)) {
    return text.slice(0, 5);
  }

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(DATE_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return text;
};

const formatMinutes = (value, { duration = false } = {}) => {
  if (value === null || value === undefined || value === "") return "";

  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "";

  const safeMinutes = Math.max(0, Math.round(minutes));

  if (!duration) return `${safeMinutes} د`;

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours) return `${remainingMinutes} د`;
  if (!remainingMinutes) return `${hours} س`;

  return `${hours} س ${remainingMinutes} د`;
};

const hasMeasuredValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const getVerification = (record) => ({
  gps: Boolean(record?.verification?.gps),
  network: Boolean(record?.verification?.network),
});

const StatusBox = ({ icon, title, passed, waiting, details }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      flex: 1,
      minWidth: 0,
      borderRadius: "16px",
      border: waiting
        ? "1px solid rgba(36,74,112,.12)"
        : passed
          ? "1px solid rgba(39,150,111,.24)"
          : "1px solid rgba(201,79,79,.18)",
      backgroundColor: waiting
        ? "rgba(36,74,112,.035)"
        : passed
          ? "rgba(232,247,239,.72)"
          : "rgba(253,234,234,.68)",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 38,
          height: 38,
          display: "grid",
          placeItems: "center",
          borderRadius: "12px",
          color: waiting ? "#708198" : passed ? "#237449" : "#C94848",
          backgroundColor: "#fff",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "11px", fontWeight: 900 }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.2, color: "#708198", fontSize: "9px" }}>
          {waiting ? "في انتظار التسجيل" : details}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const TeacherCheckIn = () => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.();
  const currentUser = authState?.user || authState || {};

  const teacherName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.firstName ||
    "المعلم";

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [locationState, setLocationState] = useState("idle");
  const [error, setError] = useState("");

  const today = useMemo(todayKey, []);

  const loadHistory = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    const response = await fetchMyTeacherAttendance();

    if (response?.status === false) {
      setError(response?.message || "تعذر تحميل سجل حضورك");
      if (!silent) setLoading(false);
      return;
    }

    const { rows } = unwrapPage(response);
    setHistory(rows);

    const todayRecord = rows.find((record) => normalizeDate(record) === today);
    setCurrentRecord(todayRecord || null);

    if (!silent) setLoading(false);
  }, [today]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const verification = getVerification(currentRecord);
  const fullyVerified = verification.gps && verification.network;
  const partiallyVerified = verification.gps !== verification.network;
  const hasCheckedIn = Boolean(currentRecord?.checkInAt);
  const hasCheckedOut = Boolean(currentRecord?.checkOutAt);

  const requestBrowserLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("المتصفح لا يدعم تحديد الموقع الجغرافي"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve({
            lat: coords.latitude,
            lng: coords.longitude,
          }),
        (locationError) => {
          const messages = {
            1: "تم رفض صلاحية الموقع. فعّل الموقع للمتصفح ثم أعد المحاولة.",
            2: "تعذر تحديد موقعك الحالي.",
            3: "انتهت مهلة تحديد الموقع. أعد المحاولة.",
          };

          reject(
            new Error(
              messages[locationError?.code] ||
                "تعذر الوصول إلى موقعك الحالي"
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });

  const handleCheckIn = async () => {
    if (currentRecord) {
      toast.info(`حضورك مسجل بالفعل الساعة ${formatTime(currentRecord.checkInAt)}`);
      return;
    }

    setCheckingIn(true);
    setLocationState("loading");
    setError("");

    try {
      const location = await requestBrowserLocation();
      setLocationState("ready");

      const response = await checkInTeacherAttendance(location);

      if (response?.status === false) {
        if (
          Number(response?.statusCode) === 409 &&
          response?.data?.alreadyCheckedIn
        ) {
          const existing = {
            ...response.data,
            date: response.data.date || today,
          };

          setCurrentRecord(existing);
          toast.info(
            `حضورك مسجل بالفعل الساعة ${formatTime(existing.checkInAt)}`
          );
          await loadHistory({ silent: true });
          return;
        }

        setError(response?.message || "تعذر تسجيل حضورك");
        toast.error(response?.message || "تعذر تسجيل حضورك");
        return;
      }

      const record = extractRecord(response);
      if (record) {
        setCurrentRecord(record);
      }

      toast.success("تم تسجيل حضورك بنجاح");
      await loadHistory({ silent: true });
    } catch (locationError) {
      setLocationState("error");
      const message = locationError?.message || "تعذر تحديد موقعك";
      setError(message);
      toast.error(message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!hasCheckedIn) {
      toast.error("سجّل حضورك أولًا قبل تسجيل الانصراف");
      return;
    }

    if (hasCheckedOut) {
      toast.info(
        `انصرافك مسجل بالفعل الساعة ${formatTime(currentRecord.checkOutAt)}`
      );
      return;
    }

    setCheckingOut(true);
    setLocationState("loading");
    setError("");

    try {
      const location = await requestBrowserLocation();
      setLocationState("ready");

      const response = await checkOutTeacherAttendance(location);

      if (response?.status === false) {
        if (
          Number(response?.statusCode) === 409 &&
          response?.data?.checkOutAt
        ) {
          const existing = {
            ...currentRecord,
            ...response.data,
            date:
              response.data.date ||
              currentRecord?.date ||
              today,
          };

          setCurrentRecord(existing);
          toast.info(
            `انصرافك مسجل بالفعل الساعة ${formatTime(existing.checkOutAt)}`
          );
          await loadHistory({ silent: true });
          return;
        }

        setError(
          response?.message ||
            "تعذر تسجيل انصرافك"
        );
        toast.error(
          response?.message ||
            "تعذر تسجيل انصرافك"
        );
        return;
      }

      const record = extractRecord(response);

      if (record) {
        setCurrentRecord((previous) => ({
          ...(previous || {}),
          ...record,
          date:
            record?.date ||
            previous?.date ||
            today,
        }));
      }

      toast.success("تم تسجيل انصرافك بنجاح");
      await loadHistory({ silent: true });
    } catch (locationError) {
      setLocationState("error");
      const message =
        locationError?.message ||
        "تعذر تحديد موقعك";
      setError(message);
      toast.error(message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        py: { xs: 2, sm: 2.5, md: 3.5 },
        backgroundColor: "var(--color-page, #F7F8FA)",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1680px", mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 2.2, md: 3 },
            borderRadius: "24px",
            color: "#fff",
            background:
              "linear-gradient(135deg, var(--color-navy-deep, #122F4D), var(--color-navy, #244A70))",
            boxShadow: "0 18px 45px rgba(18,47,77,.16)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Chip
                icon={<MyLocationRounded />}
                label="بوابة المعلم"
                size="small"
                sx={{
                  mb: 1,
                  height: 27,
                  color: "#F2D792",
                  backgroundColor: "rgba(242,215,146,.12)",
                  fontSize: "12px",
                  fontWeight: 800,
                  "& .MuiChip-icon": { color: "inherit", fontSize: 16 },
                }}
              />
              <Typography sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 900 }}>
                تسجيل الحضور والانصراف
              </Typography>
              <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,.80)", fontSize: { xs: 12.5, md: 14 } }}>
                صباح الخير، {teacherName}. يتم التحقق من الموقع وشبكة المدرسة عند تسجيل الحضور والانصراف.
              </Typography>
            </Box>

            <Button
              onClick={() => loadHistory()}
              startIcon={<RefreshRounded />}
              variant="outlined"
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,.28)",
                borderRadius: "12px",
                "&:hover": {
                  borderColor: "rgba(255,255,255,.5)",
                  backgroundColor: "rgba(255,255,255,.06)",
                },
              }}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: "14px" }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "0.9fr 1.4fr" },
            gap: 1.5,
            alignItems: "start",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: "20px",
              border: "1px solid rgba(36,74,112,.09)",
              boxShadow: "0 12px 28px rgba(18,47,77,.05)",
            }}
          >
            <Typography sx={{ color: "#122F4D", fontSize: 15, fontWeight: 900 }}>
              حضور اليوم
            </Typography>
            <Typography sx={{ mt: 0.3, color: "#708198", fontSize: 10 }}>
              {formatDate(today)}
            </Typography>

            {loading ? (
              <Box sx={{ minHeight: 320, display: "grid", placeItems: "center" }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    width: 190,
                    height: 190,
                    mx: "auto",
                    my: 3,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    borderRadius: "50%",
                    border: currentRecord
                      ? "4px solid #27966f"
                      : "4px solid #B78430",
                    backgroundColor: currentRecord
                      ? "rgba(232,247,239,.78)"
                      : "rgba(251,240,216,.55)",
                    boxShadow: "0 12px 30px rgba(18,47,77,.08)",
                  }}
                >
                  <Box>
                    {checkingIn || checkingOut ? (
                      <CircularProgress size={34} sx={{ color: "#B78430" }} />
                    ) : hasCheckedIn ? (
                      <CheckCircleRounded sx={{ color: "#27966f", fontSize: 44 }} />
                    ) : locationState === "error" ? (
                      <LocationOffRounded sx={{ color: "#C94848", fontSize: 44 }} />
                    ) : (
                      <MyLocationRounded sx={{ color: "#B78430", fontSize: 44 }} />
                    )}

                    <Typography sx={{ mt: 0.7, fontSize: 13, fontWeight: 900 }}>
                      {checkingIn
                        ? "جارٍ تسجيل الحضور..."
                        : checkingOut
                          ? "جارٍ تسجيل الانصراف..."
                          : hasCheckedOut
                            ? "تم تسجيل الحضور والانصراف"
                            : hasCheckedIn
                              ? "تم تسجيل الحضور"
                              : "جاهز للتسجيل"}
                    </Typography>

                    {hasCheckedIn && (
                      <Stack spacing={0.2} sx={{ mt: 0.35 }}>
                        <Typography sx={{ color: "#237449", fontSize: 10.5, fontWeight: 800 }}>
                          حضور: {formatTime(currentRecord.checkInAt)}
                        </Typography>

                        {hasCheckedOut && (
                          <Typography sx={{ color: "#237449", fontSize: 10.5, fontWeight: 800 }}>
                            انصراف: {formatTime(currentRecord.checkOutAt)}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>
                </Box>

                {!hasCheckedIn ? (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={checkingIn || checkingOut}
                    onClick={handleCheckIn}
                    startIcon={
                      checkingIn
                        ? <CircularProgress size={16} color="inherit" />
                        : <GpsFixedRounded />
                    }
                    sx={{
                      minHeight: 48,
                      borderRadius: "13px",
                      color: "#122F4D",
                      backgroundColor: "#F2D792",
                      boxShadow: "none",
                      fontWeight: 900,
                      "&:hover": {
                        backgroundColor: "#E8C96F",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {checkingIn
                      ? "جارٍ تسجيل الحضور"
                      : "تسجيل حضوري الآن"}
                  </Button>
                ) : !hasCheckedOut ? (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={checkingIn || checkingOut}
                    onClick={handleCheckOut}
                    startIcon={
                      checkingOut
                        ? <CircularProgress size={16} color="inherit" />
                        : <GpsFixedRounded />
                    }
                    sx={{
                      minHeight: 48,
                      borderRadius: "13px",
                      color: "#fff",
                      backgroundColor: "#244A70",
                      boxShadow: "none",
                      fontWeight: 900,
                      "&:hover": {
                        backgroundColor: "#1B3D61",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {checkingOut
                      ? "جارٍ تسجيل الانصراف"
                      : "تسجيل انصرافي الآن"}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled
                    sx={{
                      minHeight: 48,
                      borderRadius: "13px",
                      fontWeight: 900,
                    }}
                  >
                    تم تسجيل الانصراف الساعة {formatTime(currentRecord.checkOutAt)}
                  </Button>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1.5 }}>
                  <StatusBox
                    icon={<GpsFixedRounded />}
                    title="الموقع الجغرافي"
                    waiting={!hasCheckedIn}
                    passed={verification.gps}
                    details={verification.gps ? "داخل النطاق المسموح" : "لم ينجح تحقق GPS"}
                  />

                  <StatusBox
                    icon={<RouterRounded />}
                    title="شبكة المدرسة"
                    waiting={!hasCheckedIn}
                    passed={verification.network}
                    details={verification.network ? "الشبكة مطابقة" : "الشبكة غير مطابقة"}
                  />
                </Stack>

            

                {currentRecord?.isWorkingDay === false && (
                  <Alert
                    severity="warning"
                    icon={<WarningAmberRounded />}
                    sx={{ mt: 1.4, borderRadius: "12px" }}
                  >
                    تم تسجيل حضورك في يوم إجازة رسمية للمدرسة، لذلك لا يتم قياس التأخير أو الخروج المبكر لهذا اليوم.
                  </Alert>
                )}

                {hasMeasuredValue(currentRecord?.lateMinutes) && (
                  <Alert severity="info" sx={{ mt: 1.4, borderRadius: "12px" }}>
                    {Number(currentRecord.lateMinutes) > 0
                      ? `تأخير اليوم: ${formatMinutes(currentRecord.lateMinutes)}`
                      : "تم تسجيل حضورك في موعد بداية الدوام."}
                  </Alert>
                )}

                {hasCheckedOut && hasMeasuredValue(currentRecord?.earlyLeaveMinutes) && (
                  <Alert
                    severity={Number(currentRecord.earlyLeaveMinutes) > 0 ? "warning" : "success"}
                    sx={{ mt: 1.1, borderRadius: "12px" }}
                  >
                    {Number(currentRecord.earlyLeaveMinutes) > 0
                      ? `الخروج المبكر: ${formatMinutes(currentRecord.earlyLeaveMinutes)}`
                      : "تم تسجيل الانصراف في الموعد المحدد أو بعده."}
                  </Alert>
                )}

                {hasCheckedOut && hasMeasuredValue(currentRecord?.workMinutes) && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 1.4 }}
                  >
                    <Typography sx={{ color: "#708198", fontSize: 10 }}>
                      مدة العمل المسجلة اليوم
                    </Typography>
                    <Chip
                      label={formatMinutes(currentRecord.workMinutes, { duration: true })}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Stack>
                )}

                {currentRecord?.distanceMeters !== undefined && currentRecord?.distanceMeters !== null && (
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.4 }}>
                    <Typography sx={{ color: "#708198", fontSize: 10 }}>
                      المسافة المسجلة عن المدرسة
                    </Typography>
                    <Chip
                      label={`${Math.round(Number(currentRecord.distanceMeters) || 0)} متر`}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Stack>
                )}
              </>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              overflow: "hidden",
              borderRadius: "20px",
              border: "1px solid rgba(36,74,112,.09)",
              boxShadow: "0 12px 28px rgba(18,47,77,.05)",
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
              <Box>
                <Typography sx={{ color: "#122F4D", fontSize: 15, fontWeight: 900 }}>
                  <HistoryRounded sx={{ verticalAlign: "middle", ml: 0.7 }} />
                  سجل حضوري
                </Typography>
                <Typography sx={{ mt: 0.2, color: "#708198", fontSize: 10 }}>
                  السجلات التي تخص حسابك فقط.
                </Typography>
              </Box>
              <Chip label={`${history.length} سجل`} size="small" />
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(36,74,112,.035)" }}>
                    <TableCell align="right">التاريخ</TableCell>
                    <TableCell align="right">الحضور</TableCell>
                    <TableCell align="right">الانصراف</TableCell>
                    <TableCell align="right">التأخير</TableCell>
                    <TableCell align="right">خروج مبكر</TableCell>
                    <TableCell align="right">مدة العمل</TableCell>
                    <TableCell align="right">الطريقة</TableCell>
                    <TableCell align="right">GPS</TableCell>
                    <TableCell align="right">الشبكة</TableCell>
                    <TableCell align="right">المسافة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!history.length ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6, color: "#708198" }}>
                        لا توجد سجلات حضور حتى الآن.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((record, index) => {
                      const verify = getVerification(record);
                      const method = record?.method || "location";
                      const id = record?._id || record?.id || index;

                      return (
                        <TableRow key={id} hover>
                          <TableCell align="right">{formatDate(normalizeDate(record))}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <AccessTimeRounded sx={{ fontSize: 16, color: "#708198" }} />
                              <span>{formatTime(record?.checkInAt)}</span>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">
                            {formatTime(record?.checkOutAt)}
                          </TableCell>
                          <TableCell align="right">
                            {hasMeasuredValue(record?.lateMinutes)
                              ? formatMinutes(record.lateMinutes)
                              : "—"}
                          </TableCell>
                          <TableCell align="right">
                            {hasMeasuredValue(record?.earlyLeaveMinutes)
                              ? formatMinutes(record.earlyLeaveMinutes)
                              : "—"}
                          </TableCell>
                          <TableCell align="right">
                            {hasMeasuredValue(record?.workMinutes)
                              ? formatMinutes(record.workMinutes, { duration: true })
                              : "—"}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={method === "manual" ? "يدوي" : "ذاتي"}
                              size="small"
                              sx={{
                                color: method === "manual" ? "#9A6B12" : "#237449",
                                backgroundColor: method === "manual" ? "#FFF3D8" : "#E7F6ED",
                                fontWeight: 800,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {verify.gps ? "✅" : "—"}
                          </TableCell>
                          <TableCell align="right">
                            {verify.network ? "✅" : "—"}
                          </TableCell>
                          <TableCell align="right">
                            {record?.distanceMeters === undefined || record?.distanceMeters === null
                              ? "—"
                              : `${Math.round(Number(record.distanceMeters) || 0)} م`}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherCheckIn;
