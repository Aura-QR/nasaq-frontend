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
  BadgeRounded,
  GroupsRounded,
  MeetingRoomRounded,
  PersonRounded,
  SchoolRounded,
  WcRounded,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import Container from "@/components/Container/Container";
import { translateGender } from "@/utils/helpers/translateGender";

import { useStudentClass } from "@/utils/hooks/apis/student/useStudent";

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
  gold: "#d3a44f",
  goldLight: "#fff8e9",
  purple: "#8068c9",
  purpleLight: "#f3efff",
  gray: "#87939e",
  grayLight: "#f6f8fa",
  border: "#e8edf2",
};

// =====================================================
// HELPERS
// =====================================================

const textValue = (
  value,
  fallback = "غير متاح"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (
    typeof value === "object"
  ) {
    return (
      value?.name ||
      value?.title ||
      value?.year ||
      value?.academicYear ||
      fallback
    );
  }

  return fallback;
};

const getTeacherName = (value) => {
  if (!value) {
    return "غير متاح";
  }

  if (typeof value === "string") {
    // لو الـ API رجع ID فقط، ما نعرضوش كأنه اسم.
    return "غير متاح";
  }

  return (
    value?.name ||
    [
      value?.firstName,
      value?.fatherName,
      value?.familyName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "غير متاح"
  );
};

const getStudentName = (student) => {
  if (!student) return "طالب";

  return (
    student?.name ||
    [
      student?.firstName,
      student?.fatherName,
      student?.familyName,
    ]
      .filter(Boolean)
      .join(" ") ||
    student?.schoolEmail ||
    "طالب"
  );
};

const getInitials = (student) => {
  const name = getStudentName(student);

  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0)
      )
      .join("") || "ط"
  );
};

const getStatusInfo = (value) => {
  const normalized =
    String(value ?? "")
      .trim()
      .toLowerCase();

  const active =
    value === true ||
    value === 1 ||
    value === "1" ||
    normalized === "active" ||
    normalized === "true";

  const inactive =
    value === false ||
    value === 0 ||
    value === "0" ||
    normalized === "inactive" ||
    normalized === "false";

  if (active) {
    return {
      label: "نشط",
      color: COLORS.green,
      background: COLORS.greenLight,
    };
  }

  if (inactive) {
    return {
      label: "غير نشط",
      color: "#cf5d55",
      background: "#fff0ef",
    };
  }

  return {
    label: "غير محدد",
    color: COLORS.gray,
    background: COLORS.grayLight,
  };
};

// =====================================================
// MAIN
// =====================================================

const MyClass = () => {
  const navigate = useNavigate();

  const {
    currentClass,
    loading,
    error,
  } = useStudentClass();

  if (loading) {
    return (
      <Container noSidebar={true}>
        <Paper
          elevation={0}
          sx={{
            minHeight: 220,
            borderRadius: "22px",
            border: `1px solid ${COLORS.border}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            جاري تحميل بيانات الفصل...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!currentClass) {
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
              minHeight: 260,
              borderRadius: "22px",
              border: `1px solid ${COLORS.border}`,
              display: "grid",
              placeItems: "center",
              p: 3,
            }}
          >
            <Stack
              spacing={1}
              alignItems="center"
              textAlign="center"
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor:
                    COLORS.blueLight,
                  color: COLORS.blue,
                }}
              >
                <SchoolRounded />
              </Avatar>

              <Typography
                sx={{
                  color:
                    COLORS.deepNavy,
                  fontWeight: 900,
                  fontSize: "16px",
                }}
              >
                لم يتم العثور على
                بيانات الفصل
              </Typography>

              <Typography
                sx={{
                  color: COLORS.gray,
                  fontSize: "11px",
                }}
              >
                {error ||
                  "لا توجد بيانات فصل مرتبطة بحساب الطالب حاليًا"}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </Container>
    );
  }

  const status =
    getStatusInfo(
      currentClass?.isActive ??
        currentClass?.status
    );

  const gender =
    currentClass?.gender
      ? translateGender(
          currentClass.gender,
          "class"
        )
      : "غير متاح";

  const roomNumber =
    textValue(
      currentClass?.roomNumber,
      "غير متاح"
    );

  const academicYear =
    textValue(
      currentClass?.academicYear ||
        currentClass?.academicYearId,
      "غير متاح"
    );

  const className =
    textValue(
      currentClass?.name ||
        currentClass?.className,
      ""
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
        <PageHeader
          onBack={() =>
            navigate(
              "/student-dashboard"
            )
          }
        />

        {/* =============================================
            HERO
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            p: {
              xs: 1.8,
              md: 2.2,
            },
            borderRadius: "22px",
            border: `1px solid ${COLORS.border}`,
            background:
              "linear-gradient(135deg,#f8fbff 0%,#ffffff 55%,#fffaf0 100%)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 130,
              height: 130,
              borderRadius: "50%",
              bgcolor:
                "rgba(78,141,204,.06)",
              top: -65,
              left: -35,
            }}
          />

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              md: "center",
            }}
            spacing={1.5}
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "16px",
                  bgcolor:
                    COLORS.blueLight,
                  color: COLORS.blue,
                }}
              >
                <SchoolRounded
                  sx={{
                    fontSize: 30,
                  }}
                />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color:
                      COLORS.deepNavy,
                    fontWeight: 900,
                    fontSize: {
                      xs: "18px",
                      md: "22px",
                    },
                    lineHeight: 1.2,
                  }}
                >
                  {roomNumber !== "غير متاح"
                    ? `الفصل ${roomNumber}`
                    : className || "صفي الدراسي"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: COLORS.gray,
                    fontSize: "9px",
                  }}
                >
                  {className
                    ? `${className} • معلومات الفصل`
                    : "معلومات الفصل الدراسي"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={0.8}
              useFlexGap
              flexWrap="wrap"
            >
              <MiniChip
                icon={
                  MeetingRoomRounded
                }
                label={`فصل ${roomNumber}`}
                color={COLORS.navy}
                background={
                  COLORS.blueLight
                }
              />

              <MiniChip
                icon={WcRounded}
                label={gender}
                color={
                  COLORS.purple
                }
                background={
                  COLORS.purpleLight
                }
              />

              <MiniChip
                icon={BadgeRounded}
                label={status.label}
                color={status.color}
                background={
                  status.background
                }
              />
            </Stack>
          </Stack>
        </Paper>

        {/* =============================================
            CLASS DETAILS
        ============================================= */}

        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
              lg: "repeat(4,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <InfoCard
            icon={SchoolRounded}
            title="السنة الدراسية"
            value={academicYear}
            color={COLORS.blue}
            background={
              COLORS.blueLight
            }
          />

          <InfoCard
            icon={MeetingRoomRounded}
            title="رقم الفصل"
            value={roomNumber}
            color={COLORS.gold}
            background={
              COLORS.goldLight
            }
          />

          <InfoCard
            icon={WcRounded}
            title="النوع"
            value={gender}
            color={COLORS.purple}
            background={
              COLORS.purpleLight
            }
          />

          <InfoCard
            icon={BadgeRounded}
            title="الحالة"
            value={status.label}
            color={status.color}
            background={
              status.background
            }
          />

          <InfoCard
            icon={GroupsRounded}
            title="أقصى سعة"
            value={
              currentClass?.maxCapacity !==
                undefined &&
              currentClass?.maxCapacity !==
                null
                ? `${currentClass.maxCapacity} طالب`
                : "غير متاح"
            }
            color={COLORS.blue}
            background={
              COLORS.blueLight
            }
          />

          {currentClass?.currentEnrollment !==
            undefined &&
            currentClass?.currentEnrollment !== null && (
              <InfoCard
                icon={GroupsRounded}
                title="عدد الطلاب"
                value={`${currentClass.currentEnrollment} طالب`}
                color={COLORS.green}
                background={COLORS.greenLight}
              />
            )}

          {currentClass?.availableSeats !==
            undefined &&
            currentClass?.availableSeats !== null && (
              <InfoCard
                icon={MeetingRoomRounded}
                title="الأماكن المتاحة"
                value={`${currentClass.availableSeats} مكان`}
                color={COLORS.gold}
                background={COLORS.goldLight}
              />
            )}

          <InfoCard
            icon={PersonRounded}
            title="رائد الفصل"
            value={getTeacherName(
              currentClass?.teacherInChargeId ||
                currentClass?.teacherInCharge
            )}
            color={COLORS.purple}
            background={
              COLORS.purpleLight
            }
          />
        </Box>

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
      py: 1.15,
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
            صفي الدراسي
          </Typography>

          <Typography
            sx={{
              color: COLORS.gray,
              fontSize: "8px",
            }}
          >
            معلومات الفصل الدراسي
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
        <SchoolRounded />
      </Avatar>
    </Stack>
  </Paper>
);

// =====================================================
// INFO CARD
// =====================================================

const InfoCard = ({
  icon: Icon,
  title,
  value,
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
          "0 8px 20px rgba(18,47,77,.06)",
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
          color:
            COLORS.deepNavy,
          fontSize: "12px",
          fontWeight: 900,
          lineHeight: 1.35,
          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

// =====================================================
// MINI CHIP
// =====================================================

const MiniChip = ({
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
      color,
      bgcolor: background,
      fontWeight: 900,
      fontSize: "8px",
      border:
        "1px solid rgba(36,74,112,.05)",
      "& .MuiChip-icon": {
        color,
        fontSize: 14,
      },
    }}
  />
);

export default MyClass;
