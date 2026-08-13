import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  FileDownloadOutlined,
  LibraryBooksRounded,
  LinkRounded,
  MenuBookRounded,
  OpenInNewRounded,
  RestartAltRounded,
  SearchRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { CSVLink } from "react-csv";

import Container from "@/components/Container/Container";

import PaginationControls from "@/components/Pagination";

import Add from "./Add";
import Edit from "./Edit";
import Delete from "./Delete";

import {
  useLibraries,
} from "@/utils/hooks/apis/useLibraries";

import usePermissions from "@/utils/hooks/usePermissions";

const normalizeId = (value) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        ""
    ).trim();
  }

  return String(value || "").trim();
};

const getItemId = (item) =>
  normalizeId(item);

const getOfferingObject = (
  item
) => {
  if (
    item?.subjectOffering &&
    typeof item.subjectOffering ===
      "object"
  ) {
    return item.subjectOffering;
  }

  if (
    item?.subjectOfferingId &&
    typeof item
      .subjectOfferingId ===
      "object"
  ) {
    return item.subjectOfferingId;
  }

  return null;
};

const getOfferingId = (
  item
) =>
  normalizeId(
    item?.subjectOfferingId ||
      item?.subjectOffering
  );

const getSubjectObject = (
  item
) => {
  const offering =
    getOfferingObject(item);

  const subject =
    offering?.subjectId ||
    offering?.subject ||
    item?.subjectId ||
    item?.subject;

  if (
    subject &&
    typeof subject === "object"
  ) {
    return subject;
  }

  return null;
};

const getGradeObject = (
  item
) => {
  const offering =
    getOfferingObject(item);

  const grade =
    offering?.gradeLevelId ||
    offering?.gradeLevel;

  if (
    grade &&
    typeof grade === "object"
  ) {
    return grade;
  }

  return null;
};

const getTermObject = (
  item
) => {
  const offering =
    getOfferingObject(item);

  const term =
    item?.termId ||
    item?.term ||
    offering?.termId ||
    offering?.term;

  if (
    term &&
    typeof term === "object"
  ) {
    return term;
  }

  return null;
};

const getSubjectName = (
  item
) => {
  const subject =
    getSubjectObject(item);

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
    return getOfferingId(
      item
    )
      ? "مادة غير محددة"
      : "مصدر عام";
  }

  return code
    ? `${name} - ${code}`
    : name;
};

const getGradeName = (
  item
) => {
  const grade =
    getGradeObject(item);

  return (
    grade?.name ||
    grade?.label ||
    ""
  );
};

const getTermName = (
  item
) => {
  const term =
    getTermObject(item);

  return (
    term?.name ||
    item?.termName ||
    ""
  );
};

const getOfferingLabel = (
  item
) => {
  const subject =
    getSubjectName(item);

  const grade =
    getGradeName(item);

  return [
    subject,
    grade,
  ]
    .filter(Boolean)
    .join(" — ");
};

const List = () => {
  const [items, setItems] =
    useState([]);

  /*
   * البحث هنا داخل العناصر المحملة في الصفحة.
   * لأن Backend المكتبة الحالي لم نثبت أنه يدعم title filter.
   */
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    subjectOfferingId,
    setSubjectOfferingId,
  ] = useState("");

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  /*
   * نخزن عروض المواد التي ظهرت
   * حتى لا يختفي option بعد تطبيق الفلتر.
   */
  const [
    offeringOptions,
    setOfferingOptions,
  ] = useState([]);

  const filters = useMemo(
    () => ({
      page,
      limit,

      subjectOfferingId:
        subjectOfferingId ||
        undefined,
    }),
    [
      page,
      limit,
      subjectOfferingId,
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
      Array.isArray(libraries)
        ? libraries
        : []
    );
  }, [libraries]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination(
        pagination
      );
    }
  }, [pagination]);

  /*
   * Collect subject offering options
   */
  useEffect(() => {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return;
    }

    setOfferingOptions(
      (previous) => {
        const map = new Map(
          previous.map(
            (option) => [
              option.id,
              option,
            ]
          )
        );

        items.forEach(
          (item) => {
            const id =
              getOfferingId(
                item
              );

            if (!id) {
              return;
            }

            map.set(id, {
              id,

              label:
                getOfferingLabel(
                  item
                ),
            });
          }
        );

        return Array.from(
          map.values()
        );
      }
    );
  }, [items]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    subjectOfferingId,
  ]);

  const displayedItems =
    useMemo(() => {
      const query =
        searchText
          .trim()
          .toLowerCase();

      if (!query) {
        return items;
      }

      return items.filter(
        (item) => {
          const title =
            String(
              item?.title || ""
            ).toLowerCase();

          const subject =
            getSubjectName(
              item
            ).toLowerCase();

          const grade =
            getGradeName(
              item
            ).toLowerCase();

          return (
            title.includes(
              query
            ) ||
            subject.includes(
              query
            ) ||
            grade.includes(
              query
            )
          );
        }
      );
    }, [
      items,
      searchText,
    ]);

  const currentPagination =
    localPagination ||
    pagination;

  const linkedCount =
    displayedItems.filter(
      (item) =>
        Boolean(
          getOfferingId(
            item
          )
        )
    ).length;

  const generalCount =
    displayedItems.filter(
      (item) =>
        !getOfferingId(
          item
        )
    ).length;

  const stats = {
    total:
      currentPagination
        ?.totalDocs ??
      items.length,

    visible:
      displayedItems.length,

    linked:
      linkedCount,

    general:
      generalCount,
  };

  const csvData =
    useMemo(
      () =>
        displayedItems.map(
          (item) => ({
            العنوان:
              item?.title ||
              "—",

            الرابط:
              item?.link ||
              "—",

            المادة:
              getSubjectName(
                item
              ),

            الصف:
              getGradeName(
                item
              ) ||
              "—",

            الترم:
              getTermName(
                item
              ) ||
              "—",
          })
        ),
      [displayedItems]
    );

  const activeFiltersCount = [
    searchText,
    subjectOfferingId,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchText("");

    setSubjectOfferingId("");

    setPage(1);
  };

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          width: "100%",
          minWidth: 0,
          pb: 4,
          color:
            "var(--color-text)",
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            px: {
              xs: 1.5,
              md: 2.4,
            },
            py: 1.6,

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
            <Box>
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
                  }}
                >
                  إدارة المكتبة
                </Typography>

                <Chip
                  label={
                    stats.total
                  }
                  size="small"
                  sx={{
                    color:
                      "var(--color-gold-dark)",

                    backgroundColor:
                      "var(--color-gold-soft)",

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
                }}
              >
                أضف المصادر التعليمية واربطها بعروض المواد الدراسية.
              </Typography>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              gap={1}
            >
              <Box
                component={CSVLink}
                data={csvData}
                filename="library.csv"
                sx={{
                  textDecoration:
                    "none",
                }}
              >
                <Button
                  variant="outlined"
                  disabled={
                    displayedItems.length ===
                    0
                  }
                  startIcon={
                    <FileDownloadOutlined />
                  }
                  sx={{
                    minHeight: 42,
                    borderRadius:
                      "12px",
                    fontWeight: 800,
                  }}
                >
                  تصدير
                </Button>
              </Box>

              {permissions?.add && (
                <Add
                  setItems={
                    setItems
                  }
                  setLocalPagination={
                    setLocalPagination
                  }
                />
              )}
            </Stack>
          </Stack>
        </Paper>

        {/* Stats */}
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
                "مرتبطة بمواد",
              value:
                stats.linked,
              icon:
                <MenuBookRounded />,
            },

            {
              label:
                "مصادر عامة",
              value:
                stats.general,
              icon:
                <LinkRounded />,
            },
          ].map((card) => (
            <Paper
              key={card.label}
              elevation={0}
              sx={{
                p: 1.3,

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                border:
                  "1px solid rgba(36,74,112,0.08)",

                borderRadius:
                  "18px",

                backgroundColor:
                  "var(--color-cream)",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color:
                      "var(--color-muted)",

                    fontSize:
                      "11px",

                    fontWeight:
                      700,
                  }}
                >
                  {card.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    color:
                      "var(--color-navy-deep)",

                    fontSize:
                      "21px",

                    fontWeight:
                      800,
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

                  placeItems:
                    "center",

                  color:
                    "var(--color-gold-dark)",

                  backgroundColor:
                    "var(--color-gold-soft)",

                  borderRadius:
                    "12px",
                }}
              >
                {card.icon}
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            mb: 1.25,
            p: 1.6,

            border:
              "1px solid rgba(36,74,112,0.08)",

            borderRadius: "18px",

            backgroundColor:
              "var(--color-cream)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",

                  fontSize:
                    "15px",

                  fontWeight:
                    800,
                }}
              >
                البحث والتصفية
              </Typography>

              <Typography
                sx={{
                  mt: 0.2,

                  color:
                    "var(--color-muted)",

                  fontSize:
                    "9.5px",
                }}
              >
                البحث بالعنوان داخل الصفحة، والفلترة بالمادة من الـBackend.
              </Typography>
            </Box>

            <Button
              type="button"
              disabled={
                !activeFiltersCount
              }
              onClick={
                resetFilters
              }
              startIcon={
                <RestartAltRounded />
              }
              sx={{
                fontWeight: 800,
              }}
            >
              مسح الفلاتر
            </Button>
          </Stack>

          <Grid
            container
            spacing={1.5}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                value={searchText}
                onChange={(
                  event
                ) =>
                  setSearchText(
                    event.target
                      .value
                  )
                }
                label="بحث داخل الصفحة"
                placeholder="ابحث بالعنوان أو المادة..."
                InputProps={{
                  startAdornment: (
                    <SearchRounded
                      sx={{
                        ml: 1,
                        color:
                          "var(--color-muted)",
                      }}
                    />
                  ),
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                select
                fullWidth
                label="فلترة بعرض المادة"
                value={
                  subjectOfferingId
                }
                onChange={(
                  event
                ) =>
                  setSubjectOfferingId(
                    event.target
                      .value
                  )
                }
              >
                <MenuItem value="">
                  كل المواد
                </MenuItem>

                {offeringOptions.map(
                  (option) => (
                    <MenuItem
                      key={
                        option.id
                      }
                      value={
                        option.id
                      }
                    >
                      {
                        option.label
                      }
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* List */}
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 1.2,
              md: 1.6,
            },

            border:
              "1px solid rgba(36,74,112,0.08)",

            borderRadius: "18px",

            backgroundColor:
              "var(--color-cream)",
          }}
        >
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: 260,
              }}
            >
              <CircularProgress />
            </Stack>
          ) : displayedItems.length ===
            0 ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: 260,
              }}
            >
              <LibraryBooksRounded
                sx={{
                  fontSize: 48,

                  color:
                    "var(--color-muted)",
                }}
              />

              <Typography
                sx={{
                  mt: 1,

                  color:
                    "var(--color-navy-deep)",

                  fontWeight:
                    800,
                }}
              >
                لا توجد عناصر
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,

                  color:
                    "var(--color-muted)",

                  fontSize:
                    "11px",
                }}
              >
                جرّب تغيير الفلاتر أو إضافة مصدر جديد.
              </Typography>
            </Stack>
          ) : (
            <Grid
              container
              spacing={1.5}
            >
              {displayedItems.map(
                (item) => {
                  const id =
                    getItemId(
                      item
                    );

                  const title =
                    item?.title ||
                    "مصدر تعليمي";

                  const subject =
                    getSubjectName(
                      item
                    );

                  const grade =
                    getGradeName(
                      item
                    );

                  const term =
                    getTermName(
                      item
                    );

                  return (
                    <Grid
                      item
                      xs={12}
                      md={6}
                      xl={4}
                      key={id}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          height:
                            "100%",

                          p: 1.5,

                          display:
                            "flex",

                          flexDirection:
                            "column",

                          border:
                            "1px solid rgba(36,74,112,0.09)",

                          borderRadius:
                            "16px",

                          backgroundColor:
                            "var(--color-white)",

                          transition:
                            "200ms ease",

                          "&:hover": {
                            transform:
                              "translateY(-3px)",

                            boxShadow:
                              "0 14px 26px rgba(18,47,77,0.08)",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="flex-start"
                          justifyContent="space-between"
                          gap={1}
                        >
                          <Box
                            sx={{
                              minWidth:
                                0,
                            }}
                          >
                            <Typography
                              sx={{
                                color:
                                  "var(--color-navy-deep)",

                                fontSize:
                                  "14px",

                                fontWeight:
                                  800,

                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {title}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.7,

                                color:
                                  "var(--color-muted)",

                                fontSize:
                                  "10px",
                              }}
                            >
                              {subject}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={
                              getOfferingId(
                                item
                              )
                                ? "مرتبط بمادة"
                                : "مصدر عام"
                            }
                            sx={{
                              fontSize:
                                "9px",

                              fontWeight:
                                800,
                            }}
                          />
                        </Stack>

                        {(grade ||
                          term) && (
                          <Stack
                            direction="row"
                            spacing={0.8}
                            sx={{
                              mt: 1.2,
                              flexWrap:
                                "wrap",
                              gap: 0.7,
                            }}
                          >
                            {grade && (
                              <Chip
                                size="small"
                                label={
                                  grade
                                }
                              />
                            )}

                            {term && (
                              <Chip
                                size="small"
                                label={
                                  term
                                }
                              />
                            )}
                          </Stack>
                        )}

                        <Box
                          sx={{
                            flex: 1,
                          }}
                        />

                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{
                            mt: 2,
                          }}
                        >
                          <Button
                            component="a"
                            href={
                              item?.link
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            endIcon={
                              <OpenInNewRounded />
                            }
                            disabled={
                              !item?.link
                            }
                            sx={{
                              fontSize:
                                "10px",

                              fontWeight:
                                800,
                            }}
                          >
                            فتح المصدر
                          </Button>

                          <Stack
                            direction="row"
                            spacing={0.6}
                          >
                            {permissions?.edit && (
                              <Edit
                                item={
                                  item
                                }
                                setItems={
                                  setItems
                                }
                              />
                            )}

                            {permissions?.delete && (
                              <Delete
                                id={id}
                                setItems={
                                  setItems
                                }
                                setLocalPagination={
                                  setLocalPagination
                                }
                              />
                            )}
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                }
              )}
            </Grid>
          )}

          {currentPagination &&
            items.length > 0 && (
              <Box
                sx={{ mt: 2 }}
              >
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
              </Box>
            )}
        </Paper>
      </Box>
    </Container>
  );
};

export default List;