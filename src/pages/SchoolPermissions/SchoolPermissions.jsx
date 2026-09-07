import {
  AdminPanelSettingsRounded,
  PersonRounded,
  RefreshRounded,
  SaveRounded,
  SchoolRounded,
  SecurityRounded,
} from "@mui/icons-material";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import Container from "@/components/Container/Container";

import {
  getSchoolPermissions,
  updateSchoolRolePermissions,
} from "@/APIs/school/permissions";

const ROLE_CONFIG = {
  MANAGER: {
    label: "المساعدون الإداريون",
    shortLabel: "MANAGER",
    description:
      "صلاحيات موحّدة لكل حسابات المساعد الإداري في المدرسة.",
    icon: <AdminPanelSettingsRounded />,
  },
  TEACHER: {
    label: "المعلمون",
    shortLabel: "TEACHER",
    description:
      "الصلاحيات الافتراضية التي يحصل عليها المعلم عند تسجيل الدخول.",
    icon: <SchoolRounded />,
  },
  STUDENT: {
    label: "الطلاب",
    shortLabel: "STUDENT",
    description:
      "للطالب نعرض صلاحيات العرض فقط؛ عمليات الإضافة والتعديل والحذف ليست جزءًا من دوره.",
    icon: <PersonRounded />,
  },
};

const ROLE_ORDER = [
  "MANAGER",
  "TEACHER",
  "STUDENT",
];

const ENTITY_LABELS = {
  students: "الطلاب",
  teachers: "المعلمون",
  classes: "الفصول",
  subjects: "المواد",
  lectures: "الحصص",
  library: "المكتبة",
  attendance: "الحضور",
  gradesCriteria: "معايير الدرجات",
  exams: "الاختبارات",
  projects: "المشاريع",
  grades: "الدرجات",
  preparation: "التحضير",
  financial: "المالية",
  financialSettings: "إعدادات المالية",
  expenses: "المصروفات",
  managers: "المديرون والمساعدون",
  analytics: "التقارير",
  settings: "الإعدادات",
};

const ACTION_LABELS = {
  read: "عرض",
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
};

const ACTION_ORDER = [
  "read",
  "add",
  "edit",
  "delete",
];

const normalizeRole = (value) => {
  const role = String(value || "")
    .trim()
    .toUpperCase();

  return ROLE_ORDER.includes(role)
    ? role
    : "MANAGER";
};

const clonePermissions = (value) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(
      ([entity, actions]) => [
        entity,
        actions &&
        typeof actions === "object" &&
        !Array.isArray(actions)
          ? { ...actions }
          : {},
      ]
    )
  );
};

const unwrapPayload = (value) => {
  let current = value;

  for (
    let index = 0;
    index < 8;
    index += 1
  ) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      break;
    }

    if (
      ROLE_ORDER.some(
        (role) =>
          current?.[role] &&
          typeof current[role] === "object"
      ) ||
      current?.permissions ||
      current?.note ||
      current?.role
    ) {
      return current;
    }

    const next =
      current.data ??
      current.result ??
      current.payload;

    if (!next || next === current) {
      break;
    }

    current = next;
  }

  return current &&
    typeof current === "object" &&
    !Array.isArray(current)
    ? current
    : {};
};


const getVisibleActionKeys = (role, actions) => {
  const available = actions || {};

  // الطالب مستخدم نهائي وليس دور CRUD إداري.
  // نخفي add/edit/delete من شاشة الإعدادات مع الإبقاء
  // على القيم الأصلية داخل الـdraft حتى لا نمسح شيئًا
  // عند إرسال الكائن الكامل إلى الـBackend.
  if (role === "STUDENT") {
    return Object.prototype.hasOwnProperty.call(available, "read")
      ? ["read"]
      : [];
  }

  const extraActions = Object.keys(available).filter(
    (action) => !ACTION_ORDER.includes(action)
  );

  return [
    ...ACTION_ORDER.filter((action) =>
      Object.prototype.hasOwnProperty.call(available, action)
    ),
    ...extraActions,
  ];
};

const countVisibleEnabled = (role, permissions) =>
  Object.values(permissions || {}).reduce((total, actions) => {
    const visibleKeys = getVisibleActionKeys(role, actions);
    return (
      total +
      visibleKeys.filter((action) => Boolean(actions?.[action])).length
    );
  }, 0);

const SchoolPermissions = () => {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [activeRole, setActiveRole] =
    useState(() =>
      normalizeRole(
        searchParams.get("role")
      )
    );

  const [drafts, setDrafts] =
    useState({
      MANAGER: {},
      TEACHER: {},
      STUDENT: {},
    });

  const [savedDrafts, setSavedDrafts] =
    useState({
      MANAGER: {},
      TEACHER: {},
      STUDENT: {},
    });

  const [loading, setLoading] =
    useState(true);

  const [savingRole, setSavingRole] =
    useState("");

  const loadPermissions = async () => {
    setLoading(true);

    const response =
      await getSchoolPermissions();

    if (response?.status === false) {
      toast.error(
        response?.message ||
          "تعذر تحميل صلاحيات المدرسة"
      );
      setLoading(false);
      return;
    }

    const payload = unwrapPayload(
      response?.data ?? response
    );

    const nextDrafts = Object.fromEntries(
      ROLE_ORDER.map((role) => [
        role,
        clonePermissions(
          payload?.[role] ||
            payload?.[
              role.toLowerCase()
            ] ||
            {}
        ),
      ])
    );

    setDrafts(nextDrafts);
    setSavedDrafts(nextDrafts);
    setLoading(false);
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    const requested = normalizeRole(
      searchParams.get("role")
    );

    if (requested !== activeRole) {
      setActiveRole(requested);
    }
  }, [searchParams, activeRole]);

  const currentDraft = useMemo(
    () =>
      drafts?.[activeRole] || {},
    [drafts, activeRole]
  );

  const entities = useMemo(
    () =>
      Object.entries(currentDraft).filter(
        ([, actions]) =>
          getVisibleActionKeys(activeRole, actions).length > 0
      ),
    [currentDraft, activeRole]
  );

  const isDirty = useMemo(
    () =>
      JSON.stringify(
        currentDraft
      ) !==
      JSON.stringify(
        savedDrafts?.[
          activeRole
        ] || {}
      ),
    [
      currentDraft,
      savedDrafts,
      activeRole,
    ]
  );

  const enabledCount =
    useMemo(
      () =>
        countVisibleEnabled(
          activeRole,
          currentDraft
        ),
      [currentDraft, activeRole]
    );

  const changeRole = (
    _event,
    nextRole
  ) => {
    const role = normalizeRole(
      nextRole
    );

    setActiveRole(role);
    setSearchParams(
      { role },
      { replace: true }
    );
  };

  const togglePermission = (
    entity,
    action
  ) => {
    setDrafts((current) => ({
      ...current,
      [activeRole]: {
        ...(current?.[
          activeRole
        ] || {}),
        [entity]: {
          ...(current?.[
            activeRole
          ]?.[entity] || {}),
          [action]: !current?.[
            activeRole
          ]?.[entity]?.[
            action
          ],
        },
      },
    }));
  };

  const saveCurrentRole = async () => {
    if (!entities.length) {
      toast.error(
        "لا توجد صلاحيات متاحة للحفظ"
      );
      return;
    }

    setSavingRole(activeRole);

    const permissions =
      clonePermissions(
        currentDraft
      );

    const response =
      await updateSchoolRolePermissions(
        activeRole,
        permissions
      );

    if (response?.status === false) {
      toast.error(
        response?.message ||
          "تعذر تحديث الصلاحيات"
      );
      setSavingRole("");
      return;
    }

    const payload = unwrapPayload(
      response?.data ?? response
    );

    const saved = clonePermissions(
      payload?.permissions ||
        permissions
    );

    setDrafts((current) => ({
      ...current,
      [activeRole]: saved,
    }));

    setSavedDrafts(
      (current) => ({
        ...current,
        [activeRole]: saved,
      })
    );

    setSavingRole("");

    toast.success(
      payload?.note ||
        "تم تحديث الصلاحيات بنجاح. تسري على المستخدمين بعد تسجيل الدخول من جديد."
    );
  };

  const roleMeta =
    ROLE_CONFIG[activeRole];

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{
          pb: 4,
          width: "100%",
        }}
      >
        <Box
          sx={{
            px: {
              xs: 2,
              md: 3,
            },
            py: {
              xs: 2,
              md: 2.4,
            },
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            alignItems: {
              xs: "stretch",
              md: "center",
            },
            justifyContent:
              "space-between",
            gap: 2,
            borderRadius: "20px",
            border:
              "1px solid #DED8CD",
            background:
              "linear-gradient(135deg, #FFFDF8 0%, #F8F2E7 100%)",
            boxShadow:
              "0 8px 22px rgba(18,47,77,0.035)",
          }}
        >
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.9}
            >
              <SecurityRounded
                sx={{
                  color: "#B78430",
                  fontSize: 31,
                }}
              />

              <Typography
                sx={{
                  color: "#122F4D",
                  fontSize: {
                    xs: "22px",
                    md: "27px",
                  },
                  fontWeight: 900,
                  lineHeight: 1.25,
                }}
              >
                إدارة صلاحيات المدرسة
              </Typography>
            </Stack>

            <Typography
              sx={{
                mt: 0.55,
                color: "#7E8791",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              اضبط الصلاحيات الموحدة لكل دور من مكان واحد.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={
              <RefreshRounded />
            }
            onClick={loadPermissions}
            disabled={
              loading ||
              Boolean(savingRole)
            }
            sx={{
              minHeight: 46,
              px: 2,
              borderRadius: "12px",
              borderColor: "#C9D3DC",
              color: "#244A70",
              bgcolor: "#FFFFFF",
              fontWeight: 900,
              "& .MuiButton-startIcon": {
                ml: 0.65,
                mr: 0,
              },
            }}
          >
            تحديث من الخادم
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mt: 1.5,
            borderRadius: "18px",
            border:
              "1px solid #DED8CD",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={activeRole}
            onChange={changeRole}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              bgcolor: "#FFFFFF",
              borderBottom:
                "1px solid #E8E2D8",
              "& .MuiTabs-indicator": {
                bgcolor: "#B78430",
                height: 3,
              },
            }}
          >
            {ROLE_ORDER.map(
              (role) => (
                <Tab
                  key={role}
                  value={role}
                  icon={
                    ROLE_CONFIG[role]
                      .icon
                  }
                  iconPosition="start"
                  label={
                    ROLE_CONFIG[role]
                      .label
                  }
                  sx={{
                    minHeight: 58,
                    color: "#7E8791",
                    fontSize: "12px",
                    fontWeight: 800,
                    "&.Mui-selected": {
                      color: "#244A70",
                    },
                  }}
                />
              )
            )}
          </Tabs>

          <Box
            sx={{
              p: {
                xs: 1.5,
                md: 2.2,
              },
              bgcolor: "#FFFCF7",
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
              gap={1.2}
              mb={1.4}
            >
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.8}
                  flexWrap="wrap"
                >
                  <Typography
                    sx={{
                      color: "#122F4D",
                      fontSize: "17px",
                      fontWeight: 900,
                    }}
                  >
                    {roleMeta.label}
                  </Typography>

                  <Chip
                    size="small"
                    label={
                      roleMeta.shortLabel
                    }
                    sx={{
                      bgcolor: "#EEF3F7",
                      color: "#315E88",
                      fontWeight: 900,
                      fontSize: "9px",
                    }}
                  />

                  <Chip
                    size="small"
                    label={`${enabledCount} صلاحية مفعّلة`}
                    sx={{
                      bgcolor: "#EAF7F1",
                      color: "#0E7A5E",
                      fontWeight: 900,
                      fontSize: "9px",
                    }}
                  />

                  {isDirty && (
                    <Chip
                      size="small"
                      label="تعديلات غير محفوظة"
                      sx={{
                        bgcolor: "#FBF0D8",
                        color: "#B78430",
                        fontWeight: 900,
                        fontSize: "9px",
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  sx={{
                    mt: 0.45,
                    color: "#7E8791",
                    fontSize: "10.5px",
                    lineHeight: 1.7,
                  }}
                >
                  {roleMeta.description}
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={
                  savingRole ===
                  activeRole ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  ) : (
                    <SaveRounded />
                  )
                }
                onClick={
                  saveCurrentRole
                }
                disabled={
                  loading ||
                  Boolean(savingRole) ||
                  !entities.length ||
                  !isDirty
                }
                sx={{
                  minHeight: 46,
                  px: 2.2,
                  borderRadius: "12px",
                  bgcolor: "#244A70",
                  boxShadow: "none",
                  fontWeight: 900,
                  "& .MuiButton-startIcon": {
                    ml: 0.65,
                    mr: 0,
                  },
                  "&:hover": {
                    bgcolor: "#122F4D",
                    boxShadow: "none",
                  },
                }}
              >
                {savingRole ===
                activeRole
                  ? "جاري الحفظ..."
                  : "حفظ صلاحيات الدور"}
              </Button>
            </Stack>

            <Alert
              severity="info"
              sx={{
                mb: 1.4,
                borderRadius: "12px",
                fontSize: "11px",
                lineHeight: 1.7,
              }}
            >
              الحفظ يستبدل كائن صلاحيات الدور كاملًا. المستخدمون المسجّلون دخول حاليًا يحتاجون لتسجيل الدخول من جديد حتى تُحمّل الصلاحيات الجديدة في التوكن.
            </Alert>

            {loading ? (
              <Box
                sx={{
                  minHeight: 290,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CircularProgress />
              </Box>
            ) : !entities.length ? (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: "12px",
                }}
              >
                لم يرجع الخادم إعدادات صلاحيات لهذا الدور بعد.
              </Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "repeat(2,minmax(0,1fr))",
                  },
                  gap: 1.1,
                }}
              >
                {entities.map(
                  ([entity, actions]) => {
                    const actionKeys =
                      getVisibleActionKeys(
                        activeRole,
                        actions
                      );

                    return (
                      <Paper
                        key={entity}
                        elevation={0}
                        sx={{
                          p: 1.35,
                          borderRadius:
                            "14px",
                          border:
                            "1px solid #E5E0D7",
                          bgcolor: "#FFFFFF",
                        }}
                      >
                        <Typography
                          sx={{
                            mb: 0.85,
                            color: "#193754",
                            fontSize: "12px",
                            fontWeight: 900,
                          }}
                        >
                          {ENTITY_LABELS[
                            entity
                          ] || entity}
                        </Typography>

                        <Stack
                          direction="row"
                          gap={0.6}
                          flexWrap="wrap"
                        >
                          {actionKeys.map(
                            (action) => (
                              <FormControlLabel
                                key={`${entity}-${action}`}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={Boolean(
                                      actions?.[
                                        action
                                      ]
                                    )}
                                    onChange={() =>
                                      togglePermission(
                                        entity,
                                        action
                                      )
                                    }
                                    disabled={Boolean(
                                      savingRole
                                    )}
                                  />
                                }
                                label={
                                  ACTION_LABELS[
                                    action
                                  ] || action
                                }
                                sx={{
                                  m: 0,
                                  px: 0.7,
                                  py: 0.15,
                                  borderRadius:
                                    "9px",
                                  bgcolor:
                                    "#FFFCF7",
                                  border:
                                    "1px solid #E2E7EB",
                                  "& .MuiFormControlLabel-label": {
                                    color:
                                      "#315E88",
                                    fontSize:
                                      "10px",
                                    fontWeight: 800,
                                  },
                                }}
                              />
                            )
                          )}
                        </Stack>
                      </Paper>
                    );
                  }
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SchoolPermissions;
