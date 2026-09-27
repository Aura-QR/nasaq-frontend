import { useMemo } from "react";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AccountBalanceWalletRounded,
  ArrowBackRounded,
  CheckCircleRounded,
  DirectionsBusRounded,
  EventNoteRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  RouteRounded,
  SchoolRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";

import { useFinancialSummary } from "@/utils/hooks/apis/financials/useFinancialSummary";
import { useFinancialAcademicYears } from "@/utils/hooks/apis/financials/useFinancialAcademicYears";

import {
  formatMoney,
  mapBusServiceType,
} from "@/utils/financial/financialUtils";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  blue: "#4e8dcc",
  blueLight: "#edf6ff",
  green: "#43a978",
  greenLight: "#eaf8f1",
  red: "#d76760",
  redLight: "#fff0ef",
  gold: "#d3a44f",
  goldLight: "#fff8e9",
  purple: "#8068c9",
  purpleLight: "#f3efff",
  gray: "#87939e",
  grayLight: "#f6f8fa",
  border: "#e7edf2",
};

const statusMap = {
  paid: "مدفوعة",
  partial: "مدفوعة جزئيًا",
  unpaid: "غير مدفوعة",
  pending: "قيد الانتظار",
  overdue: "متأخرة",
  "not-enrolled": "غير مشترك",
};

// =====================================================
// HELPERS
// =====================================================

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

const getDirectAcademicYearName = (
  summary
) => {
  const academicYearId =
    summary?.academicYearId;

  if (
    academicYearId &&
    typeof academicYearId === "object"
  ) {
    return (
      academicYearId?.name ||
      academicYearId?.title ||
      ""
    );
  }

  const academicYear =
    summary?.academicYear;

  if (
    academicYear &&
    typeof academicYear === "object"
  ) {
    return (
      academicYear?.name ||
      academicYear?.title ||
      ""
    );
  }

  if (typeof academicYear === "string") {
    return academicYear;
  }

  return "";
};

const numberOf = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const numeric = Number(value);

      if (
        Number.isFinite(numeric)
      ) {
        return numeric;
      }
    }
  }

  return 0;
};

const getRemaining = (item) => {
  if (!item) return 0;

  if (
    item?.remaining !==
      undefined &&
    item?.remaining !== null
  ) {
    return numberOf(
      item.remaining
    );
  }

  const total = numberOf(
    item?.netFee,
    item?.fee,
    item?.amount,
    item?.total
  );

  const paid = numberOf(
    item?.totalPaid,
    item?.paidAmount
  );

  return Math.max(
    total - paid,
    0
  );
};

const countStatuses = (
  installments = []
) => {
  const list =
    Array.isArray(installments)
      ? installments
      : [];

  return {
    paid: list.filter(
      (item) =>
        item?.status === "paid"
    ).length,

    pending: list.filter(
      (item) =>
        item?.status ===
        "pending"
    ).length,

    overdue: list.filter(
      (item) =>
        item?.status ===
        "overdue"
    ).length,
  };
};

const getStatusTheme = (status) => {
  const value =
    String(
      status || "unpaid"
    )
      .trim()
      .toLowerCase();

  if (value === "paid") {
    return {
      color: COLORS.green,
      background:
        COLORS.greenLight,
    };
  }

  if (
    value === "partial" ||
    value === "pending"
  ) {
    return {
      color: COLORS.gold,
      background:
        COLORS.goldLight,
    };
  }

  if (
    value ===
    "not-enrolled"
  ) {
    return {
      color: COLORS.gray,
      background:
        COLORS.grayLight,
    };
  }

  return {
    color: COLORS.red,
    background:
      COLORS.redLight,
  };
};

// =====================================================
// MAIN
// =====================================================

const MyFinancialSummary = () => {
  const navigate = useNavigate();

  const {
    financialSummary,
    loading,
  } = useFinancialSummary();

  const academicYearId =
    normalizeId(
      financialSummary?.academicYearId
    );

  const {
    getAcademicYearLabel,
    loadingAcademicYears,
  } =
    useFinancialAcademicYears(
      academicYearId
        ? [academicYearId]
        : []
    );

  const academicYearLabel =
    useMemo(() => {
      const directName =
        getDirectAcademicYearName(
          financialSummary
        );

      if (directName) {
        return directName;
      }

      if (!academicYearId) {
        return "غير محددة";
      }

      const resolved =
        getAcademicYearLabel?.(
          academicYearId
        );

      if (
        resolved &&
        resolved !== "—" &&
        resolved !==
          academicYearId
      ) {
        return resolved;
      }

      return "غير محددة";
    }, [
      financialSummary,
      academicYearId,
      getAcademicYearLabel,
    ]);

  if (
    loading ||
    (
      academicYearId &&
      loadingAcademicYears
    )
  ) {
    return (
      <Container noSidebar={true}>
        <Loading />
      </Container>
    );
  }

  if (!financialSummary) {
    return (
      <Container noSidebar={true}>
        <Box
          dir="rtl"
          sx={{
            width: "100%",
          }}
        >
          <PageHeader
            onBack={() =>
              navigate(
                "/student-dashboard"
              )
            }
          />

          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              minHeight: 230,
              borderRadius:
                "22px",
              border: `1px solid ${COLORS.border}`,
              display: "grid",
              placeItems:
                "center",
              p: 3,
            }}
          >
            <Stack
              alignItems="center"
              spacing={1}
            >
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  bgcolor:
                    COLORS.blueLight,
                  color:
                    COLORS.blue,
                }}
              >
                <AccountBalanceWalletRounded />
              </Avatar>

              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                لا يوجد ملخص مالي
                متاح حاليًا
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    );
  }

  const tuition =
    financialSummary?.tuition ||
    {};

  const bus =
    financialSummary?.bus || {
      enrolled: false,
    };

  const trips =
    Array.isArray(
      financialSummary?.trips
    )
      ? financialSummary.trips
      : [];

  const tuitionCounts =
    countStatuses(
      tuition?.installments
    );

  const busCounts =
    countStatuses(
      bus?.installments
    );

  return (
    <Container noSidebar={true}>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          pb: 3,
        }}
      >
        {/* ========================================
            HEADER
        ======================================== */}

        <PageHeader
          onBack={() =>
            navigate(
              "/student-dashboard"
            )
          }
        />

        {/* ========================================
            OVERVIEW
        ======================================== */}

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: {
              xs: 1.5,
              md: 1.8,
            },
            borderRadius: "20px",
            border: `1px solid ${COLORS.border}`,
            background:
              "linear-gradient(90deg,#ffffff 0%,#fbfdff 58%,#fffaf2 100%)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            justifyContent="space-between"
            spacing={1.4}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius:
                    "13px",
                  bgcolor:
                    COLORS.blueLight,
                  color:
                    COLORS.blue,
                }}
              >
                <AccountBalanceWalletRounded />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color:
                      COLORS.deepNavy,
                    fontSize: "14px",
                    fontWeight: 900,
                  }}
                >
                  نظرة عامة
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    color:
                      COLORS.gray,
                    fontSize: "8px",
                  }}
                >
                  ملخص الرسوم والباص
                  والرحلات
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.7}
              useFlexGap
              flexWrap="wrap"
            >
              <OverviewChip
                icon={SchoolRounded}
                label={`السنة الدراسية: ${academicYearLabel}`}
                color={COLORS.blue}
                background={
                  COLORS.blueLight
                }
              />

              <OverviewChip
                icon={RouteRounded}
                label={`${trips.length} رحلة`}
                color={COLORS.green}
                background={
                  COLORS.greenLight
                }
              />

              <OverviewChip
                icon={
                  DirectionsBusRounded
                }
                label={
                  bus?.enrolled
                    ? "مشترك في الباص"
                    : "غير مشترك في الباص"
                }
                color={
                  bus?.enrolled
                    ? COLORS.gold
                    : COLORS.gray
                }
                background={
                  bus?.enrolled
                    ? COLORS.goldLight
                    : COLORS.grayLight
                }
              />
            </Stack>
          </Stack>
        </Paper>

        {/* ========================================
            TUITION + BUS
        ======================================== */}

        <Box
          sx={{
            mt: 1.3,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2,minmax(0,1fr))",
            },
            gap: 1.2,
          }}
        >
          <SummaryCard
            title="الرسوم الدراسية"
            subtitle="ملخص الأقساط الدراسية"
            icon={ReceiptLongRounded}
            status={
              tuition?.status ||
              "unpaid"
            }
            totalPaid={numberOf(
              tuition?.totalPaid
            )}
            remaining={getRemaining(
              tuition
            )}
            counts={tuitionCounts}
            accent={COLORS.blue}
            accentBackground={
              COLORS.blueLight
            }
          />

          <SummaryCard
            title="الباص"
            subtitle={
              bus?.enrolled
                ? "تفاصيل الاشتراك والمدفوعات"
                : "لا يوجد اشتراك حالي"
            }
            icon={DirectionsBusRounded}
            status={
              bus?.enrolled
                ? bus?.status ||
                  "unpaid"
                : "not-enrolled"
            }
            totalPaid={numberOf(
              bus?.totalPaid
            )}
            remaining={
              bus?.enrolled
                ? getRemaining(bus)
                : 0
            }
            counts={busCounts}
            accent={COLORS.gold}
            accentBackground={
              COLORS.goldLight
            }
            note={
              bus?.enrolled
                ? `نوع الخدمة: ${
                    mapBusServiceType?.(
                      bus?.serviceType
                    ) ||
                    "ذهاب وعودة"
                  }`
                : "لم يتم الاشتراك في خدمة الباص"
            }
          />
        </Box>

        {/* ========================================
            TRIPS
        ======================================== */}

        <Paper
          elevation={0}
          sx={{
            mt: 1.3,
            p: {
              xs: 1.5,
              md: 1.8,
            },
            borderRadius: "20px",
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{
              mb: 1.2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                الرحلات
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: COLORS.gray,
                  fontSize: "8px",
                }}
              >
                ملخص الرحلات المسجلة
                ورسومها
              </Typography>
            </Box>

            <Chip
              icon={
                <RouteRounded />
              }
              label={`${trips.length} رحلة`}
              sx={{
                height: 29,
                bgcolor:
                  COLORS.greenLight,
                color:
                  COLORS.green,
                fontWeight: 900,
                fontSize: "8px",
                "& .MuiChip-icon": {
                  color:
                    COLORS.green,
                  fontSize: 14,
                },
              }}
            />
          </Stack>

          {trips.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2,minmax(0,1fr))",
                },
                gap: 1,
              }}
            >
              {trips.map(
                (
                  trip,
                  index
                ) => (
                  <TripCard
                    key={
                      trip?.tripId ||
                      trip?._id ||
                      trip?.id ||
                      index
                    }
                    trip={trip}
                  />
                )
              )}
            </Box>
          ) : (
            <Box
              sx={{
                minHeight: 96,
                display: "grid",
                placeItems: "center",
                borderRadius:
                  "14px",
                bgcolor:
                  COLORS.grayLight,
                border:
                  "1px dashed #dfe5eb",
              }}
            >
              <Stack
                spacing={0.4}
                alignItems="center"
              >
                <RouteRounded
                  sx={{
                    color:
                      "#a9b5bf",
                    fontSize: 28,
                  }}
                />

                <Typography
                  sx={{
                    color:
                      COLORS.deepNavy,
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                >
                  لا توجد رحلات مسجلة
                  حاليًا
                </Typography>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

// =====================================================
// PAGE HEADER
// =====================================================

const PageHeader = ({
  onBack,
}) => (
  <Paper
    elevation={0}
    sx={{
      px: {
        xs: 1.5,
        md: 2,
      },
      py: 1.1,
      borderRadius: "18px",
      border: `1px solid ${COLORS.border}`,
      background:
        "linear-gradient(90deg,#ffffff 0%,#f7fbff 100%)",
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
      >
        <IconButton
          onClick={onBack}
          sx={{
            width: 38,
            height: 38,
            borderRadius: "12px",
            bgcolor:
              COLORS.blueLight,
            color: COLORS.navy,
            border:
              "1px solid #dde9f4",
            "&:hover": {
              bgcolor: "#e2f0fc",
            },
          }}
        >
          <ArrowBackRounded />
        </IconButton>

        <Box>
          <Typography
            sx={{
              color:
                COLORS.deepNavy,
              fontWeight: 900,
              fontSize: {
                xs: "16px",
                md: "19px",
              },
            }}
          >
            الملخص المالي
          </Typography>

          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "8px",
            }}
          >
            نظرة سريعة على الرسوم
            والباص والرحلات
          </Typography>
        </Box>
      </Stack>

      <Avatar
        variant="rounded"
        sx={{
          width: 42,
          height: 42,
          borderRadius: "13px",
          bgcolor:
            COLORS.purpleLight,
          color: COLORS.purple,
        }}
      >
        <PaymentsRounded />
      </Avatar>
    </Stack>
  </Paper>
);

// =====================================================
// OVERVIEW CHIP
// =====================================================

const OverviewChip = ({
  icon: Icon,
  label,
  color,
  background,
}) => (
  <Chip
    icon={<Icon />}
    label={label}
    sx={{
      height: 29,
      bgcolor: background,
      color,
      fontWeight: 900,
      fontSize: "8px",
      "& .MuiChip-icon": {
        color,
        fontSize: 14,
      },
    }}
  />
);

// =====================================================
// SUMMARY CARD
// =====================================================

const SummaryCard = ({
  title,
  subtitle,
  icon: Icon,
  status,
  totalPaid,
  remaining,
  counts,
  note,
  accent,
  accentBackground,
}) => {
  const theme =
    getStatusTheme(status);

  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.5,
          md: 1.8,
        },
        borderRadius: "20px",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              borderRadius:
                "12px",
              bgcolor:
                accentBackground,
              color: accent,
            }}
          >
            <Icon
              sx={{
                fontSize: 21,
              }}
            />
          </Avatar>

          <Box>
            <Typography
              sx={{
                color:
                  COLORS.deepNavy,
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,
                color:
                  COLORS.gray,
                fontSize: "7.5px",
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={
            status === "paid" ? (
              <CheckCircleRounded />
            ) : (
              <ScheduleRounded />
            )
          }
          label={
            statusMap[status] ||
            "غير مدفوعة"
          }
          sx={{
            height: 27,
            bgcolor:
              theme.background,
            color: theme.color,
            fontWeight: 900,
            fontSize: "7px",
            "& .MuiChip-icon": {
              color: theme.color,
              fontSize: 13,
            },
          }}
        />
      </Stack>

      <Box
        sx={{
          mt: 1.2,
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 0.8,
        }}
      >
        <MoneyTile
          title="المدفوع"
          value={formatMoney(
            totalPaid
          )}
          color={COLORS.green}
          background={
            COLORS.greenLight
          }
          icon={PaymentsRounded}
        />

        <MoneyTile
          title="المتبقي"
          value={formatMoney(
            remaining
          )}
          color={COLORS.red}
          background={
            COLORS.redLight
          }
          icon={
            AccountBalanceWalletRounded
          }
        />
      </Box>

      <Box
        sx={{
          mt: 0.8,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3,minmax(0,1fr))",
          },
          gap: 0.7,
        }}
      >
        <CountTile
          label="مدفوع"
          value={counts?.paid || 0}
          color={COLORS.green}
        />

        <CountTile
          label="قيد الانتظار"
          value={
            counts?.pending || 0
          }
          color={COLORS.gold}
        />

        <CountTile
          label="متأخر"
          value={
            counts?.overdue || 0
          }
          color={COLORS.red}
        />
      </Box>

      {note && (
        <Stack
          direction="row"
          spacing={0.6}
          alignItems="center"
          sx={{
            mt: 1,
            px: 1,
            py: 0.7,
            borderRadius: "10px",
            bgcolor:
              COLORS.grayLight,
          }}
        >
          <EventNoteRounded
            sx={{
              color: COLORS.gray,
              fontSize: 15,
            }}
          />

          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "8px",
              fontWeight: 700,
            }}
          >
            {note}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
};

// =====================================================
// MONEY TILE
// =====================================================

const MoneyTile = ({
  title,
  value,
  color,
  background,
  icon: Icon,
}) => (
  <Box
    sx={{
      p: 1,
      minHeight: 66,
      borderRadius: "13px",
      bgcolor: background,
      display: "flex",
      alignItems: "center",
      gap: 0.8,
    }}
  >
    <Avatar
      sx={{
        width: 32,
        height: 32,
        bgcolor: "#fff",
        color,
      }}
    >
      <Icon
        sx={{
          fontSize: 17,
        }}
      />
    </Avatar>

    <Box>
      <Typography
        sx={{
          color,
          fontSize: "7px",
          fontWeight: 800,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.15,
          color,
          fontSize: "12px",
          fontWeight: 900,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

// =====================================================
// COUNT TILE
// =====================================================

const CountTile = ({
  label,
  value,
  color,
}) => (
  <Box
    sx={{
      px: 1,
      py: 0.8,
      borderRadius: "11px",
      bgcolor:
        COLORS.grayLight,
      display: "flex",
      alignItems: "center",
      justifyContent:
        "space-between",
    }}
  >
    <Typography
      sx={{
        color: COLORS.gray,
        fontSize: "7.5px",
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        color,
        fontSize: "10px",
        fontWeight: 900,
      }}
    >
      {value}
    </Typography>
  </Box>
);

// =====================================================
// TRIP CARD
// =====================================================

const TripCard = ({
  trip,
}) => {
  const status =
    trip?.status || "unpaid";

  const theme =
    getStatusTheme(status);

  return (
    <Box
      sx={{
        p: 1.1,
        borderRadius: "14px",
        bgcolor: "#fff",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Stack
          direction="row"
          spacing={0.8}
          alignItems="center"
          sx={{
            minWidth: 0,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              borderRadius:
                "11px",
              bgcolor:
                COLORS.greenLight,
              color:
                COLORS.green,
            }}
          >
            <RouteRounded
              sx={{
                fontSize: 18,
              }}
            />
          </Avatar>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              noWrap
              sx={{
                color:
                  COLORS.deepNavy,
                fontSize: "10px",
                fontWeight: 900,
              }}
            >
              {trip?.name ||
                trip?.tripName ||
                "رحلة"}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,
                color:
                  COLORS.gray,
                fontSize: "7px",
              }}
            >
              المدفوع{" "}
              {formatMoney(
                numberOf(
                  trip?.totalPaid
                )
              )}{" "}
              · المتبقي{" "}
              {formatMoney(
                getRemaining(trip)
              )}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={
            statusMap[status] ||
            "غير مدفوعة"
          }
          sx={{
            height: 25,
            bgcolor:
              theme.background,
            color: theme.color,
            fontWeight: 900,
            fontSize: "7px",
          }}
        />
      </Stack>
    </Box>
  );
};

export default MyFinancialSummary;
