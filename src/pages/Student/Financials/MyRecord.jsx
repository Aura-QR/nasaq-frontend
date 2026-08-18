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
  CalendarMonthRounded,
  CheckCircleRounded,
  EventRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  ScheduleRounded,
  SchoolRounded,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";

import { useMyFinancialRecord } from "@/utils/hooks/apis/financials/useMyFinancialRecord";
import { useFinancialAcademicYears } from "@/utils/hooks/apis/financials/useFinancialAcademicYears";

import {
  formatDate,
  formatMoney,
  mapInstallmentStatus,
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

const tuitionStatusMap = {
  paid: "مدفوعة",
  partial: "مدفوعة جزئيًا",
  unpaid: "غير مدفوعة",
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
  record
) => {
  const academicYearId =
    record?.academicYearId;

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
    record?.academicYear;

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

const getStatusTheme = (status) => {
  const value =
    String(status || "unpaid")
      .trim()
      .toLowerCase();

  if (value === "paid") {
    return {
      color: COLORS.green,
      background: COLORS.greenLight,
    };
  }

  if (value === "partial") {
    return {
      color: COLORS.gold,
      background: COLORS.goldLight,
    };
  }

  return {
    color: COLORS.red,
    background: COLORS.redLight,
  };
};

// =====================================================
// PAGE
// =====================================================

const MyFinancialRecord = () => {
  const navigate = useNavigate();

  const {
    financialRecord,
    loading,
  } = useMyFinancialRecord();

  const academicYearId =
    normalizeId(
      financialRecord?.academicYearId
    );

  const {
    getAcademicYearLabel,
    loadingAcademicYears,
  } = useFinancialAcademicYears(
    academicYearId
      ? [academicYearId]
      : []
  );

  const academicYearLabel =
    useMemo(() => {
      const directName =
        getDirectAcademicYearName(
          financialRecord
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
        resolved !== academicYearId
      ) {
        return resolved;
      }

      return "غير محددة";
    }, [
      financialRecord,
      academicYearId,
      getAcademicYearLabel,
    ]);

  const tuition =
    financialRecord?.tuition || {};

  const totalFee = Number(
    tuition?.discount
      ? tuition?.netFee
      : tuition?.fee || 0
  );

  const totalPaid = Number(
    tuition?.totalPaid || 0
  );

  const remaining = Math.max(
    totalFee - totalPaid,
    0
  );

  const installments =
    useMemo(() => {
      const list =
        Array.isArray(
          tuition?.installments
        )
          ? tuition.installments
          : [];

      return [...list].sort(
        (a, b) => {
          const aNumber = Number(
            a?.installmentNumber
          );

          const bNumber = Number(
            b?.installmentNumber
          );

          const aHasNumber =
            Number.isFinite(aNumber);

          const bHasNumber =
            Number.isFinite(bNumber);

          if (
            aHasNumber &&
            bHasNumber &&
            aNumber !== bNumber
          ) {
            return aNumber - bNumber;
          }

          if (
            aHasNumber &&
            !bHasNumber
          ) {
            return -1;
          }

          if (
            !aHasNumber &&
            bHasNumber
          ) {
            return 1;
          }

          const aDate =
            new Date(
              a?.dueDate || 0
            ).getTime();

          const bDate =
            new Date(
              b?.dueDate || 0
            ).getTime();

          return (
            (Number.isNaN(aDate)
              ? 0
              : aDate) -
            (Number.isNaN(bDate)
              ? 0
              : bDate)
          );
        }
      );
    }, [tuition?.installments]);

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

  if (!financialRecord) {
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
              borderRadius: "22px",
              border: `1px solid ${COLORS.border}`,
              display: "grid",
              placeItems: "center",
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
                  color: COLORS.blue,
                }}
              >
                <ReceiptLongRounded />
              </Avatar>

              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                لا يوجد سجل مالي
                متاح حالياً
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    );
  }

  const tuitionTheme =
    getStatusTheme(
      tuition?.status
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
        {/* ============================================
            COMPACT HEADER
        ============================================ */}

        <PageHeader
          onBack={() =>
            navigate(
              "/student-dashboard"
            )
          }
        />

        {/* ============================================
            TOP INFO
        ============================================ */}

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            px: {
              xs: 1.5,
              md: 2,
            },
            py: 1.3,
            borderRadius: "18px",
            border: `1px solid ${COLORS.border}`,
            background:
              "linear-gradient(90deg,#ffffff 0%,#fbfdff 58%,#fffaf2 100%)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
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
                  width: 44,
                  height: 44,
                  borderRadius: "13px",
                  bgcolor:
                    COLORS.blueLight,
                  color: COLORS.blue,
                }}
              >
                <AccountBalanceWalletRounded />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color:
                      COLORS.deepNavy,
                    fontWeight: 900,
                    fontSize: "14px",
                  }}
                >
                  ملخص الرسوم الدراسية
                </Typography>

                <Typography
                  sx={{
                    color: COLORS.gray,
                    fontSize: "8px",
                  }}
                >
                  تفاصيل الرسوم
                  والمدفوعات والأقساط
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              flexWrap="wrap"
            >
              <Chip
                icon={
                  <SchoolRounded />
                }
                label={`السنة الدراسية: ${academicYearLabel}`}
                sx={{
                  height: 29,
                  bgcolor:
                    COLORS.blueLight,
                  color: COLORS.navy,
                  fontWeight: 900,
                  fontSize: "8px",
                  "& .MuiChip-icon": {
                    color:
                      COLORS.blue,
                    fontSize: 14,
                  },
                }}
              />

              <Chip
                icon={
                  <CheckCircleRounded />
                }
                label={`الحالة: ${
                  tuitionStatusMap[
                    tuition?.status
                  ] ||
                  "غير مدفوعة"
                }`}
                sx={{
                  height: 29,
                  bgcolor:
                    tuitionTheme.background,
                  color:
                    tuitionTheme.color,
                  fontWeight: 900,
                  fontSize: "8px",
                  "& .MuiChip-icon": {
                    color:
                      tuitionTheme.color,
                    fontSize: 14,
                  },
                }}
              />
            </Stack>
          </Stack>
        </Paper>

        {/* ============================================
            STATS
        ============================================ */}

        <Box
          sx={{
            mt: 1.2,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <StatCard
            title="إجمالي الرسوم"
            value={formatMoney(
              totalFee
            )}
            icon={
              ReceiptLongRounded
            }
            color={COLORS.blue}
            background={
              COLORS.blueLight
            }
          />

          <StatCard
            title="إجمالي المدفوع"
            value={formatMoney(
              totalPaid
            )}
            icon={PaymentsRounded}
            color={COLORS.green}
            background={
              COLORS.greenLight
            }
          />

          <StatCard
            title="المتبقي"
            value={formatMoney(
              remaining
            )}
            icon={
              AccountBalanceWalletRounded
            }
            color={COLORS.red}
            background={
              COLORS.redLight
            }
          />
        </Box>

        {/* ============================================
            INSTALLMENTS
        ============================================ */}

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: {
              xs: 1.5,
              md: 2,
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
              mb: 1.3,
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
                أقساط الرسوم
                الدراسية
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: COLORS.gray,
                  fontSize: "8px",
                }}
              >
                تفاصيل قيمة كل قسط
                وموعد استحقاقه
              </Typography>
            </Box>

            <Chip
              icon={
                <CalendarMonthRounded />
              }
              label={`${installments.length} أقساط`}
              sx={{
                height: 29,
                bgcolor:
                  COLORS.purpleLight,
                color:
                  COLORS.purple,
                fontWeight: 900,
                fontSize: "8px",
                "& .MuiChip-icon": {
                  color:
                    COLORS.purple,
                  fontSize: 14,
                },
              }}
            />
          </Stack>

          {installments.length ===
          0 ? (
            <Box
              sx={{
                minHeight: 100,
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
              <Typography
                sx={{
                  color: COLORS.gray,
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                لا توجد أقساط
                لعرضها
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
                pb: 0.5,
              }}
            >
              <Box
                sx={{
                  minWidth: 720,
                }}
              >
                {/* HEADER */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "0.65fr 1fr 1fr 1fr 0.9fr",
                    gap: 0.7,
                    px: 1.1,
                    py: 0.9,
                    mb: 0.6,
                    borderRadius:
                      "12px",
                    bgcolor:
                      COLORS.grayLight,
                  }}
                >
                  {[
                    "القسط",
                    "المبلغ",
                    "المدفوع",
                    "الاستحقاق",
                    "الحالة",
                  ].map(
                    (label) => (
                      <Typography
                        key={label}
                        sx={{
                          color:
                            COLORS.gray,
                          fontSize:
                            "8px",
                          fontWeight:
                            900,
                        }}
                      >
                        {label}
                      </Typography>
                    )
                  )}
                </Box>

                {/* ROWS */}
                <Stack
                  spacing={0.7}
                >
                  {installments.map(
                    (
                      item,
                      index
                    ) => {
                      const status =
                        String(
                          item?.status ||
                            "unpaid"
                        )
                          .trim()
                          .toLowerCase();

                      const theme =
                        getStatusTheme(
                          status
                        );

                      return (
                        <Box
                          key={
                            item?._id ||
                            item?.id ||
                            item?.installmentNumber ||
                            index
                          }
                          sx={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "0.65fr 1fr 1fr 1fr 0.9fr",
                            gap: 0.7,
                            alignItems:
                              "center",
                            px: 1.1,
                            py: 1,
                            borderRadius:
                              "12px",
                            border: `1px solid ${COLORS.border}`,
                            bgcolor: "#fff",
                            transition:
                              ".2s",
                            "&:hover": {
                              bgcolor:
                                "#fbfdff",
                              borderColor:
                                "#d8e4ee",
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              color:
                                COLORS.deepNavy,
                              fontSize:
                                "10px",
                              fontWeight:
                                900,
                            }}
                          >
                            #
                            {item?.installmentNumber ??
                              index +
                                1}
                          </Typography>

                          <Typography
                            sx={{
                              color:
                                COLORS.deepNavy,
                              fontSize:
                                "10px",
                              fontWeight:
                                800,
                            }}
                          >
                            {formatMoney(
                              item?.amount
                            )}
                          </Typography>

                          <Typography
                            sx={{
                              color:
                                COLORS.green,
                              fontSize:
                                "10px",
                              fontWeight:
                                800,
                            }}
                          >
                            {formatMoney(
                              item?.paidAmount
                            )}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <EventRounded
                              sx={{
                                color:
                                  COLORS.gray,
                                fontSize:
                                  14,
                              }}
                            />

                            <Typography
                              sx={{
                                color:
                                  COLORS.deepNavy,
                                fontSize:
                                  "9px",
                                fontWeight:
                                  700,
                              }}
                            >
                              {formatDate(
                                item?.dueDate
                              )}
                            </Typography>
                          </Stack>

                          <Chip
                            icon={
                              status ===
                              "paid" ? (
                                <CheckCircleRounded />
                              ) : (
                                <ScheduleRounded />
                              )
                            }
                            label={mapInstallmentStatus(
                              item?.status
                            )}
                            sx={{
                              justifySelf:
                                "start",
                              height: 26,
                              bgcolor:
                                theme.background,
                              color:
                                theme.color,
                              fontWeight:
                                900,
                              fontSize:
                                "7px",
                              "& .MuiChip-icon":
                                {
                                  color:
                                    theme.color,
                                  fontSize:
                                    13,
                                },
                            }}
                          />
                        </Box>
                      );
                    }
                  )}
                </Stack>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

// =====================================================
// HEADER
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
            سجلي المالي
          </Typography>

          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "8px",
            }}
          >
            الرسوم والمدفوعات
            والأقساط
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
            COLORS.goldLight,
          color: COLORS.gold,
        }}
      >
        <AccountBalanceWalletRounded />
      </Avatar>
    </Stack>
  </Paper>
);

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  background,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      minHeight: 88,
      borderRadius: "16px",
      border: `1px solid ${COLORS.border}`,
      display: "flex",
      alignItems: "center",
      gap: 1.1,
      transition: ".2s",
      "&:hover": {
        transform:
          "translateY(-2px)",
        boxShadow:
          "0 8px 20px rgba(18,47,77,.05)",
      },
    }}
  >
    <Avatar
      variant="rounded"
      sx={{
        width: 42,
        height: 42,
        borderRadius: "12px",
        bgcolor: background,
        color,
      }}
    >
      <Icon
        sx={{
          fontSize: 21,
        }}
      />
    </Avatar>

    <Box
      sx={{
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: COLORS.gray,
          fontSize: "8px",
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.2,
          color,
          fontSize: {
            xs: "14px",
            md: "17px",
          },
          fontWeight: 900,
          lineHeight: 1.25,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default MyFinancialRecord;
