import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  ArrowBackRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EventBusyRounded,
  RefreshRounded,
  ScheduleRounded,
  ShieldRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  cancelLeaveRequest,
  createLeaveRequest,
  fetchLeaveRequests,
  LEAVE_STATUS_LABELS,
  toDateInput,
} from "@/APIs/school/duty";
import { fetchMyDay } from "@/APIs/school/notifications";
import AppContainer from "@/components/Container/Container";

import nasaqLogo from "@/images/wadq-logo.png";
import { TEACHER_UI } from "@/shared/ui/teacherUi";

const COLORS = {
  navy: "#173f65",
  navyDark: "#122f4d",
  navySoft: "#eef3f7",
  gold: "#c89224",
  goldSoft: "#fff3d8",
  green: "#18865d",
  greenSoft: "#eaf7f1",
  red: "#d14343",
  redSoft: "#fff0f0",
  blue: "#2d6f9f",
  blueSoft: "#eef6fb",
  muted: "#8996a5",
  border: "#e1e7ec",
};

const STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const StatCard = ({
  title,
  value,
  helper,
  icon,
  tone = "blue",
}) => {
  const tones = {
    blue: {
      color: COLORS.navy,
      bg: COLORS.navySoft,
    },
    gold: {
      color: COLORS.gold,
      bg: COLORS.goldSoft,
    },
    green: {
      color: COLORS.green,
      bg: COLORS.greenSoft,
    },
    red: {
      color: COLORS.red,
      bg: COLORS.redSoft,
    },
  };

  const selected =
    tones[tone] || tones.blue;

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.statCard,
        border: `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: 1.2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: COLORS.muted,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            color: COLORS.navyDark,
            fontSize: {
              xs: 24,
              sm: 28,
              md: 32,
            },
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          {value}
        </Typography>

        <Typography
          noWrap
          sx={{
            color: "#a0aab5",
            fontSize: 12,
            fontWeight: 600,
            mt: 0.35,
          }}
        >
          {helper}
        </Typography>
      </Box>

      <Box
        sx={{
          ...TEACHER_UI.statIcon,
          display: "grid",
          placeItems: "center",
          color: selected.color,
          bgcolor: selected.bg,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
};

/**
 * شاشة المعلم — استئذاناته، والحصص المكلّف بيها احتياطي.
 *
 * الـ APIs والـ logic كما هي؛ التعديل هنا UI فقط
 * لتطابق صفحة "تحضيراتي" في بوابة المعلم.
 */
const TeacherDuty = () => {
  const navigate = useNavigate();

  const [requests, setRequests] =
    useState([]);
  const [day, setDay] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [busy, setBusy] =
    useState(false);
  const [open, setOpen] =
    useState(false);

  const [form, setForm] =
    useState({
      date: toDateInput(),
      leaveAt: "",
      fromSlot: "",
      reason: "",
    });

  const load = useCallback(
    async (
      { silent = false } = {}
    ) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        leaveResponse,
        dayResponse,
      ] = await Promise.all([
        fetchLeaveRequests({}),
        fetchMyDay(
          toDateInput()
        ),
      ]);

      if (
        leaveResponse.status
      ) {
        setRequests(
          Array.isArray(
            leaveResponse.data
          )
            ? leaveResponse.data
            : []
        );
      } else {
        toast.error(
          leaveResponse.message
        );
      }

      if (dayResponse.status) {
        setDay(
          dayResponse.data
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setBusy(true);

    const response =
      await createLeaveRequest(
        form
      );

    setBusy(false);

    if (response.status) {
      toast.success(
        response.message
      );

      setOpen(false);

      setForm({
        date: toDateInput(),
        leaveAt: "",
        fromSlot: "",
        reason: "",
      });

      load({
        silent: true,
      });
    } else {
      toast.error(
        response.message
      );
    }
  };

  const cancel = async (
    id
  ) => {
    setBusy(true);

    const response =
      await cancelLeaveRequest(
        id
      );

    setBusy(false);

    if (response.status) {
      toast.success(
        response.message
      );

      load({
        silent: true,
      });
    } else {
      toast.error(
        response.message
      );
    }
  };

  const stats =
    useMemo(() => {
      const own =
        day?.stats?.own ?? 0;

      const cover =
        day?.stats?.cover ?? 0;

      const excused =
        day?.stats?.excused ?? 0;

      const pending =
        requests.filter(
          (item) =>
            item?.status ===
            "pending"
        ).length;

      return {
        own,
        cover,
        excused,
        pending,
      };
    }, [day, requests]);

  if (loading) {
    return (
      <Box
        sx={{
          ...TEACHER_UI.page,
        }}
        dir="rtl"
      >
        <Box
          sx={{
            ...TEACHER_UI.container,
            minHeight: 340,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...TEACHER_UI.page,
      }}
      dir="rtl"
    >
      <Box
        sx={{
          ...TEACHER_UI.container,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.hero,
            position: "relative",
            overflow: "hidden",
            color: "#fff",
            background:
              "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 220,
              height: 220,
              border:
                "1px solid rgba(255,255,255,.08)",
              borderRadius: "50%",
              left: -70,
              top: -110,
            }}
          />

          <Stack
            direction="row"
            alignItems="center"
            gap={1.3}
            sx={{ zIndex: 1 }}
          >
            <Box
              component="img"
              src={nasaqLogo}
              alt="نَسّق"
              sx={{
                ...TEACHER_UI.heroLogo,
                objectFit: "contain",
                bgcolor: "#fff",
                p: 0.45,
              }}
            />

            <Box>
              <Chip
                icon={
                  <ShieldRounded />
                }
                label="بوابة المعلم"
                size="small"
                sx={{
                  height: 23,
                  mb: 0.45,
                  color:
                    "#ffdf8c",
                  bgcolor:
                    "rgba(255,255,255,.08)",
                  border:
                    "1px solid rgba(255,223,140,.25)",
                  fontSize: 8,
                  fontWeight: 900,
                }}
              />

              <Typography
                sx={{
                  ...TEACHER_UI.heroTitle,
                }}
              >
                الاستئذان والاحتياطي
              </Typography>

              <Typography
                sx={{
                  ...TEACHER_UI.heroSubtitle,
                  color:
                    "rgba(255,255,255,.72)",
                }}
              >
                تابع استئذاناتك
                والحصص المكلّف بها
                بدل زميل من مكان
                واحد
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap={0.8}
            sx={{ zIndex: 1 }}
          >
            <Button
              startIcon={
                <ArrowBackRounded />
              }
              onClick={() =>
                navigate(
                  "/teacher/dashboard"
                )
              }
              sx={{
                ...TEACHER_UI.button,
                color: "#fff",
                border:
                  "1px solid rgba(255,255,255,.25)",
              }}
            >
              لوحة التحكم
            </Button>

            <Tooltip title="تحديث البيانات">
              <IconButton
                onClick={() =>
                  load({
                    silent: true,
                  })
                }
                disabled={refreshing}
                sx={{
                  width: 36,
                  height: 36,
                  color: "#fff",
                  border:
                    "1px solid rgba(255,255,255,.25)",
                  borderRadius: 1.8,
                }}
              >
                {refreshing ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                ) : (
                  <RefreshRounded fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <Button
              startIcon={
                <AddRounded />
              }
              onClick={() =>
                setOpen(true)
              }
              sx={{
                ...TEACHER_UI.button,
                color:
                  COLORS.navyDark,
                bgcolor: "#ffdc83",
                "&:hover": {
                  bgcolor:
                    "#f5ca5c",
                },
              }}
            >
              طلب استئذان
            </Button>
          </Stack>
        </Paper>

        <Grid
          container
          spacing={1.1}
          sx={{ mt: 0.1 }}
        >
          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <StatCard
              title="حصص اليوم"
              value={stats.own}
              helper="حصصك الأساسية اليوم"
              icon={
                <ScheduleRounded fontSize="small" />
              }
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <StatCard
              title="حصص احتياطي"
              value={stats.cover}
              helper="حصص بدل زميل"
              icon={
                <ShieldRounded fontSize="small" />
              }
              tone="green"
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <StatCard
              title="باستئذان"
              value={stats.excused}
              helper="حصص معفاة بالاستئذان"
              icon={
                <EventBusyRounded fontSize="small" />
              }
              tone="gold"
            />
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            lg={3}
          >
            <StatCard
              title="طلبات قيد المراجعة"
              value={stats.pending}
              helper="طلبات لم يُحسم وضعها"
              icon={
                <CalendarMonthRounded fontSize="small" />
              }
              tone="blue"
            />
          </Grid>
        </Grid>

        <MyDay day={day} />

        <Paper
          elevation={0}
          sx={{
            ...TEACHER_UI.section,
            mt: 1.1,
            border:
              `1px solid ${COLORS.border}`,
            bgcolor: "#fff",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    COLORS.navyDark,
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                طلبات الاستئذان
              </Typography>

              <Typography
                sx={{
                  color:
                    COLORS.muted,
                  fontSize: 9,
                }}
              >
                تابع حالة طلباتك
                السابقة والحالية
              </Typography>
            </Box>

            <Chip
              label={`${requests.length} طلب`}
              size="small"
              sx={{
                fontSize: 8.5,
                fontWeight: 900,
                bgcolor:
                  COLORS.navySoft,
                color: COLORS.navy,
              }}
            />
          </Stack>

          {requests.length ===
          0 ? (
            <Box
              sx={{
                ...TEACHER_UI.emptyState,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Stack
                alignItems="center"
                gap={0.7}
              >
                <CalendarMonthRounded
                  sx={{
                    fontSize: 40,
                    color:
                      "#b5c0ca",
                  }}
                />

                <Typography
                  sx={{
                    color:
                      COLORS.navyDark,
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  لا توجد طلبات
                  استئذان
                </Typography>

                <Typography
                  sx={{
                    color:
                      COLORS.muted,
                    fontSize: 9,
                  }}
                >
                  يمكنك إنشاء طلب
                  جديد من زر طلب
                  استئذان بالأعلى
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Grid
              container
              spacing={0.9}
            >
              {requests.map(
                (row) => {
                  const status =
                    row?.status ||
                    "pending";

                  const isPending =
                    status ===
                    "pending";

                  const isApproved =
                    status ===
                    "approved";

                  return (
                    <Grid
                      item
                      xs={12}
                      md={6}
                      key={row._id}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          ...TEACHER_UI.listCard,
                          minHeight: 92,
                          border:
                            `1px solid ${
                              isApproved
                                ? "#cce9dd"
                                : isPending
                                  ? "#eeddb4"
                                  : "#f0cccc"
                            }`,
                          bgcolor:
                            isApproved
                              ? "#fbfffd"
                              : isPending
                                ? "#fffdf8"
                                : "#fffafa",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap: 1.2,
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={1.1}
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2,
                              display:
                                "grid",
                              placeItems:
                                "center",
                              color:
                                isApproved
                                  ? COLORS.green
                                  : isPending
                                    ? COLORS.gold
                                    : COLORS.red,
                              bgcolor:
                                isApproved
                                  ? COLORS.greenSoft
                                  : isPending
                                    ? COLORS.goldSoft
                                    : COLORS.redSoft,
                              flexShrink: 0,
                            }}
                          >
                            {isApproved ? (
                              <CheckCircleRounded />
                            ) : (
                              <EventBusyRounded />
                            )}
                          </Box>

                          <Box
                            sx={{
                              minWidth: 0,
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              gap={0.8}
                              flexWrap="wrap"
                            >
                              <Typography
                                noWrap
                                sx={{
                                  color:
                                    COLORS.navyDark,
                                  fontSize: 15,
                                  fontWeight: 900,
                                }}
                              >
                                {row.date}
                                {" • "}
                                انصراف{" "}
                                {row.leaveAt}
                              </Typography>

                              <Chip
                                size="small"
                                color={
                                  STATUS_COLORS[
                                    status
                                  ]
                                }
                                label={
                                  LEAVE_STATUS_LABELS[
                                    status
                                  ] ??
                                  status
                                }
                                sx={{
                                  height: 26,
                                  fontSize: 11,
                                  fontWeight: 900,
                                }}
                              />
                            </Stack>

                            <Typography
                              noWrap
                              sx={{
                                color:
                                  COLORS.muted,
                                fontSize: 12.5,
                                mt: 0.3,
                              }}
                            >
                              {row.fromSlot
                                ? `من الحصة ${row.fromSlot}`
                                : "اليوم كله"}
                              {row.reason
                                ? ` • ${row.reason}`
                                : ""}
                            </Typography>

                            {row.status !==
                              "pending" &&
                              row.reviewNote && (
                                <Typography
                                  noWrap
                                  sx={{
                                    color:
                                      "#a2acb6",
                                    fontSize: 11,
                                    mt: 0.25,
                                  }}
                                >
                                  {row.reviewedByName
                                    ? `${row.reviewedByName}: `
                                    : ""}
                                  {
                                    row.reviewNote
                                  }
                                </Typography>
                              )}
                          </Box>
                        </Stack>

                        {isPending && (
                          <Tooltip title="إلغاء الطلب">
                            <span>
                              <IconButton
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  cancel(
                                    row._id
                                  )
                                }
                                sx={{
                                  width: 32,
                                  height: 32,
                                  color:
                                    COLORS.red,
                                  bgcolor:
                                    COLORS.redSoft,
                                }}
                              >
                                {busy ? (
                                  <CircularProgress
                                    size={
                                      15
                                    }
                                    color="inherit"
                                  />
                                ) : (
                                  <DeleteOutlineRounded
                                    sx={{
                                      fontSize:
                                        17,
                                    }}
                                  />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Paper>
                    </Grid>
                  );
                }
              )}
            </Grid>
          )}
        </Paper>

        <Dialog
          open={open}
          onClose={() =>
            !busy &&
            setOpen(false)
          }
          fullWidth
          maxWidth="xs"
          dir="rtl"
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{ p: 0 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 1.6,
                py: 1.3,
                color: "#fff",
                background:
                  "linear-gradient(115deg, #173f65 0%, #285f8d 100%)",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 18,
                  }}
                >
                  طلب استئذان
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    fontSize: 11.5,
                    color:
                      "rgba(255,255,255,.72)",
                  }}
                >
                  أدخل بيانات
                  الاستئذان ثم أرسل
                  الطلب للإدارة
                </Typography>
              </Box>

              <CalendarMonthRounded />
            </Stack>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{ p: 1.6 }}
          >
            <Stack spacing={1.4}>
              <TextField
                type="date"
                size="small"
                label="اليوم"
                value={form.date}
                onChange={(
                  event
                ) =>
                  setForm(
                    (prev) => ({
                      ...prev,
                      date:
                        event
                          .target
                          .value,
                    })
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      ...TEACHER_UI.field,
                    },
                }}
              />

              <TextField
                type="time"
                size="small"
                label="وقت الانصراف"
                value={
                  form.leaveAt
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (prev) => ({
                      ...prev,
                      leaveAt:
                        event
                          .target
                          .value,
                    })
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      ...TEACHER_UI.field,
                    },
                }}
              />

              <TextField
                select
                size="small"
                label="أول حصة هتغيب عنها"
                value={
                  form.fromSlot
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (prev) => ({
                      ...prev,
                      fromSlot:
                        event
                          .target
                          .value,
                    })
                  )
                }
                helperText="سيبها فاضية لو مش متأكد — الإدارة هتشوف اليوم كله"
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      ...TEACHER_UI.field,
                    },
                }}
              >
                <MenuItem value="">
                  مش محدد
                </MenuItem>

                {[
                  1, 2, 3, 4, 5,
                  6, 7, 8, 9, 10,
                ].map((slot) => (
                  <MenuItem
                    key={slot}
                    value={slot}
                  >
                    الحصة {slot}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                multiline
                minRows={3}
                label="السبب (اختياري)"
                value={
                  form.reason
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (prev) => ({
                      ...prev,
                      reason:
                        event
                          .target
                          .value,
                    })
                  )
                }
                sx={{
                  "& .MuiOutlinedInput-root":
                    {
                      borderRadius:
                        2,
                    },
                }}
              />
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 1.6,
              py: 1.2,
            }}
          >
            <Button
              onClick={() =>
                setOpen(false)
              }
              disabled={busy}
              sx={{
                color:
                  COLORS.navy,
                fontWeight: 800,
              }}
            >
              إلغاء
            </Button>

            <Button
              variant="contained"
              onClick={submit}
              disabled={
                busy ||
                !form.date ||
                !form.leaveAt
              }
              startIcon={
                busy ? (
                  <CircularProgress
                    size={15}
                    color="inherit"
                  />
                ) : (
                  <AddRounded />
                )
              }
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                bgcolor:
                  COLORS.navy,
                "&:hover": {
                  bgcolor:
                    COLORS.navyDark,
                },
              }}
            >
              إرسال الطلب
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

/**
 * يوم المدرس كامل — حصصه وحصص الاحتياطي على نفس الخط.
 */
const MyDay = ({ day }) => {
  if (!day) {
    return (
      <Alert
        severity="info"
        sx={{
          mt: 1.1,
          borderRadius: 2,
        }}
      >
        لا توجد بيانات متاحة
        لليوم الحالي.
      </Alert>
    );
  }

  const slots =
    day.slots ?? [];

  return (
    <Paper
      elevation={0}
      sx={{
        ...TEACHER_UI.section,
        mt: 1.1,
        border:
          `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography
            sx={{
              color:
                COLORS.navyDark,
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            يومك النهارده
          </Typography>

          <Typography
            sx={{
              color:
                COLORS.muted,
              fontSize: 9,
            }}
          >
            حصصك الأساسية
            والاحتياطي في نفس
            المكان
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={0.6}
          flexWrap="wrap"
          useFlexGap
        >
          <Chip
            size="small"
            label={`${day.stats?.own ?? 0} حصة`}
            sx={{
              fontSize: 8.5,
              fontWeight: 900,
              bgcolor:
                COLORS.navySoft,
              color: COLORS.navy,
            }}
          />

          {(day.stats?.cover ??
            0) > 0 && (
            <Chip
              size="small"
              label={`${day.stats.cover} احتياطي`}
              sx={{
                fontSize: 8.5,
                fontWeight: 900,
                bgcolor:
                  COLORS.greenSoft,
                color:
                  COLORS.green,
              }}
            />
          )}

          {(day.stats?.excused ??
            0) > 0 && (
            <Chip
              size="small"
              label={`${day.stats.excused} باستئذان`}
              sx={{
                fontSize: 8.5,
                fontWeight: 900,
                bgcolor:
                  COLORS.goldSoft,
                color:
                  COLORS.gold,
              }}
            />
          )}
        </Stack>
      </Stack>

      {slots.length === 0 ? (
        <Box
          sx={{
            ...TEACHER_UI.emptyState,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <Stack
            alignItems="center"
            gap={0.7}
          >
            <ScheduleRounded
              sx={{
                fontSize: 40,
                color: "#b5c0ca",
              }}
            />

            <Typography
              sx={{
                color:
                  COLORS.navyDark,
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              مفيش حصص عليك
              النهارده
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Grid
          container
          spacing={0.9}
        >
          {slots.map((slot) => {
            const isCover =
              slot.kind ===
              "cover";

            const isExcused =
              Boolean(
                slot.excusedByLeave
              );

            return (
              <Grid
                item
                xs={12}
                md={6}
                key={`${slot.kind}-${slot.lectureId}`}
              >
                <Paper
                  elevation={0}
                  sx={{
                    ...TEACHER_UI.listCard,
                    minHeight: 88,
                    border:
                      `1px solid ${
                        isCover
                          ? "#cfe2ef"
                          : isExcused
                            ? "#eeddb4"
                            : COLORS.border
                      }`,
                    bgcolor: isCover
                      ? "#f8fcff"
                      : isExcused
                        ? "#fffdf8"
                        : "#fff",
                    opacity:
                      isExcused
                        ? 0.82
                        : 1,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 1.2,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={1.1}
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        display: "grid",
                        placeItems:
                          "center",
                        color: isCover
                          ? COLORS.blue
                          : isExcused
                            ? COLORS.gold
                            : COLORS.navy,
                        bgcolor:
                          isCover
                            ? COLORS.blueSoft
                            : isExcused
                              ? COLORS.goldSoft
                              : COLORS.navySoft,
                        flexShrink: 0,
                      }}
                    >
                      {isCover ? (
                        <ShieldRounded />
                      ) : isExcused ? (
                        <EventBusyRounded />
                      ) : (
                        <ScheduleRounded />
                      )}
                    </Box>

                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.8}
                        flexWrap="wrap"
                      >
                        <Typography
                          noWrap
                          sx={{
                            color:
                              COLORS.navyDark,
                            fontSize: 15,
                            fontWeight: 900,
                          }}
                        >
                          الحصة{" "}
                          {slot.slot}
                          {" • "}
                          {slot.className ??
                            "—"}
                        </Typography>

                        {isCover && (
                          <Chip
                            size="small"
                            label="احتياطي"
                            sx={{
                              height: 26,
                              fontSize: 11,
                              fontWeight: 900,
                              color:
                                COLORS.blue,
                              bgcolor:
                                COLORS.blueSoft,
                            }}
                          />
                        )}

                        {isExcused && (
                          <Chip
                            size="small"
                            label="مستأذن"
                            sx={{
                              height: 26,
                              fontSize: 11,
                              fontWeight: 900,
                              color:
                                COLORS.gold,
                              bgcolor:
                                COLORS.goldSoft,
                            }}
                          />
                        )}
                      </Stack>

                      <Typography
                        noWrap
                        sx={{
                          color:
                            COLORS.muted,
                          fontSize: 12.5,
                          mt: 0.3,
                        }}
                      >
                        {slot.subjectName ??
                          "—"}
                        {slot.roomNumber
                          ? ` • ${slot.roomNumber}`
                          : ""}
                      </Typography>

                      {slot.coveringFor && (
                        <Typography
                          noWrap
                          sx={{
                            color:
                              "#a2acb6",
                            fontSize: 11,
                            mt: 0.25,
                          }}
                        >
                          بدل{" "}
                          {
                            slot.coveringFor
                          }
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Paper>
  );
};

export default TeacherDuty;
