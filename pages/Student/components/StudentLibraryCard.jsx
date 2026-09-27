import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AutoStoriesRounded,
  CalendarMonthRounded,
  MenuBookRounded,
  OpenInNewRounded,
} from "@mui/icons-material";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",

  blue: "#4e8dcc",
  blueLight: "#edf6ff",

  green: "#2ca39a",
  greenLight: "#eaf8f5",
};

// =====================================================
// HELPERS
// =====================================================

const asText = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value).trim();
  }

  return "";
};

const getSubjectEntity = (
  item
) => {
  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    null;

  if (
    offering &&
    typeof offering === "object"
  ) {
    return (
      offering?.subjectId ||
      offering?.subject ||
      null
    );
  }

  return (
    item?.subjectId ||
    item?.subject ||
    null
  );
};

const getSubjectName = (
  item
) => {
  const subject =
    getSubjectEntity(item);

  if (
    typeof subject === "string"
  ) {
    return (
      item?.subjectName ||
      "بدون مادة"
    );
  }

  return (
    subject?.subjectName ||
    subject?.name ||
    item?.subjectName ||
    "بدون مادة"
  );
};

const getAcademicYear = (
  item
) => {
  const offering =
    item?.subjectOfferingId ||
    item?.subjectOffering ||
    null;

  const academicYear =
    item?.academicYearId ||
    item?.academicYear ||
    offering?.academicYearId ||
    offering?.academicYear ||
    offering?.termId
      ?.academicYearId ||
    item?.termId
      ?.academicYearId ||
    null;

  if (
    typeof academicYear ===
    "string"
  ) {
    return (
      item?.academicYearName ||
      "غير محددة"
    );
  }

  return (
    academicYear?.name ||
    item?.academicYearName ||
    "غير محددة"
  );
};

const normalizeUrlValue = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  if (
    typeof value === "object"
  ) {
    return (
      asText(value?.url) ||
      asText(value?.link) ||
      asText(value?.path) ||
      asText(value?.fileUrl) ||
      asText(value?.secure_url)
    );
  }

  return "";
};

const getFileUrl = (
  item
) => {
  // Digital Library API uses `link` as the resource URL.
  // Keep the fallbacks for older/alternate response shapes.
  const candidates = [
    item?.link,
    item?.url,
    item?.fileUrl,
    item?.resourceUrl,
    item?.resourceLink,
    item?.attachment,
    item?.file,
    item?.documentUrl,
    item?.path,
  ];

  for (
    const candidate of candidates
  ) {
    const url =
      normalizeUrlValue(
        candidate
      );

    if (url) {
      return url;
    }
  }

  return "";
};

// =====================================================
// COMPONENT
// =====================================================

const StudentLibraryCard = ({
  item,
}) => {
  const title =
    item?.title ||
    item?.name ||
    "عنصر تعليمي";

  const subjectName =
    getSubjectName(item);

  const academicYear =
    getAcademicYear(item);

  const fileUrl =
    getFileUrl(item);

  const handleOpen = () => {
    if (!fileUrl) {
      return;
    }

    window.open(
      fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 195,

        p: 1.35,

        display: "flex",
        flexDirection:
          "column",

        borderRadius:
          "17px",

        border:
          "1px solid rgba(36,74,112,.09)",

        backgroundColor:
          "#fff",

        boxShadow:
          "0 5px 16px rgba(18,47,77,.03)",

        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",

        "&:hover": {
          transform:
            "translateY(-2px)",

          borderColor:
            "rgba(78,141,204,.2)",

          boxShadow:
            "0 9px 22px rgba(18,47,77,.065)",
        },
      }}
    >
      {/* =============================================
          TOP
      ============================================= */}

      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={0.7}
      >
        <Box
          sx={{
            width: 42,
            height: 42,

            flexShrink: 0,

            display: "grid",

            placeItems:
              "center",

            borderRadius:
              "13px",

            color:
              COLORS.green,

            backgroundColor:
              COLORS.blueLight,
          }}
        >
          <AutoStoriesRounded
            sx={{
              fontSize: 21,
            }}
          />
        </Box>

        <Chip
          label="مكتبة"
          size="small"
          sx={{
            height: 21,

            color:
              COLORS.blue,

            backgroundColor:
              COLORS.blueLight,

            fontSize: "6.5px",

            fontWeight: 900,

            "& .MuiChip-label":
              {
                px: 0.8,
              },
          }}
        />
      </Stack>

      {/* =============================================
          TITLE
      ============================================= */}

      <Typography
        sx={{
          mt: 1,

          color:
            COLORS.deepNavy,

          fontSize: "11.5px",

          fontWeight: 900,

          lineHeight: 1.4,

          overflow: "hidden",

          display:
            "-webkit-box",

          WebkitLineClamp: 2,

          WebkitBoxOrient:
            "vertical",
        }}
      >
        {title}
      </Typography>

      {/* =============================================
          META
      ============================================= */}

      <Stack
        spacing={0.35}
        sx={{
          mt: 0.7,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.45}
        >
          <MenuBookRounded
            sx={{
              color:
                COLORS.green,

              fontSize: 12.5,
            }}
          />

          <Typography
            noWrap
            sx={{
              minWidth: 0,

              color:
                "#7d8994",

              fontSize: "7px",
            }}
          >
            {subjectName}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.45}
        >
          <CalendarMonthRounded
            sx={{
              color:
                COLORS.gold,

              fontSize: 12.5,
            }}
          />

          <Typography
            noWrap
            sx={{
              minWidth: 0,

              color:
                "#7d8994",

              fontSize: "7px",
            }}
          >
            {academicYear}
          </Typography>
        </Stack>
      </Stack>

      {/* =============================================
          ACTION
      ============================================= */}

      <Box
        sx={{
          mt: "auto",
          pt: 1,
        }}
      >
        <Button
          fullWidth
          disabled={!fileUrl}
          onClick={
            handleOpen
          }
          endIcon={
            <OpenInNewRounded />
          }
          sx={{
            minHeight: 34,

            borderRadius:
              "10px",

            color: "#fff",

            backgroundColor:
              COLORS.green,

            fontSize: "8px",

            fontWeight: 900,

            textTransform:
              "none",

            boxShadow:
              "none",

            "& .MuiButton-endIcon":
              {
                mr: 0.5,
                ml: 0,
              },

            "& svg": {
              fontSize:
                "14px !important",
            },

            "&:hover": {
              backgroundColor:
                "#258f88",

              boxShadow:
                "none",
            },

            "&.Mui-disabled":
              {
                color:
                  "#aab3bb",

                backgroundColor:
                  "#f0f2f4",
              },
          }}
        >
          {fileUrl
            ? "فتح الملف"
            : "الرابط غير متاح"}
        </Button>
      </Box>
    </Paper>
  );
};

export default StudentLibraryCard;
