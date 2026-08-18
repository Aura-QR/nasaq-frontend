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
  EventRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  ScheduleRounded,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";

import { useMyBus } from "@/utils/hooks/apis/financials/useBus";

import {
  formatDate,
  formatMoney,
  mapBusServiceType,
  mapFeeStatus,
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

// =====================================================
// HELPERS
// =====================================================

const getStatusTheme = (status) => {
  const value = String(status || "unpaid").trim().toLowerCase();

  if (value === "paid") {
    return {
      color: COLORS.green,
      background: COLORS.greenLight,
    };
  }

  if (value === "partial" || value === "pending") {
    return {
      color: COLORS.gold,
      background: COLORS.goldLight,
    };
  }

  if (value === "overdue") {
    return {
      color: COLORS.red,
      background: COLORS.redLight,
    };
  }

  return {
    color: COLORS.blue,
    background: COLORS.blueLight,
  };
};

// =====================================================
// PAGE
// =====================================================

const MyBus = () => {
  const navigate = useNavigate();

  const {
    busRecord,
    loading,
  } = useMyBus();

  if (loading) {
    return (
      <Container noSidebar={true}>
        <Loading />
      </Container>
    );
  }

  if (!busRecord) {
    return (
      <Container noSidebar={true}>
        <Box dir="rtl">
          <PageHeader
            onBack={() =>
              navigate("/student-dashboard")
            }
          />

          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              minHeight: 220,
              borderRadius: "20px",
              border: `1px solid ${COLORS.border}`,
              display: "grid",
              placeItems: "center",
              p: 3,
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  bgcolor: COLORS.goldLight,
                  color: COLORS.gold,
                }}
              >
                <DirectionsBusRounded />
              </Avatar>

              <Typography
                sx={{
                  color: COLORS.deepNavy,
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                لا توجد بيانات باص متاحة حاليًا
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    );
  }

  const student =
    busRecord?.student || {};

  const bus =
    busRecord?.bus || {};

  const isEnrolled =
    Boolean(bus?.enrolled);

  const fee = Number(
    bus?.discount
      ? bus?.netFee
      : bus?.fee || 0
  );

  const totalPaid = Number(
    bus?.totalPaid || 0
  );

  const remaining = Math.max(
    fee - totalPaid,
    0
  );

  const installments =
    Array.isArray(bus?.installments)
      ? bus.installments
      : [];

  if (!isEnrolled) {
    return (
      <Container noSidebar={true}>
        <Box
          dir="rtl"
          sx={{
            width: "100%",
            pb: 3,
          }}
        >
          <PageHeader
            onBack={() =>
              navigate("/student-dashboard")
            }
          />

          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              p: {
                xs: 2,
                md: 2.5,
              },
              borderRadius: "20px",
              border: `1px solid ${COLORS.border}`,
              background:
                "linear-gradient(90deg,#ffffff 0%,#fbfdff 60%,#fffaf2 100%)",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "center",
                sm: "center",
              }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack
                direction="row"
                spacing={1.4}
                alignItems="center"
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: "16px",
                    bgcolor: COLORS.goldLight,
                    color: COLORS.gold,
                  }}
                >
                  <DirectionsBusRounded
                    sx={{ fontSize: 30 }}
                  />
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      color: COLORS.deepNavy,
                      fontWeight: 900,
                      fontSize: {
                        xs: "15px",
                        md: "17px",
                      },
                    }}
                  >
                    غير مشترك في خدمة الباص
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      color: COLORS.gray,
                      fontSize: "9px",
                      lineHeight: 1.8,
                    }}
                  >
                    لا توجد رسوم أو أقساط باص مسجلة على حسابك حاليًا.
                  </Typography>
                </Box>
              </Stack>

              <Chip
                icon={<ScheduleRounded />}
                label="غير مشترك"
                sx={{
                  height: 30,
                  bgcolor: COLORS.grayLight,
                  color: COLORS.gray,
                  fontWeight: 900,
                  fontSize: "8px",
                  "& .MuiChip-icon": {
                    color: COLORS.gray,
                    fontSize: 14,
                  },
                }}
              />
            </Stack>
          </Paper>

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
            <MiniCard
              title="رسوم الباص"
              value={formatMoney(0)}
              icon={ReceiptLongRounded}
              color={COLORS.blue}
              background={COLORS.blueLight}
            />

            <MiniCard
              title="المدفوع"
              value={formatMoney(0)}
              icon={PaymentsRounded}
              color={COLORS.green}
              background={COLORS.greenLight}
            />

            <MiniCard
              title="عدد الأقساط"
              value="0"
              icon={EventRounded}
              color={COLORS.purple}
              background={COLORS.purpleLight}
            />
          </Box>
        </Box>
      </Container>
    );
  }

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
            HEADER
        ============================================ */}

        <PageHeader
          onBack={() =>
            navigate("/student-dashboard")
          }
        />

        {/* ============================================
            BUS INFO
        ============================================ */}

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
            spacing={1.2}
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
                  borderRadius: "13px",
                  bgcolor: COLORS.goldLight,
                  color: COLORS.gold,
                }}
              >
                <DirectionsBusRounded />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.deepNavy,
                    fontSize: "14px",
                    fontWeight: 900,
                  }}
                >
                  تفاصيل اشتراك الباص
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    color: COLORS.gray,
                    fontSize: "8px",
                  }}
                >
                  {student?.name
                    ? `الطالب: ${student.name}`
                    : "تفاصيل الخدمة والأقساط"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.7}
              useFlexGap
              flexWrap="wrap"
            >
              <Chip
                icon={<CheckCircleRounded />}
                label="مشترك"
                sx={{
                  height: 29,
                  bgcolor: COLORS.greenLight,
                  color: COLORS.green,
                  fontWeight: 900,
                  fontSize: "8px",
                  "& .MuiChip-icon": {
                    color: COLORS.green,
                    fontSize: 14,
                  },
                }}
              />

              <Chip
                icon={<DirectionsBusRounded />}
                label={mapBusServiceType(
                  bus?.serviceType
                )}
                sx={{
                  height: 29,
                  bgcolor: COLORS.blueLight,
                  color: COLORS.blue,
                  fontWeight: 900,
                  fontSize: "8px",
                  "& .MuiChip-icon": {
                    color: COLORS.blue,
                    fontSize: 14,
                  },
                }}
              />

              <Chip
                label={mapFeeStatus(
                  bus?.status
                )}
                sx={{
                  height: 29,
                  bgcolor:
                    getStatusTheme(
                      bus?.status
                    ).background,
                  color:
                    getStatusTheme(
                      bus?.status
                    ).color,
                  fontWeight: 900,
                  fontSize: "8px",
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
          <MiniCard
            title="إجمالي رسوم الباص"
            value={formatMoney(fee)}
            icon={ReceiptLongRounded}
            color={COLORS.blue}
            background={COLORS.blueLight}
          />

          <MiniCard
            title="إجمالي المدفوع"
            value={formatMoney(totalPaid)}
            icon={PaymentsRounded}
            color={COLORS.green}
            background={COLORS.greenLight}
          />

          <MiniCard
            title="المتبقي"
            value={formatMoney(remaining)}
            icon={AccountBalanceWalletRounded}
            color={COLORS.red}
            background={COLORS.redLight}
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
            sx={{ mb: 1.2 }}
          >
            <Box>
              <Typography
                sx={{
                  color: COLORS.deepNavy,
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                أقساط الباص
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: COLORS.gray,
                  fontSize: "8px",
                }}
              >
                تفاصيل المبالغ ومواعيد الاستحقاق
              </Typography>
            </Box>

            <Chip
              icon={<EventRounded />}
              label={`${installments.length} أقساط`}
              sx={{
                height: 29,
                bgcolor: COLORS.purpleLight,
                color: COLORS.purple,
                fontWeight: 900,
                fontSize: "8px",
                "& .MuiChip-icon": {
                  color: COLORS.purple,
                  fontSize: 14,
                },
              }}
            />
          </Stack>

          {installments.length === 0 ? (
            <Box
              sx={{
                minHeight: 96,
                display: "grid",
                placeItems: "center",
                borderRadius: "14px",
                bgcolor: COLORS.grayLight,
                border: "1px dashed #dfe5eb",
              }}
            >
              <Typography
                sx={{
                  color: COLORS.gray,
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                لا توجد أقساط لعرضها
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
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "0.65fr 1fr 1fr 1fr 0.9fr",
                    gap: 0.7,
                    px: 1.1,
                    py: 0.9,
                    mb: 0.6,
                    borderRadius: "12px",
                    bgcolor: COLORS.grayLight,
                  }}
                >
                  {[
                    "القسط",
                    "المبلغ",
                    "المدفوع",
                    "الاستحقاق",
                    "الحالة",
                  ].map((label) => (
                    <Typography
                      key={label}
                      sx={{
                        color: COLORS.gray,
                        fontSize: "8px",
                        fontWeight: 900,
                      }}
                    >
                      {label}
                    </Typography>
                  ))}
                </Box>

                <Stack spacing={0.7}>
                  {installments.map(
                    (item, index) => {
                      const theme =
                        getStatusTheme(
                          item?.status
                        );

                      return (
                        <Box
                          key={
                            item?._id ||
                            item?.installmentNumber ||
                            index
                          }
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "0.65fr 1fr 1fr 1fr 0.9fr",
                            gap: 0.7,
                            alignItems: "center",
                            px: 1.1,
                            py: 1,
                            borderRadius: "12px",
                            border: `1px solid ${COLORS.border}`,
                            bgcolor: "#fff",
                            "&:hover": {
                              bgcolor: "#fbfdff",
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              color: COLORS.deepNavy,
                              fontSize: "10px",
                              fontWeight: 900,
                            }}
                          >
                            #
                            {item?.installmentNumber ??
                              index + 1}
                          </Typography>

                          <Typography
                            sx={{
                              color: COLORS.deepNavy,
                              fontSize: "10px",
                              fontWeight: 800,
                            }}
                          >
                            {formatMoney(
                              item?.amount
                            )}
                          </Typography>

                          <Typography
                            sx={{
                              color: COLORS.green,
                              fontSize: "10px",
                              fontWeight: 800,
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
                                color: COLORS.gray,
                                fontSize: 14,
                              }}
                            />

                            <Typography
                              sx={{
                                color: COLORS.deepNavy,
                                fontSize: "9px",
                                fontWeight: 700,
                              }}
                            >
                              {formatDate(
                                item?.dueDate
                              )}
                            </Typography>
                          </Stack>

                          <Chip
                            label={mapInstallmentStatus(
                              item?.status
                            )}
                            sx={{
                              justifySelf: "start",
                              height: 26,
                              bgcolor: theme.background,
                              color: theme.color,
                              fontWeight: 900,
                              fontSize: "7px",
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
            bgcolor: COLORS.blueLight,
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
              color: COLORS.deepNavy,
              fontWeight: 900,
              fontSize: {
                xs: "16px",
                md: "19px",
              },
            }}
          >
            خطة الباص
          </Typography>

          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "8px",
            }}
          >
            الاشتراك والرسوم والأقساط
          </Typography>
        </Box>
      </Stack>

      <Avatar
        variant="rounded"
        sx={{
          width: 42,
          height: 42,
          borderRadius: "13px",
          bgcolor: COLORS.goldLight,
          color: COLORS.gold,
        }}
      >
        <DirectionsBusRounded />
      </Avatar>
    </Stack>
  </Paper>
);

// =====================================================
// MINI CARD
// =====================================================

const MiniCard = ({
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
      <Icon sx={{ fontSize: 21 }} />
    </Avatar>

    <Box>
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
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default MyBus;
