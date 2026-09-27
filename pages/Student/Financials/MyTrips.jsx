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
  ArrowBackRounded,
  CheckCircleRounded,
  EventRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  RouteRounded,
  ScheduleRounded,
  TravelExploreRounded,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";

import { useMyTripsOverview } from "@/utils/hooks/apis/financials/useTrips";

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

// =====================================================
// HELPERS
// =====================================================

const tripStatusMap = {
  paid: "مدفوعة",
  partial: "مدفوعة جزئيًا",
  unpaid: "غير مدفوعة",
};

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

const getTripRemaining = (trip) => {
  if (
    trip?.remaining !== undefined &&
    trip?.remaining !== null
  ) {
    const value = Number(trip.remaining);
    return Number.isFinite(value) ? value : 0;
  }

  const fee = Number(
    trip?.discount
      ? trip?.netFee
      : trip?.fee || 0
  );

  const paid = Number(
    trip?.totalPaid || 0
  );

  return Math.max(fee - paid, 0);
};

// =====================================================
// PAGE
// =====================================================

const MyTrips = () => {
  const navigate = useNavigate();

  const {
    allTrips = [],
    enrolledTrips = [],
    loading,
  } = useMyTripsOverview();

  if (loading) {
    return (
      <Container noSidebar={true}>
        <Loading />
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
            OVERVIEW
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
                  bgcolor: COLORS.greenLight,
                  color: COLORS.green,
                }}
              >
                <TravelExploreRounded />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color: COLORS.deepNavy,
                    fontSize: "14px",
                    fontWeight: 900,
                  }}
                >
                  ملخص الرحلات
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    color: COLORS.gray,
                    fontSize: "8px",
                  }}
                >
                  الرحلات المتاحة والرحلات المشترك بها
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
                icon={<RouteRounded />}
                label={`${allTrips.length} رحلة متاحة`}
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
                icon={<CheckCircleRounded />}
                label={`${enrolledTrips.length} مشترك بها`}
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
            </Stack>
          </Stack>
        </Paper>

        {/* ============================================
            ALL TRIPS
        ============================================ */}

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
                كل الرحلات المتاحة
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: COLORS.gray,
                  fontSize: "8px",
                }}
              >
                الرحلات المضافة من المدرسة
              </Typography>
            </Box>

            <Chip
              label={`${allTrips.length} رحلة`}
              sx={{
                height: 28,
                bgcolor: COLORS.grayLight,
                color: COLORS.navy,
                fontWeight: 900,
                fontSize: "8px",
              }}
            />
          </Stack>

          {allTrips.length === 0 ? (
            <EmptyState
              icon={RouteRounded}
              title="لا توجد رحلات متاحة حاليًا"
              description="ستظهر الرحلات هنا عند إضافتها من المدرسة"
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2,minmax(0,1fr))",
                  xl: "repeat(3,minmax(0,1fr))",
                },
                gap: 1,
              }}
            >
              {allTrips.map((trip, index) => (
                <AvailableTripCard
                  key={
                    trip?.tripTemplateId ||
                    trip?._id ||
                    trip?.id ||
                    index
                  }
                  trip={trip}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* ============================================
            ENROLLED TRIPS
        ============================================ */}

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
                الرحلات المشترك بها
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color: COLORS.gray,
                  fontSize: "8px",
                }}
              >
                تفاصيل الرسوم والأقساط للرحلات المسجلة
              </Typography>
            </Box>

            <Chip
              label={`${enrolledTrips.length} رحلة`}
              sx={{
                height: 28,
                bgcolor: COLORS.greenLight,
                color: COLORS.green,
                fontWeight: 900,
                fontSize: "8px",
              }}
            />
          </Stack>

          {enrolledTrips.length === 0 ? (
            <EmptyState
              icon={TravelExploreRounded}
              title="أنت غير مشترك حاليًا في أي رحلة"
              description="ستظهر تفاصيل الرحلات المسجلة هنا"
            />
          ) : (
            <Stack spacing={1}>
              {enrolledTrips.map((trip, index) => (
                <EnrolledTripCard
                  key={
                    trip?.tripId ||
                    trip?._id ||
                    trip?.id ||
                    index
                  }
                  trip={trip}
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

// =====================================================
// HEADER
// =====================================================

const PageHeader = ({ onBack }) => (
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
            border: "1px solid #dde9f4",
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
            رحلاتي
          </Typography>

          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "8px",
            }}
          >
            الرحلات المتاحة والاشتراكات والمدفوعات
          </Typography>
        </Box>
      </Stack>

      <Avatar
        variant="rounded"
        sx={{
          width: 42,
          height: 42,
          borderRadius: "13px",
          bgcolor: COLORS.greenLight,
          color: COLORS.green,
        }}
      >
        <TravelExploreRounded />
      </Avatar>
    </Stack>
  </Paper>
);

// =====================================================
// AVAILABLE TRIP CARD
// =====================================================

const AvailableTripCard = ({ trip }) => {
  const enrolled = Boolean(
    trip?.isEnrolled
  );

  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: "15px",
        border: `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
        transition: ".2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 8px 20px rgba(18,47,77,.05)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
      >
        <Stack
          direction="row"
          spacing={0.8}
          sx={{ minWidth: 0 }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 38,
              height: 38,
              borderRadius: "11px",
              bgcolor: enrolled
                ? COLORS.greenLight
                : COLORS.blueLight,
              color: enrolled
                ? COLORS.green
                : COLORS.blue,
            }}
          >
            <RouteRounded
              sx={{ fontSize: 19 }}
            />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: COLORS.deepNavy,
                fontSize: "11px",
                fontWeight: 900,
              }}
            >
              {trip?.name || "رحلة"}
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                color: COLORS.gray,
                fontSize: "8px",
                lineHeight: 1.6,
                minHeight: 25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {trip?.description ||
                "لا يوجد وصف"}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={
            enrolled
              ? "مشترك"
              : "غير مشترك"
          }
          sx={{
            height: 25,
            flexShrink: 0,
            bgcolor: enrolled
              ? COLORS.greenLight
              : COLORS.grayLight,
            color: enrolled
              ? COLORS.green
              : COLORS.gray,
            fontSize: "7px",
            fontWeight: 900,
          }}
        />
      </Stack>

      <Box
        sx={{
          mt: 1,
          display: "grid",
          gridTemplateColumns:
            "repeat(2,minmax(0,1fr))",
          gap: 0.7,
        }}
      >
        <SmallMoneyTile
          title="رسوم الرحلة"
          value={formatMoney(
            trip?.fee
          )}
          color={COLORS.blue}
          background={COLORS.blueLight}
          icon={ReceiptLongRounded}
        />

        <SmallMoneyTile
          title="المدفوع"
          value={formatMoney(
            trip?.totalPaid
          )}
          color={COLORS.green}
          background={COLORS.greenLight}
          icon={PaymentsRounded}
        />
      </Box>
    </Box>
  );
};

// =====================================================
// ENROLLED TRIP CARD
// =====================================================

const EnrolledTripCard = ({ trip }) => {
  const remaining =
    getTripRemaining(trip);

  const status =
    String(
      trip?.status || "unpaid"
    )
      .trim()
      .toLowerCase();

  const statusTheme =
    getStatusTheme(status);

  const installments =
    Array.isArray(
      trip?.installments
    )
      ? trip.installments
      : [];

  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: `1px solid ${COLORS.border}`,
        bgcolor: "#fff",
        p: 1.3,
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
          sx={{ minWidth: 0 }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 38,
              height: 38,
              borderRadius: "11px",
              bgcolor: COLORS.greenLight,
              color: COLORS.green,
            }}
          >
            <RouteRounded
              sx={{ fontSize: 19 }}
            />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: COLORS.deepNavy,
                fontSize: "11px",
                fontWeight: 900,
              }}
            >
              {trip?.name || "رحلة"}
            </Typography>

            <Typography
              sx={{
                mt: 0.1,
                color: COLORS.gray,
                fontSize: "7.5px",
              }}
            >
              تفاصيل الرسوم والأقساط
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={
            tripStatusMap[status] ||
            "غير مدفوعة"
          }
          sx={{
            height: 26,
            bgcolor:
              statusTheme.background,
            color: statusTheme.color,
            fontWeight: 900,
            fontSize: "7px",
          }}
        />
      </Stack>

      <Box
        sx={{
          mt: 1,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3,minmax(0,1fr))",
          },
          gap: 0.7,
        }}
      >
        <SmallMoneyTile
          title="رسوم الرحلة"
          value={formatMoney(
            trip?.fee
          )}
          color={COLORS.blue}
          background={COLORS.blueLight}
          icon={ReceiptLongRounded}
        />

        <SmallMoneyTile
          title="إجمالي المدفوع"
          value={formatMoney(
            trip?.totalPaid
          )}
          color={COLORS.green}
          background={COLORS.greenLight}
          icon={PaymentsRounded}
        />

        <SmallMoneyTile
          title="المتبقي"
          value={formatMoney(
            remaining
          )}
          color={COLORS.red}
          background={COLORS.redLight}
          icon={ScheduleRounded}
        />
      </Box>

      <Box
        sx={{
          mt: 1,
          pt: 1,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 0.7 }}
        >
          <Typography
            sx={{
              color: COLORS.deepNavy,
              fontSize: "9px",
              fontWeight: 900,
            }}
          >
            الأقساط
          </Typography>

          <Chip
            label={`${installments.length} قسط`}
            sx={{
              height: 24,
              bgcolor: COLORS.purpleLight,
              color: COLORS.purple,
              fontWeight: 900,
              fontSize: "7px",
            }}
          />
        </Stack>

        {installments.length === 0 ? (
          <Box
            sx={{
              minHeight: 54,
              borderRadius: "11px",
              bgcolor: COLORS.grayLight,
              border:
                "1px dashed #dfe5eb",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Typography
              sx={{
                color: COLORS.gray,
                fontSize: "8px",
                fontWeight: 700,
              }}
            >
              لا توجد أقساط لهذه الرحلة
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              overflowX: "auto",
            }}
          >
            <Box sx={{ minWidth: 680 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "0.6fr 1fr 1fr 1fr 0.9fr",
                  gap: 0.6,
                  px: 0.9,
                  py: 0.7,
                  mb: 0.5,
                  borderRadius: "10px",
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
                      fontSize: "7px",
                      fontWeight: 900,
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              <Stack spacing={0.5}>
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
                            "0.6fr 1fr 1fr 1fr 0.9fr",
                          gap: 0.6,
                          alignItems: "center",
                          px: 0.9,
                          py: 0.8,
                          borderRadius: "10px",
                          border: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <Typography
                          sx={{
                            color:
                              COLORS.deepNavy,
                            fontSize: "9px",
                            fontWeight: 900,
                          }}
                        >
                          #
                          {item?.installmentNumber ??
                            index + 1}
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              COLORS.deepNavy,
                            fontSize: "8px",
                            fontWeight: 800,
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
                            fontSize: "8px",
                            fontWeight: 800,
                          }}
                        >
                          {formatMoney(
                            item?.paidAmount
                          )}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.4}
                          alignItems="center"
                        >
                          <EventRounded
                            sx={{
                              color: COLORS.gray,
                              fontSize: 12,
                            }}
                          />

                          <Typography
                            sx={{
                              color:
                                COLORS.deepNavy,
                              fontSize: "7.5px",
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
                            height: 23,
                            bgcolor:
                              theme.background,
                            color:
                              theme.color,
                            fontWeight: 900,
                            fontSize: "6.5px",
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
      </Box>
    </Box>
  );
};

// =====================================================
// SMALL MONEY TILE
// =====================================================

const SmallMoneyTile = ({
  title,
  value,
  color,
  background,
  icon: Icon,
}) => (
  <Box
    sx={{
      p: 0.9,
      minHeight: 60,
      borderRadius: "12px",
      bgcolor: background,
      display: "flex",
      alignItems: "center",
      gap: 0.7,
    }}
  >
    <Avatar
      sx={{
        width: 30,
        height: 30,
        bgcolor: "#fff",
        color,
      }}
    >
      <Icon sx={{ fontSize: 16 }} />
    </Avatar>

    <Box sx={{ minWidth: 0 }}>
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
        noWrap
        sx={{
          mt: 0.1,
          color,
          fontSize: "10px",
          fontWeight: 900,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

// =====================================================
// EMPTY STATE
// =====================================================

const EmptyState = ({
  icon: Icon,
  title,
  description,
}) => (
  <Box
    sx={{
      minHeight: 100,
      borderRadius: "14px",
      bgcolor: COLORS.grayLight,
      border: "1px dashed #dfe5eb",
      display: "grid",
      placeItems: "center",
      px: 2,
      py: 1.5,
    }}
  >
    <Stack
      spacing={0.4}
      alignItems="center"
      textAlign="center"
    >
      <Icon
        sx={{
          color: "#a9b5bf",
          fontSize: 28,
        }}
      />

      <Typography
        sx={{
          color: COLORS.deepNavy,
          fontSize: "10px",
          fontWeight: 900,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          color: COLORS.gray,
          fontSize: "7.5px",
        }}
      >
        {description}
      </Typography>
    </Stack>
  </Box>
);

export default MyTrips;
