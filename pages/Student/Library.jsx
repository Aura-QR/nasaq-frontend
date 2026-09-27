import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  ArrowForwardRounded,
  AutoStoriesRounded,
  CalendarMonthRounded,
  MenuBookRounded,
  SearchRounded,
  SchoolRounded,
  TuneRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Container from "@/components/Container/Container";
import StudentLibraryCard from "./components/StudentLibraryCard";

import useDebounce from "@/utils/hooks/useDebounce";

import {
  useSubjects,
} from "@/utils/hooks/apis/useSubjects";

import {
  useLibraries,
} from "@/utils/hooks/apis/useLibraries";

import {
  useAcademicYears,
} from "@/utils/hooks/apis/useAcademicYears";

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  navy: "#244a70",
  deepNavy: "#122f4d",
  gold: "#d3a44f",

  blue: "#4e8dcc",
  blueLight: "#edf6ff",

  green: "#43a978",
  greenLight: "#eaf8f1",

  orange: "#e69a43",
  orangeLight: "#fff3e4",
};

// =====================================================
// MAIN
// =====================================================

const Library = () => {
  const navigate = useNavigate();

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    itemName,
    setItemName,
  ] = useState("");

  const [
    subject,
    setSubject,
  ] = useState("");

  const [
    academicYearId,
    setAcademicYearId,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const limit = 12;

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  // ===================================================
  // DEBOUNCE
  // ===================================================

  const debouncedItemName =
    useDebounce(
      itemName,
      500
    );

  // ===================================================
  // SUBJECTS
  // ===================================================

  const {
    subjects = [],
    loading:
      loadingSubjects,
  } = useSubjects();

  // ===================================================
  // ACADEMIC YEARS
  // ===================================================

  const {
    academicYears = [],
    loadingAcademicYears,
  } = useAcademicYears();

  // ===================================================
  // SUBJECT OPTIONS
  // ===================================================

  const subjectOptions =
    useMemo(() => {
      const list =
        Array.isArray(subjects)
          ? subjects
          : [];

      return list
        .map((item) => ({
          value: String(
            item?._id ||
              item?.id ||
              ""
          ),

          label:
            item?.subjectCode
              ? `${item?.subjectName || "مادة"} - ${item.subjectCode}`
              : item?.subjectName ||
                item?.name ||
                "مادة",
        }))
        .filter(
          (item) =>
            Boolean(item.value)
        );
    }, [subjects]);

  // ===================================================
  // ACADEMIC YEAR OPTIONS
  // ===================================================

  const academicYearOptions =
    useMemo(() => {
      const list =
        Array.isArray(
          academicYears
        )
          ? academicYears
          : [];

      return list
        .map((year) => ({
          value: String(
            year?._id ||
              year?.id ||
              ""
          ),

          label:
            year?.status ===
            "active"
              ? `${year?.name || "السنة الدراسية"} - الحالية`
              : year?.name ||
                "السنة الدراسية",

          active:
            year?.status ===
            "active",
        }))
        .filter(
          (year) =>
            Boolean(year.value)
        );
    }, [academicYears]);

  // ===================================================
  // FILTERS
  // ===================================================

  const filters =
    useMemo(
      () => ({
        page,
        limit,

        title:
          debouncedItemName ||
          undefined,

        subjectId:
          subject ||
          undefined,

        academicYearId:
          academicYearId ||
          undefined,
      }),
      [
        page,
        debouncedItemName,
        subject,
        academicYearId,
      ]
    );

  // ===================================================
  // LIBRARY API
  // ===================================================

  const {
    libraries,
    loading,
    pagination,
  } = useLibraries(
    filters
  );

  // ===================================================
  // SYNC
  // ===================================================

  useEffect(() => {
    if (
      Array.isArray(libraries)
    ) {
      setItems(
        libraries
      );
    } else {
      setItems([]);
    }

    setLocalPagination(
      pagination || null
    );
  }, [
    libraries,
    pagination,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedItemName,
    subject,
    academicYearId,
  ]);

  // ===================================================
  // ACTIVE YEAR
  // ===================================================

  const activeYear =
    useMemo(
      () =>
        academicYearOptions.find(
          (year) =>
            year.active
        ),
      [
        academicYearOptions,
      ]
    );

  // ===================================================
  // HELPERS
  // ===================================================

  const clearFilters = () => {
    setItemName("");
    setSubject("");
    setAcademicYearId("");
    setPage(1);
  };

  const hasFilters =
    Boolean(
      itemName ||
        subject ||
        academicYearId
    );

  const totalItems =
    useMemo(() => {
      const total =
        Number(
          localPagination?.total ??
            localPagination?.totalItems ??
            localPagination?.count
        );

      if (
        Number.isFinite(total) &&
        total >= 0
      ) {
        return total;
      }

      return items.length;
    }, [
      localPagination,
      items.length,
    ]);

  const paginationCount =
    useMemo(() => {
      if (!localPagination) {
        return 1;
      }

      const directCount =
        Number(
          localPagination?.totalPages ??
            localPagination?.pages ??
            localPagination?.pageCount
        );

      if (
        Number.isFinite(
          directCount
        ) &&
        directCount > 0
      ) {
        return directCount;
      }

      return Math.max(
        1,
        Math.ceil(
          totalItems / limit
        )
      );
    }, [
      localPagination,
      totalItems,
    ]);

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    items.length === 0
  ) {
    return (
      <Container
        noSidebar={true}
      >
        <Stack spacing={1.25}>
          <Skeleton
            variant="rounded"
            height={92}
            sx={{
              borderRadius:
                "20px",
            }}
          />

          <Skeleton
            variant="rounded"
            height={60}
            sx={{
              borderRadius:
                "16px",
            }}
          />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns:
                {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                  md: "repeat(3,minmax(0,1fr))",
                  lg: "repeat(4,minmax(0,1fr))",
                },

              gap: 1,
            }}
          >
            {[1, 2, 3, 4].map(
              (item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={205}
                  sx={{
                    borderRadius:
                      "18px",
                  }}
                />
              )
            )}
          </Box>
        </Stack>
      </Container>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Container
      noSidebar={true}
    >
      <Box
        dir="rtl"
        sx={{
          width: "100%",
        }}
      >
        {/* =============================================
            HEADER
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,

            px: {
              xs: 1.25,
              sm: 1.6,
              md: 2,
            },

            py: {
              xs: 1.15,
              md: 1.3,
            },

            display: "flex",

            alignItems: {
              xs: "flex-start",
              md: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              md: "row",
            },

            gap: 1,

            borderRadius:
              "20px",

            border:
              "1px solid rgba(18,47,77,.055)",

            background:
              "linear-gradient(120deg,#ffffff 0%,#fbfdff 65%,#edf6ff 100%)",

            boxShadow:
              "0 8px 24px rgba(18,47,77,.04)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.9}
          >
            <IconButton
              onClick={() =>
                navigate(
                  "/student-dashboard"
                )
              }
              sx={{
                width: 39,
                height: 39,

                borderRadius:
                  "12px",

                color:
                  COLORS.navy,

                backgroundColor:
                  "#f2f6fa",

                border:
                  "1px solid rgba(36,74,112,.06)",

                "&:hover": {
                  backgroundColor:
                    "#e8f0f7",
                },
              }}
            >
              <ArrowForwardRounded
                sx={{
                  fontSize: 20,
                }}
              />
            </IconButton>

            <Box
              sx={{
                width: 42,
                height: 42,

                display: {
                  xs: "none",
                  sm: "grid",
                },

                placeItems:
                  "center",

                borderRadius:
                  "13px",

                color:
                  COLORS.blue,

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

            <Box>
              <Typography
                component="h1"
                sx={{
                  color:
                    COLORS.deepNavy,

                  fontSize: {
                    xs: "17px",
                    md: "20px",
                  },

                  fontWeight: 900,

                  lineHeight: 1.2,
                }}
              >
                المكتبة
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,

                  color:
                    "#909ba6",

                  fontSize:
                    "8px",
                }}
              >
                استعرض المصادر والمواد التعليمية المتاحة لك
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            sx={{
              width: {
                xs: "100%",
                md: "auto",
              },

              flexWrap: "wrap",

              gap: 0.5,
            }}
          >
            <HeaderBadge
              icon={
                MenuBookRounded
              }
              label={`${totalItems} عناصر`}
              color={
                COLORS.blue
              }
              background={
                COLORS.blueLight
              }
            />

            <HeaderBadge
              icon={
                SchoolRounded
              }
              label={`${subjectOptions.length} مواد`}
              color={
                COLORS.green
              }
              background={
                COLORS.greenLight
              }
            />

            {activeYear && (
              <HeaderBadge
                icon={
                  CalendarMonthRounded
                }
                label={
                  activeYear.label
                }
                color={
                  COLORS.orange
                }
                background={
                  COLORS.orangeLight
                }
              />
            )}
          </Stack>
        </Paper>

        {/* =============================================
            FILTERS
        ============================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,

            p: 1,

            display: "grid",

            gridTemplateColumns:
              {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "1.35fr 1fr 1fr auto",
              },

            alignItems:
              "center",

            gap: 0.65,

            borderRadius:
              "16px",

            border:
              "1px solid rgba(18,47,77,.055)",

            backgroundColor:
              "#fff",

            boxShadow:
              "0 4px 14px rgba(18,47,77,.025)",
          }}
        >
          <TextField
            size="small"
            value={itemName}
            onChange={(event) =>
              setItemName(
                event?.target?.value ??
                  ""
              )
            }
            placeholder="ابحث باسم العنصر..."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded
                      sx={{
                        color:
                          COLORS.blue,

                        fontSize:
                          18,
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  height: 38,

                  borderRadius:
                    "10px",

                  backgroundColor:
                    "#f8fafb",

                  fontSize:
                    "8.5px",

                  "& fieldset":
                    {
                      borderColor:
                        "rgba(36,74,112,.08)",
                    },
                },
            }}
          />

          <FormControl
            size="small"
            disabled={
              loadingSubjects
            }
          >
            <Select
              displayEmpty
              value={subject ?? ""}
              onChange={(event) =>
                setSubject(
                  event?.target?.value ??
                    ""
                )
              }
              startAdornment={
                <InputAdornment position="start">
                  <MenuBookRounded
                    sx={{
                      mr: 0.5,

                      color:
                        COLORS.green,

                      fontSize:
                        17,
                    }}
                  />
                </InputAdornment>
              }
              sx={{
                height: 38,

                borderRadius:
                  "10px",

                backgroundColor:
                  "#f8fafb",

                color:
                  COLORS.navy,

                fontSize:
                  "8.5px",

                fontWeight: 800,

                "& fieldset":
                  {
                    borderColor:
                      "rgba(36,74,112,.08)",
                  },
              }}
            >
              <MenuItem value="">
                جميع المواد
              </MenuItem>

              {subjectOptions.map(
                (item) => (
                  <MenuItem
                    key={item.value}
                    value={item.value}
                    sx={{
                      fontSize:
                        "9px",
                    }}
                  >
                    {item.label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            disabled={
              loadingAcademicYears
            }
          >
            <Select
              displayEmpty
              value={
                academicYearId ?? ""
              }
              onChange={(event) =>
                setAcademicYearId(
                  event?.target?.value ??
                    ""
                )
              }
              startAdornment={
                <InputAdornment position="start">
                  <SchoolRounded
                    sx={{
                      mr: 0.5,

                      color:
                        COLORS.gold,

                      fontSize:
                        17,
                    }}
                  />
                </InputAdornment>
              }
              sx={{
                height: 38,

                borderRadius:
                  "10px",

                backgroundColor:
                  "#f8fafb",

                color:
                  COLORS.navy,

                fontSize:
                  "8.5px",

                fontWeight: 800,

                "& fieldset":
                  {
                    borderColor:
                      "rgba(36,74,112,.08)",
                  },
              }}
            >
              <MenuItem value="">
                جميع السنوات
              </MenuItem>

              {academicYearOptions.map(
                (year) => (
                  <MenuItem
                    key={year.value}
                    value={year.value}
                    sx={{
                      fontSize:
                        "9px",
                    }}
                  >
                    {year.label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <Chip
            icon={
              <TuneRounded />
            }
            label={
              hasFilters
                ? "مسح الفلاتر"
                : "الفلاتر"
            }
            onClick={
              hasFilters
                ? clearFilters
                : undefined
            }
            sx={{
              height: 36,

              cursor:
                hasFilters
                  ? "pointer"
                  : "default",

              color:
                hasFilters
                  ? COLORS.navy
                  : "#9aa4ae",

              backgroundColor:
                hasFilters
                  ? "#f1f5f8"
                  : "#f8fafb",

              border:
                "1px solid rgba(36,74,112,.07)",

              fontSize:
                "7.5px",

              fontWeight: 800,

              "& .MuiChip-icon":
                {
                  color:
                    hasFilters
                      ? COLORS.blue
                      : "#adb6be",

                  fontSize:
                    "15px",
                },
            }}
          />
        </Paper>

        {/* =============================================
            RESULT HEADER
        ============================================= */}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mb: 0.75,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  COLORS.deepNavy,

                fontSize: {
                  xs: "12px",
                  md: "14px",
                },

                fontWeight: 900,
              }}
            >
              العناصر التعليمية
            </Typography>

            <Typography
              sx={{
                mt: 0.05,

                color:
                  "#98a2ac",

                fontSize:
                  "7px",
              }}
            >
              اختر العنصر لفتح المصدر
            </Typography>
          </Box>

          <Chip
            label={`${totalItems} نتيجة`}
            sx={{
              height: 26,

              color:
                COLORS.blue,

              backgroundColor:
                COLORS.blueLight,

              fontSize:
                "7px",

              fontWeight: 900,
            }}
          />
        </Stack>

        {/* =============================================
            CARDS
        ============================================= */}

        {items.length > 0 ? (
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns:
                {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                  md: "repeat(3,minmax(0,1fr))",
                  lg: "repeat(4,minmax(0,1fr))",
                },

              gap: 1,

              alignItems:
                "stretch",
            }}
          >
            {items.map(
              (
                item,
                index
              ) => (
                <StudentLibraryCard
                  key={
                    item?._id ||
                    item?.id ||
                    index
                  }
                  item={item}
                />
              )
            )}
          </Box>
        ) : (
          <EmptyLibrary
            filtering={
              hasFilters
            }
          />
        )}

        {/* =============================================
            PAGINATION
        ============================================= */}

        {localPagination &&
          paginationCount > 1 && (
            <Box
              sx={{
                mt: 2,

                display: "flex",

                justifyContent:
                  "center",
              }}
            >
              <Pagination
                page={page}
                count={
                  paginationCount
                }
                onChange={(
                  _event,
                  newPage
                ) => {
                  setPage(newPage);

                  window.scrollTo({
                    top: 0,
                    behavior:
                      "smooth",
                  });
                }}
                shape="rounded"
                sx={{
                  direction:
                    "ltr",

                  "& .MuiPaginationItem-root":
                    {
                      minWidth:
                        32,

                      height: 32,

                      borderRadius:
                        "9px",

                      color:
                        COLORS.navy,

                      fontSize:
                        "10px",

                      fontWeight:
                        800,
                    },

                  "& .Mui-selected":
                    {
                      color:
                        "#fff !important",

                      backgroundColor:
                        `${COLORS.navy} !important`,
                    },
                }}
              />
            </Box>
          )}
      </Box>
    </Container>
  );
};

// =====================================================
// HEADER BADGE
// =====================================================

const HeaderBadge = ({
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

      backgroundColor:
        background,

      border:
        "1px solid rgba(36,74,112,.055)",

      fontSize: "7px",

      fontWeight: 900,

      "& .MuiChip-label": {
        px: 0.8,
      },

      "& .MuiChip-icon": {
        mr: 0.45,
        ml: -0.1,

        color,

        fontSize: "14px",
      },
    }}
  />
);

// =====================================================
// EMPTY
// =====================================================

const EmptyLibrary = ({
  filtering,
}) => (
  <Paper
    elevation={0}
    sx={{
      minHeight: {
        xs: 250,
        md: 285,
      },

      px: 2,
      py: 3,

      display: "grid",

      placeItems:
        "center",

      textAlign:
        "center",

      borderRadius:
        "20px",

      border:
        "1px dashed rgba(36,74,112,.14)",

      background:
        "linear-gradient(145deg,#ffffff,#f9fbfd)",
    }}
  >
    <Box>
      <Box
        sx={{
          width: 66,
          height: 66,

          mx: "auto",
          mb: 1,

          display: "grid",

          placeItems:
            "center",

          borderRadius:
            "19px",

          color:
            COLORS.blue,

          backgroundColor:
            COLORS.blueLight,
        }}
      >
        <AutoStoriesRounded
          sx={{
            fontSize: 31,
          }}
        />
      </Box>

      <Typography
        sx={{
          color:
            COLORS.deepNavy,

          fontSize: {
            xs: "13px",
            md: "15px",
          },

          fontWeight: 900,
        }}
      >
        {filtering
          ? "لا توجد نتائج مطابقة"
          : "لا توجد عناصر في المكتبة"}
      </Typography>

      <Typography
        sx={{
          maxWidth: 390,

          mt: 0.4,

          color:
            "#8d99a5",

          fontSize:
            "8px",

          lineHeight: 1.8,
        }}
      >
        {filtering
          ? "جرّب تغيير كلمة البحث أو المادة أو السنة الدراسية."
          : "ستظهر هنا المصادر والمواد التعليمية المتاحة لك بمجرد إضافتها."}
      </Typography>
    </Box>
  </Paper>
);

export default Library;
