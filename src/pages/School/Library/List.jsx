import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  AddCircleOutlineRounded,
  FileDownloadOutlined,
  LibraryBooksRounded,
  MenuBookRounded,
  RestartAltRounded,
  SchoolRounded,
  SearchOffRounded,
  VisibilityRounded,
  OpenInNewRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CSVLink } from "react-csv";

import Container from "@/components/Container/Container";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";

import Add from "./Add";
import Edit from "./Edit";
import Delete from "./Delete";

import useDebounce from "@/utils/hooks/useDebounce";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useLibraries } from "@/utils/hooks/apis/useLibraries";
import usePermissions from "@/utils/hooks/usePermissions";
import {
  fetchLibraryAcademicYears,
} from "@/APIs/school/library";

const getArray = (value) =>
  Array.isArray(value) ? value : [];

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const getItemId = (item) =>
  normalizeId(item);

const getSubjectData = (item) => {
  if (item?.subject && typeof item.subject === "object") {
    return item.subject;
  }

  if (
    item?.subjectId &&
    typeof item.subjectId === "object"
  ) {
    return item.subjectId;
  }

  return null;
};

const getSubjectId = (item) =>
  normalizeId(
    item?.subjectId || item?.subject
  );

const getSubjectName = (item) => {
  const subject = getSubjectData(item) || {};

  const name =
    subject?.subjectName ||
    subject?.name ||
    item?.subjectName ||
    "";

  const code =
    subject?.subjectCode ||
    subject?.code ||
    item?.subjectCode ||
    "";

  if (!name) {
    return "غير محددة";
  }

  return code
    ? `${name} - ${code}`
    : name;
};

const getAcademicYearId = (item) =>
  normalizeId(
    item?.academicYearId ||
      (typeof item?.academicYear === "object"
        ? item.academicYear
        : "")
  );

const getAcademicYearData = (item) => {
  if (
    item?.academicYearId &&
    typeof item.academicYearId === "object"
  ) {
    return item.academicYearId;
  }

  if (
    item?.academicYear &&
    typeof item.academicYear === "object"
  ) {
    return item.academicYear;
  }

  return null;
};

const getAcademicYearName = (
  item,
  academicYearMap = new Map()
) => {
  const direct = getAcademicYearData(item);
  const id = getAcademicYearId(item);
  const mapped = id
    ? academicYearMap.get(id)
    : null;

  return (
    direct?.name ||
    direct?.label ||
    mapped?.name ||
    mapped?.label ||
    (typeof item?.academicYear === "string"
      ? item.academicYear
      : "") ||
    "غير محددة"
  );
};

const getResponseList = (response) => {
  const payload =
    response?.data?.data ??
    response?.data ??
    response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const enrichLibraryItem = (
  item,
  subjectMap,
  academicYearMap
) => {
  const subjectId = getSubjectId(item);
  const directSubject = getSubjectData(item);
  const subjectData =
    directSubject ||
    (subjectId
      ? subjectMap.get(subjectId)
      : null);

  const academicYearId =
    getAcademicYearId(item);

  return {
    ...item,
    _id: getItemId(item),
    id: getItemId(item),
    subjectId,
    subject: subjectData || item?.subject,
    subjectName:
      subjectData?.subjectName ||
      subjectData?.name ||
      item?.subjectName ||
      "",
    subjectCode:
      subjectData?.subjectCode ||
      subjectData?.code ||
      item?.subjectCode ||
      "",
    academicYearId,
    academicYear: getAcademicYearName(
      item,
      academicYearMap
    ),
  };
};

const CompactLibraryCard = ({
  item,
  setItems,
  setLocalPagination,
  permissions,
  academicYearMap,
}) => {
  const itemId = getItemId(item);
  const title = item?.title || "بدون عنوان";
  const link = String(item?.link || "").trim();
  const subjectName = getSubjectName(item);
  const academicYearName = getAcademicYearName(
    item,
    academicYearMap
  );

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        minHeight: 238,
        p: 1.45,
        display: "flex",
        flexDirection: "column",
        border:
          "1px solid rgba(36,74,112,0.14)",
        borderRadius: "16px",
        background:
          "linear-gradient(180deg, rgba(255,252,247,.98), rgba(255,255,255,.94))",
        boxShadow:
          "0 8px 20px rgba(18,47,77,0.055)",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",

        "&:hover": {
          transform: "translateY(-2px)",
          borderColor:
            "rgba(36,74,112,0.24)",
          boxShadow:
            "0 14px 28px rgba(18,47,77,0.09)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
      >
        <Stack direction="row" gap={0.7}>
          {permissions.edit && (
            <Edit
              item={item}
              setItems={setItems}
            />
          )}

          {permissions.delete && (
            <Delete
              id={itemId}
              setItems={setItems}
              setLocalPagination={
                setLocalPagination
              }
            />
          )}
        </Stack>

        <Box
          sx={{
            width: 46,
            height: 46,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color:
              "var(--color-navy-deep)",
            backgroundColor:
              "var(--color-gold-soft)",
            border:
              "1px solid rgba(211,164,79,.20)",
            borderRadius: "13px",

            "& svg": {
              fontSize: 23,
            },
          }}
        >
          <LibraryBooksRounded />
        </Box>
      </Stack>

      <Box sx={{ mt: 1.25, minWidth: 0 }}>
        <Typography
          title={title}
          sx={{
            color:
              "var(--color-navy-deep)",
            fontSize: "15px",
            fontWeight: 800,
            lineHeight: 1.45,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>

        <Stack spacing={0.65} sx={{ mt: 1.05 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.7}
          >
            <MenuBookRounded
              sx={{
                color:
                  "var(--color-gold-dark)",
                fontSize: 17,
              }}
            />

            <Typography
              title={subjectName}
              sx={{
                minWidth: 0,
                color:
                  "var(--color-text)",
                fontSize: "11px",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subjectName}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap={0.7}
          >
            <SchoolRounded
              sx={{
                color:
                  "var(--color-gold-dark)",
                fontSize: 17,
              }}
            />

            <Typography
              sx={{
                color:
                  "var(--color-muted)",
                fontSize: "10.5px",
                fontWeight: 700,
              }}
            >
              {academicYearName}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Button
        component="a"
        href={link || undefined}
        target="_blank"
        rel="noopener noreferrer"
        disabled={!link}
        variant="contained"
        startIcon={<OpenInNewRounded />}
        sx={{
          mt: 1.35,
          minHeight: 40,
          borderRadius: "11px",
          color:
            "var(--color-white)",
          background:
            "linear-gradient(135deg, var(--color-navy-light), var(--color-navy-dark))",
          boxShadow:
            "0 7px 16px rgba(18,47,77,.14)",
          fontSize: "11px",
          fontWeight: 800,
          textTransform: "none",

          "& .MuiButton-startIcon": {
            marginLeft: "6px",
            marginRight: 0,
          },

          "&:hover": {
            background:
              "linear-gradient(135deg, var(--color-navy), var(--color-navy-deep))",
          },
        }}
      >
        فتح المصدر
      </Button>
    </Paper>
  );
};

const List = () => {
  const [items, setItems] =
    useState([]);

  const [itemName, setItemName] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [
    academicYearId,
    setAcademicYearId,
  ] = useState("");

  const [academicYears, setAcademicYears] =
    useState([]);

  const [loadingAcademicYears, setLoadingAcademicYears] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedItemName =
    useDebounce(
      itemName,
      700
    );

  const {
    subjects = [],
    loading: loadingSubjects,
  } = useSubjects({
    page: 1,
    limit: 1000,
  });

  const subjectMap = useMemo(
    () =>
      new Map(
        getArray(subjects)
          .map((item) => [
            normalizeId(item),
            item,
          ])
          .filter(([id]) => Boolean(id))
      ),
    [subjects]
  );

  const mappedSubjects = useMemo(
    () =>
      getArray(subjects).map(
        (item) => ({
          id: normalizeId(item),
          label: item?.subjectCode
            ? `${item.subjectName} - ${item.subjectCode}`
            : item?.subjectName ||
              item?.name ||
              "مادة",
        })
      ),
    [subjects]
  );

  useEffect(() => {
    let active = true;

    const loadAcademicYears = async () => {
      setLoadingAcademicYears(true);

      const response =
        await fetchLibraryAcademicYears();

      if (!active) {
        return;
      }

      if (response?.status === false) {
        setAcademicYears([]);
      } else {
        setAcademicYears(
          getResponseList(response).map(
            (item) => ({
              id: normalizeId(item),
              name:
                item?.name ||
                item?.label ||
                item?.title ||
                "سنة دراسية",
            })
          )
        );
      }

      setLoadingAcademicYears(false);
    };

    loadAcademicYears();

    return () => {
      active = false;
    };
  }, []);

  const academicYearMap = useMemo(
    () =>
      new Map(
        academicYears.map((item) => [
          item.id,
          item,
        ])
      ),
    [academicYears]
  );

  const filters = useMemo(
    () => ({
      page,
      limit,
      title:
        debouncedItemName ||
        undefined,
      subjectId:
        subject || undefined,
      academicYearId:
        academicYearId ||
        undefined,
    }),
    [
      page,
      limit,
      debouncedItemName,
      subject,
      academicYearId,
    ]
  );

  const {
    libraries,
    loading,
    pagination,
  } = useLibraries(filters);

  const permissions =
    usePermissions("library");

  useEffect(() => {
    setItems(
      getArray(libraries).map(
        (item) =>
          enrichLibraryItem(
            item,
            subjectMap,
            academicYearMap
          )
      )
    );
  }, [
    libraries,
    subjectMap,
    academicYearMap,
  ]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination(
        pagination
      );
    }
  }, [pagination]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    debouncedItemName,
    subject,
    academicYearId,
  ]);

  const currentPagination =
    localPagination ||
    pagination;

  const activeFiltersCount = [
    itemName,
    subject,
    academicYearId,
  ].filter(Boolean).length;

  const stats = useMemo(
    () => ({
      total:
        currentPagination
          ?.totalDocs ??
        items.length,

      visible: items.length,

      subjects: new Set(
        items
          .map(getSubjectId)
          .filter(Boolean)
      ).size,

      years: new Set(
        items
          .map(getAcademicYearId)
          .filter(Boolean)
      ).size,
    }),
    [
      items,
      currentPagination,
    ]
  );

  const csvData = useMemo(
    () =>
      items.map((item) => ({
        العنوان:
          item?.title || "—",
        الرابط:
          item?.link || "—",
        المادة:
          getSubjectName(item),
        "السنة الدراسية":
          getAcademicYearName(
            item,
            academicYearMap
          ),
      })),
    [items, academicYearMap]
  );

  const resetFilters = () => {
    setItemName("");
    setSubject("");
    setAcademicYearId("");
    setPage(1);
  };

  const showEmptyState =
    !loading &&
    items.length === 0;

  const hasFilters =
    activeFiltersCount > 0;

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          pb: 4,
          overflowX: "hidden",
          color:
            "var(--color-text)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: {
              xs: 1.5,
              sm: 2,
              md: 2.4,
            },
            py: {
              xs: 1.4,
              md: 1.6,
            },
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.42))",
            boxShadow:
              "0 10px 24px rgba(18,47,77,0.06)",
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
            gap={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.8}
              >
                <Typography
                  component="h1"
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: {
                      xs: "21px",
                      md: "25px",
                    },
                    fontWeight: 800,
                    lineHeight: 1.3,
                  }}
                >
                  إدارة المكتبة
                </Typography>

                <Chip
                  label={
                    currentPagination
                      ?.totalDocs ??
                    items.length
                  }
                  size="small"
                  sx={{
                    height: 26,
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    border:
                      "1px solid rgba(211,164,79,0.24)",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}
                />
              </Stack>

              <Typography
                sx={{
                  mt: 0.45,
                  color:
                    "var(--color-muted)",
                  fontSize: "11px",
                  lineHeight: 1.6,
                }}
              >
                أضف الروابط والمصادر التعليمية ونظّمها حسب المادة والسنة الدراسية.
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems="center"
              gap={1.25}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },
                flexShrink: 0,
              }}
            >
              <Box
                component={CSVLink}
                data={csvData}
                filename="library.csv"
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                  display:
                    "inline-flex",
                  textDecoration: "none",
                }}
              >
                <Button
                  disabled={
                    items.length === 0
                  }
                  variant="outlined"
                  startIcon={
                    <FileDownloadOutlined />
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 112,
                    },
                    minHeight: 42,
                    borderRadius: "12px",
                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(255,252,247,0.84)",
                    borderColor:
                      "rgba(36,74,112,0.16)",
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "none",

                    "& .MuiButton-startIcon":
                      {
                        marginLeft:
                          "7px",
                        marginRight: 0,
                      },
                  }}
                >
                  تصدير
                </Button>
              </Box>

              {permissions.add && (
                <Add
                  setItems={setItems}
                  setLocalPagination={
                    setLocalPagination
                  }
                />
              )}
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 1.25,
            display: "grid",
            gridTemplateColumns: {
              xs:
                "repeat(2, minmax(0, 1fr))",
              lg:
                "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {[
            {
              label:
                "إجمالي العناصر",
              value: stats.total,
              icon:
                <LibraryBooksRounded />,
            },
            {
              label:
                "الظاهر في الصفحة",
              value:
                stats.visible,
              icon:
                <VisibilityRounded />,
            },
            {
              label:
                "المواد في الصفحة",
              value:
                stats.subjects,
              icon:
                <MenuBookRounded />,
            },
            {
              label:
                "السنوات في الصفحة",
              value:
                stats.years,
              icon:
                <SchoolRounded />,
            },
          ].map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              sx={{
                p: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 1.5,
                border:
                  "1px solid rgba(36,74,112,0.08)",
                borderRadius: "18px",
                backgroundColor:
                  "var(--color-cream)",
                boxShadow:
                  "0 10px 24px rgba(18,47,77,0.055)",
                transition:
                  "transform 200ms ease, box-shadow 200ms ease",

                "&:hover": {
                  transform:
                    "translateY(-3px)",
                  boxShadow:
                    "0 17px 32px rgba(18,47,77,0.10)",
                },
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color:
                      "var(--color-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {card.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  color:
                    "var(--color-gold-dark)",
                  backgroundColor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,0.22)",
                  borderRadius: "12px",

                  "& svg": {
                    fontSize: 21,
                  },
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: {
              xs: 1.5,
              md: 1.9,
            },
            py: 1.45,
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 9px 22px rgba(18,47,77,0.05)",

            "& .MuiFormControl-root":
              {
                width: "100%",
                minWidth: 0,
                margin: 0,
              },

            "& .MuiInputBase-root, & .MuiOutlinedInput-root":
              {
                minHeight: 50,
                height: 50,
                backgroundColor:
                  "var(--color-white)",
                borderRadius: "12px",
              },

            "& .MuiInputLabel-root":
              {
                px: 0.65,
                backgroundColor:
                  "var(--color-cream)",
                fontSize: "10.5px",
                fontWeight: 700,
              },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "flex-start",
            }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.35 }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                البحث والتصفية
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,
                  color:
                    "var(--color-muted)",
                  fontSize: "9.5px",
                }}
              >
                ابحث بعنوان العنصر أو حدّد المادة والسنة الدراسية.
              </Typography>
            </Box>

            <Button
              type="button"
              disabled={
                activeFiltersCount ===
                0
              }
              onClick={resetFilters}
              variant="text"
              startIcon={
                <RestartAltRounded />
              }
              sx={{
                minHeight: 36,
                px: 1.2,
                color:
                  "var(--color-navy)",
                backgroundColor:
                  "rgba(36,74,112,0.055)",
                border:
                  "1px solid rgba(36,74,112,0.075)",
                borderRadius: "11px",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "none",

                "& .MuiButton-startIcon":
                  {
                    marginLeft:
                      "5px",
                    marginRight: 0,
                  },
              }}
            >
              مسح الفلاتر
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm:
                  "repeat(2, minmax(0, 1fr))",
                lg:
                  "1.35fr 1fr 1fr",
              },
              gap: 1.5,
              minWidth: 0,

              "& > *": {
                minWidth: 0,
              },
            }}
          >
            <SearchFilter
              value={itemName}
              onChange={
                setItemName
              }
              placeholder="ابحث بعنوان العنصر..."
            />

            <SelectFilter
              value={subject}
              onChange={setSubject}
              label="المادة"
              icon={MenuBookRounded}
              allLabel="جميع المواد"
              disabled={
                loadingSubjects
              }
              options={mappedSubjects.map(
                (item) => ({
                  value: item.id,
                  label: item.label,
                })
              )}
            />

            <SelectFilter
              value={academicYearId}
              onChange={
                setAcademicYearId
              }
              label="السنة الدراسية"
              icon={SchoolRounded}
              allLabel="جميع السنوات"
              disabled={loadingAcademicYears}
              options={academicYears.map(
                (year) => ({
                  value: year.id,
                  label: year.name,
                })
              )}
            />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            overflow: "hidden",
            border:
              "1px solid rgba(36,74,112,0.08)",
            borderRadius: "18px",
            backgroundColor:
              "var(--color-cream)",
            boxShadow:
              "0 14px 32px rgba(18,47,77,0.065)",
          }}
        >
          <Box
            sx={{
              px: {
                xs: 1.5,
                md: 1.9,
              },
              py: 1.25,
              borderBottom:
                "1px solid rgba(36,74,112,0.07)",
            }}
          >
            <Typography
              sx={{
                color:
                  "var(--color-navy-deep)",
                fontSize: "16px",
                fontWeight: 800,
              }}
            >
              عناصر المكتبة
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color:
                  "var(--color-muted)",
                fontSize: "9.5px",
              }}
            >
              افتح الروابط وعدّل العناصر حسب صلاحياتك.
            </Typography>
          </Box>

          {showEmptyState ? (
            <Box
              sx={{
                minHeight: {
                  xs: 250,
                  md: 290,
                },
                px: 2,
                py: 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Stack
                alignItems="center"
                spacing={1}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    color:
                      "var(--color-gold-dark)",
                    backgroundColor:
                      "var(--color-gold-soft)",
                    border:
                      "1px solid rgba(211,164,79,0.22)",
                    borderRadius: "18px",

                    "& svg": {
                      fontSize: 30,
                    },
                  }}
                >
                  {hasFilters ? (
                    <SearchOffRounded />
                  ) : (
                    <LibraryBooksRounded />
                  )}
                </Box>

                <Typography
                  sx={{
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  {hasFilters
                    ? "لا توجد عناصر مطابقة للفلاتر"
                    : "لا توجد عناصر في المكتبة حتى الآن"}
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 390,
                    color:
                      "var(--color-muted)",
                    fontSize: "10px",
                    lineHeight: 1.7,
                  }}
                >
                  {hasFilters
                    ? "غيّر الفلاتر أو امسحها لعرض نتائج أخرى."
                    : "أضف أول رابط أو مصدر تعليمي إلى المكتبة."}
                </Typography>

                {hasFilters ? (
                  <Button
                    type="button"
                    onClick={
                      resetFilters
                    }
                    variant="outlined"
                    startIcon={
                      <RestartAltRounded />
                    }
                    sx={{
                      mt: 0.5,
                      minHeight: 42,
                      px: 2,
                      borderRadius:
                        "12px",
                      color:
                        "var(--color-navy)",
                      borderColor:
                        "rgba(36,74,112,0.18)",
                      fontWeight: 800,
                      textTransform:
                        "none",
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                ) : (
                  permissions.add && (
                    <Add
                      setItems={setItems}
                      setLocalPagination={
                        setLocalPagination
                      }
                      compact
                    />
                  )
                )}
              </Stack>
            </Box>
          ) : (
            <Box
              sx={{
                p: {
                  xs: 1,
                  md: 1.25,
                },
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 260,
                    display: "grid",
                    placeItems:
                      "center",
                    color:
                      "var(--color-muted)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  جاري تحميل عناصر المكتبة...
                </Box>
              ) : (
                <Grid
                  container
                  spacing={1.25}
                >
                  {items.map(
                    (item, index) =>
                      permissions.read && (
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          md={6}
                          lg={4}
                          xl={3}
                          key={
                            getItemId(
                              item
                            ) ||
                            index
                          }
                        >
                          <CompactLibraryCard
                            item={item}
                            setItems={setItems}
                            setLocalPagination={
                              setLocalPagination
                            }
                            permissions={permissions}
                            academicYearMap={
                              academicYearMap
                            }
                          />
                        </Grid>
                      )
                  )}
                </Grid>
              )}

              {currentPagination &&
                items.length > 0 && (
                  <PaginationControls
                    pagination={
                      currentPagination
                    }
                    page={page}
                    onPageChange={
                      setPage
                    }
                    limit={limit}
                    onLimitChange={
                      setLimit
                    }
                    label="عدد عناصر المكتبة"
                  />
                )}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default List;
