import {
  AdminPanelSettingsRounded,
  CheckCircleRounded,
  DeleteOutlineRounded,
  EditRounded,
  KeyRounded,
  MoreVertRounded,
  PauseCircleOutlineRounded,
  PlayCircleOutlineRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useState,
} from "react";

import {
  formatTeacherDate,
  getTeacherEmail,
  getTeacherExperience,
  getTeacherId,
  getTeacherName,
  getTeacherPhone,
  getTeacherSpecialization,
  getTeacherSubjectNames,
  isTeacherActive,
  isTeacherManager,
} from "@/utils/school/teacherData";

const getTeacherSubjectsSummary = (
  teacher
) => {
  const names =
    getTeacherSubjectNames(
      teacher
    );

  const count =
    names.length;

  return {
    names,
    count,

    chipLabel:
      count > 0
        ? `${count} مادة`
        : "بدون مواد",

    detailsLabel:
      names.length
        ? names.join("، ")
        : "بدون مواد",

    title:
      names.length
        ? names.join("، ")
        : "لا توجد مواد مسندة",
  };
};

const actionButtonSx = (
  color,
  backgroundColor
) => ({
  width: 33,
  height: 33,

  color,
  backgroundColor,

  border:
    "1px solid rgba(36,74,112,0.06)",

  transition:
    "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease",

  "& svg": {
    fontSize: 17,
  },

  "&:hover": {
    color,
    backgroundColor,
    transform:
      "translateY(-1px)",
    boxShadow:
      "0 7px 16px rgba(18,47,77,0.10)",
  },
});

const TeacherActions = ({
  teacher,
  active,
  manager,
  canUpdate,
  canDelete,
  canManageRole,
  canSetPassword,
  onView,
  onEdit,
  onToggleStatus,
  onToggleManagerRole,
  onSetPassword,
  onDelete,
}) => {
  const [
    menuAnchor,
    setMenuAnchor,
  ] = useState(null);

  const menuOpen =
    Boolean(menuAnchor);

  const hasMoreActions =
    canSetPassword ||
    canManageRole ||
    canDelete;

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleRoleAction = () => {
    closeMenu();

    onToggleManagerRole?.(
      teacher
    );
  };

  const handleSetPasswordAction = () => {
    closeMenu();

    onSetPassword?.(
      teacher
    );
  };

  const handleDeleteAction = () => {
    closeMenu();

    onDelete?.(
      teacher
    );
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.45}
        sx={{
          flexWrap: "nowrap",
        }}
      >
        <Tooltip title="عرض الملف">
          <IconButton
            type="button"
            aria-label="عرض ملف المعلم"
            onClick={() =>
              onView?.(
                teacher
              )
            }
            sx={actionButtonSx(
              "#244a70",
              "rgba(36,74,112,0.08)"
            )}
          >
            <VisibilityRounded />
          </IconButton>
        </Tooltip>

        {canUpdate && (
          <>
            <Tooltip title="تعديل البيانات">
              <IconButton
                type="button"
                aria-label="تعديل بيانات المعلم"
                onClick={() =>
                  onEdit?.(
                    teacher
                  )
                }
                sx={actionButtonSx(
                  "#244a70",
                  "rgba(36,74,112,0.08)"
                )}
              >
                <EditRounded />
              </IconButton>
            </Tooltip>

            <Tooltip
              title={
                active
                  ? "إيقاف الحساب"
                  : "تفعيل الحساب"
              }
            >
              <IconButton
                type="button"
                aria-label={
                  active
                    ? "إيقاف حساب المعلم"
                    : "تفعيل حساب المعلم"
                }
                onClick={() =>
                  onToggleStatus?.(
                    teacher
                  )
                }
                sx={actionButtonSx(
                  active
                    ? "#c94f4f"
                    : "#29734A",
                  active
                    ? "rgba(201,79,79,0.09)"
                    : "rgba(116,201,154,0.16)"
                )}
              >
                {active ? (
                  <PauseCircleOutlineRounded />
                ) : (
                  <PlayCircleOutlineRounded />
                )}
              </IconButton>
            </Tooltip>
          </>
        )}

        {hasMoreActions && (
          <Tooltip title="إجراءات أخرى">
            <IconButton
              type="button"
              aria-label="إجراءات أخرى"
              aria-controls={
                menuOpen
                  ? "teacher-actions-menu"
                  : undefined
              }
              aria-haspopup="true"
              aria-expanded={
                menuOpen
                  ? "true"
                  : undefined
              }
              onClick={(
                event
              ) =>
                setMenuAnchor(
                  event.currentTarget
                )
              }
              sx={actionButtonSx(
                "#5f6973",
                "rgba(95,105,115,0.08)"
              )}
            >
              <MoreVertRounded />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Menu
        id="teacher-actions-menu"
        anchorEl={
          menuAnchor
        }
        open={
          menuOpen
        }
        onClose={
          closeMenu
        }
        transformOrigin={{
          horizontal:
            "left",
          vertical:
            "top",
        }}
        anchorOrigin={{
          horizontal:
            "left",
          vertical:
            "bottom",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 185,
              mt: 0.5,
              borderRadius:
                "12px",
              border:
                "1px solid rgba(36,74,112,0.09)",
              boxShadow:
                "0 14px 32px rgba(18,47,77,0.14)",
              fontFamily:
                "Tajawal, Arial, sans-serif",
            },
          },
        }}
      >
        {canSetPassword && (
          <MenuItem
            onClick={
              handleSetPasswordAction
            }
            sx={{
              minHeight: 42,
              gap: 0.8,
              color: "#244a70",
              fontSize: "10px",
              fontWeight: 800,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth:
                  "28px !important",
                color: "inherit",
              }}
            >
              <KeyRounded
                sx={{
                  fontSize: 18,
                }}
              />
            </ListItemIcon>

            <ListItemText
              primary="تعيين كلمة المرور"
              primaryTypographyProps={{
                fontFamily: "inherit",
                fontSize: "10px",
                fontWeight: 800,
              }}
            />
          </MenuItem>
        )}

        {canManageRole && (
          <MenuItem
            onClick={
              handleRoleAction
            }
            sx={{
              minHeight: 42,
              gap: 0.8,
              color:
                manager
                  ? "#A44343"
                  : "#8a5a00",
              fontSize:
                "10px",
              fontWeight:
                800,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth:
                  "28px !important",
                color:
                  "inherit",
              }}
            >
              <AdminPanelSettingsRounded
                sx={{
                  fontSize: 18,
                }}
              />
            </ListItemIcon>

            <ListItemText
              primary={
                manager
                  ? "إلغاء دور المدير"
                  : "ترقية إلى مدير"
              }
              primaryTypographyProps={{
                fontFamily:
                  "inherit",
                fontSize:
                  "10px",
                fontWeight:
                  800,
              }}
            />
          </MenuItem>
        )}

        {canDelete && (
          <MenuItem
            onClick={
              handleDeleteAction
            }
            sx={{
              minHeight: 42,
              gap: 0.8,
              color:
                "#c94f4f",
              fontSize:
                "10px",
              fontWeight:
                800,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth:
                  "28px !important",
                color:
                  "inherit",
              }}
            >
              <DeleteOutlineRounded
                sx={{
                  fontSize: 18,
                }}
              />
            </ListItemIcon>

            <ListItemText
              primary="حذف المعلم"
              primaryTypographyProps={{
                fontFamily:
                  "inherit",
                fontSize:
                  "10px",
                fontWeight:
                  800,
              }}
            />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

const TeacherIdentity = ({
  teacher,
  compact = false,
}) => {
  const manager =
    isTeacherManager(
      teacher
    );

  return (
    <Box
      sx={{
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.55}
        sx={{
          minWidth: 0,
        }}
      >
        <Typography
          noWrap
          title={
            getTeacherName(
              teacher
            )
          }
          sx={{
            maxWidth:
              compact
                ? 260
                : 190,

            color:
              "#122f4d",

            fontSize:
              compact
                ? "12.5px"
                : "11px",

            fontWeight:
              900,
          }}
        >
          {getTeacherName(
            teacher
          )}
        </Typography>

        {manager && (
          <Chip
            size="small"
            label="مساعد إداري"
            sx={{
              height: 22,

              color:
                "#8a5a00",

              backgroundColor:
                "#fbf0d8",

              border:
                "1px solid rgba(211,164,79,0.20)",

              fontSize:
                "7.5px",

              fontWeight:
                900,

              "& .MuiChip-label":
                {
                  px: 0.8,
                },
            }}
          />
        )}
      </Stack>

      {compact && (
        <Typography
          noWrap
          sx={{
            mt: 0.25,

            color:
              "#7e8791",

            fontSize:
              "8.5px",
          }}
        >
          {getTeacherSpecialization(
            teacher
          ) || "بدون تخصص"}
        </Typography>
      )}
    </Box>
  );
};

const StatusChip = ({
  active,
}) => (
  <Chip
    size="small"
    icon={
      active
        ? <CheckCircleRounded />
        : <PauseCircleOutlineRounded />
    }
    label={
      active
        ? "نشط"
        : "موقوف"
    }
    sx={{
      height: 28,

      color:
        active
          ? "#29734A"
          : "#A44343",

      backgroundColor:
        active
          ? "rgba(116,201,154,0.16)"
          : "rgba(201,79,79,0.11)",

      border: `1px solid ${
        active
          ? "rgba(116,201,154,0.22)"
          : "rgba(201,79,79,0.16)"
      }`,

      fontSize:
        "8.5px",

      fontWeight:
        900,

      "& .MuiChip-icon":
        {
          mr: 0.2,
          ml: -0.2,
          color:
            "inherit",
          fontSize:
            14,
        },
    }}
  />
);

const DesktopTable = ({
  teachers,
  loading,
  ...actions
}) => (
  <Box
    sx={{
      display: {
        xs: "none",
        lg: "block",
      },

      overflowX:
        "auto",

      scrollbarWidth:
        "thin",

      scrollbarColor:
        "rgba(36,74,112,0.20) transparent",

      "&::-webkit-scrollbar":
        {
          height: 7,
        },

      "&::-webkit-scrollbar-thumb":
        {
          borderRadius: 999,
          backgroundColor:
            "rgba(36,74,112,0.20)",
        },
    }}
  >
    <Box
      component="table"
      sx={{
        width: "100%",

        tableLayout:
          "fixed",

        borderCollapse:
          "separate",

        borderSpacing: 0,

        "& th": {
          px: 1.2,
          py: 1.15,

          color:
            "#66717c",

          background:
            "linear-gradient(180deg, #f5f7fb 0%, #edf1f6 100%)",

          borderBottom:
            "1px solid rgba(36,74,112,0.09)",

          fontSize:
            "10.5px",

          fontWeight:
            900,

          textAlign:
            "right",

          whiteSpace:
            "nowrap",
        },

        "& td": {
          px: 1.2,
          py: 1.15,

          color:
            "#193754",

          borderBottom:
            "1px solid rgba(222,216,205,0.72)",

          fontSize:
            "10px",

          verticalAlign:
            "middle",
        },

        "& tbody tr": {
          backgroundColor:
            "#ffffff",

          transition:
            "background-color 160ms ease, transform 160ms ease",
        },

        "& tbody tr:hover": {
          backgroundColor:
            "rgba(251,240,216,0.26)",
        },

        "& tbody tr:last-of-type td":
          {
            borderBottom: 0,
          },
      }}
    >
      <colgroup>
        <col
          style={{
            width: "16%",
          }}
        />
        <col
          style={{
            width: "21%",
          }}
        />
        <col
          style={{
            width: "13%",
          }}
        />
        <col
          style={{
            width: "7%",
          }}
        />
        <col
          style={{
            width: "9%",
          }}
        />
        <col
          style={{
            width: "13%",
          }}
        />
        <col
          style={{
            width: "8%",
          }}
        />
        <col
          style={{
            width: "13%",
          }}
        />
      </colgroup>

      <Box component="thead">
        <Box component="tr">
          <Box component="th">
            المعلم
          </Box>

          <Box component="th">
            التواصل
          </Box>

          <Box component="th">
            التخصص
          </Box>

          <Box component="th">
            الخبرة
          </Box>

          <Box component="th">
            المواد
          </Box>

          <Box component="th">
            تاريخ التعيين
          </Box>

          <Box component="th">
            الحالة
          </Box>

          <Box
            component="th"
            sx={{
              textAlign:
                "center !important",
            }}
          >
            الإجراءات
          </Box>
        </Box>
      </Box>

      <Box component="tbody">
        {loading
          ? Array.from({
              length: 5,
            }).map(
              (
                _,
                rowIndex
              ) => (
                <Box
                  component="tr"
                  key={
                    rowIndex
                  }
                >
                  {Array.from({
                    length: 8,
                  }).map(
                    (
                      __,
                      cellIndex
                    ) => (
                      <Box
                        component="td"
                        key={
                          cellIndex
                        }
                      >
                        <Skeleton
                          variant="rounded"
                          height={34}
                          sx={{
                            borderRadius:
                              "9px",
                          }}
                        />
                      </Box>
                    )
                  )}
                </Box>
              )
            )
          : teachers.map(
              (
                teacher,
                index
              ) => {
                const active =
                  isTeacherActive(
                    teacher
                  );

                const manager =
                  isTeacherManager(
                    teacher
                  );

                const subjectSummary =
                  getTeacherSubjectsSummary(
                    teacher
                  );

                return (
                  <Box
                    component="tr"
                    key={
                      getTeacherId(
                        teacher
                      ) ||
                      index
                    }
                  >
                    <Box component="td">
                      <TeacherIdentity
                        teacher={
                          teacher
                        }
                      />
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        title={
                          getTeacherEmail(
                            teacher
                          )
                        }
                        sx={{
                          direction:
                            "ltr",

                          textAlign:
                            "right",

                          color:
                            "#244a70",

                          fontSize:
                            "9.5px",

                          fontWeight:
                            700,
                        }}
                      >
                        {getTeacherEmail(
                          teacher
                        )}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.25,

                          direction:
                            "ltr",

                          textAlign:
                            "right",

                          color:
                            "#8a929a",

                          fontSize:
                            "8.5px",
                        }}
                      >
                        {getTeacherPhone(
                          teacher
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        title={
                          getTeacherSpecialization(
                            teacher
                          )
                        }
                        sx={{
                          fontSize:
                            "9.5px",

                          fontWeight:
                            700,
                        }}
                      >
                        {getTeacherSpecialization(
                          teacher
                        ) || "—"}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        sx={{
                          fontSize:
                            "9.5px",

                          fontWeight:
                            700,
                        }}
                      >
                        {getTeacherExperience(
                          teacher
                        ) || "—"}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <Chip
                        size="small"
                        label={
                          subjectSummary.chipLabel
                        }
                        title={
                          subjectSummary.title
                        }
                        sx={{
                          height: 27,

                          color:
                            "#244a70",

                          backgroundColor:
                            "rgba(36,74,112,0.07)",

                          border:
                            "1px solid rgba(36,74,112,0.08)",

                          fontSize:
                            "8px",

                          fontWeight:
                            900,
                        }}
                      />
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        sx={{
                          fontSize:
                            "9px",

                          fontWeight:
                            700,
                        }}
                      >
                        {formatTeacherDate(
                          teacher?.hireDate ||
                            teacher?.createdAt
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      <StatusChip
                        active={
                          active
                        }
                      />
                    </Box>

                    <Box
                      component="td"
                      sx={{
                        textAlign:
                          "center",
                      }}
                    >
                      <TeacherActions
                        teacher={
                          teacher
                        }
                        active={
                          active
                        }
                        manager={
                          manager
                        }
                        {...actions}
                      />
                    </Box>
                  </Box>
                );
              }
            )}
      </Box>
    </Box>
  </Box>
);

const MobileCards = ({
  teachers,
  loading,
  ...actions
}) => (
  <Box
    sx={{
      display: {
        xs: "grid",
        lg: "none",
      },

      gridTemplateColumns: {
        xs: "1fr",
        md:
          "repeat(2,minmax(0,1fr))",
      },

      gap: 1,

      p: 1,
    }}
  >
    {loading
      ? Array.from({
          length: 4,
        }).map(
          (
            _,
            index
          ) => (
            <Skeleton
              key={
                index
              }
              variant="rounded"
              height={220}
              sx={{
                borderRadius:
                  "16px",
              }}
            />
          )
        )
      : teachers.map(
          (
            teacher,
            index
          ) => {
            const active =
              isTeacherActive(
                teacher
              );

            const manager =
              isTeacherManager(
                teacher
              );

            const subjectSummary =
              getTeacherSubjectsSummary(
                teacher
              );

            return (
              <Box
                key={
                  getTeacherId(
                    teacher
                  ) ||
                  index
                }
                sx={{
                  p: 1.35,

                  border:
                    "1px solid rgba(36,74,112,0.09)",

                  borderRadius:
                    "16px",

                  background:
                    "linear-gradient(145deg, #ffffff 0%, #fffcf7 100%)",

                  boxShadow:
                    "0 8px 20px rgba(18,47,77,0.045)",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <TeacherIdentity
                    teacher={
                      teacher
                    }
                    compact
                  />

                  <StatusChip
                    active={
                      active
                    }
                  />
                </Stack>

                <Box
                  sx={{
                    mt: 1.25,

                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(2,minmax(0,1fr))",

                    gap: 0.8,
                  }}
                >
                  <InfoItem
                    label="البريد الإلكتروني"
                    value={
                      getTeacherEmail(
                        teacher
                      )
                    }
                    ltr
                  />

                  <InfoItem
                    label="رقم الهاتف"
                    value={
                      getTeacherPhone(
                        teacher
                      )
                    }
                    ltr
                  />

                  <InfoItem
                    label="الخبرة"
                    value={
                      getTeacherExperience(
                        teacher
                      ) || "—"
                    }
                  />

                  <InfoItem
                    label="تاريخ التعيين"
                    value={
                      formatTeacherDate(
                        teacher?.hireDate ||
                          teacher?.createdAt
                      )
                    }
                  />

                  <InfoItem
                    label="المواد"
                    value={
                      subjectSummary.detailsLabel
                    }
                    fullWidth
                  />
                </Box>

                <Box
                  sx={{
                    mt: 1.25,
                    pt: 1.1,

                    borderTop:
                      "1px solid rgba(222,216,205,0.65)",
                  }}
                >
                  <TeacherActions
                    teacher={
                      teacher
                    }
                    active={
                      active
                    }
                    manager={
                      manager
                    }
                    {...actions}
                  />
                </Box>
              </Box>
            );
          }
        )}
  </Box>
);

const InfoItem = ({
  label,
  value,
  ltr = false,
  fullWidth = false,
}) => (
  <Box
    sx={{
      minWidth: 0,

      p: 0.85,

      gridColumn:
        fullWidth
          ? "1 / -1"
          : "auto",

      borderRadius:
        "11px",

      backgroundColor:
        "rgba(36,74,112,0.035)",
    }}
  >
    <Typography
      sx={{
        color:
          "#7e8791",

        fontSize:
          "7.5px",

        fontWeight:
          700,
      }}
    >
      {label}
    </Typography>

    <Typography
      noWrap
      title={
        String(
          value || "—"
        )
      }
      sx={{
        mt: 0.3,

        direction:
          ltr
            ? "ltr"
            : "rtl",

        textAlign:
          ltr
            ? "right"
            : "right",

        color:
          "#122f4d",

        fontSize:
          "9px",

        fontWeight:
          800,
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

const TeachersTable = ({
  teachers = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  canManageRole = false,
  canSetPassword = false,
  onView,
  onEdit,
  onToggleStatus,
  onToggleManagerRole,
  onSetPassword,
  onDelete,
}) => {
  const actionProps = {
    canUpdate,
    canDelete,
    canManageRole,
    canSetPassword,
    onView,
    onEdit,
    onToggleStatus,
    onToggleManagerRole,
    onSetPassword,
    onDelete,
  };

  return (
    <>
      <DesktopTable
        teachers={
          teachers
        }
        loading={
          loading
        }
        {...actionProps}
      />

      <MobileCards
        teachers={
          teachers
        }
        loading={
          loading
        }
        {...actionProps}
      />
    </>
  );
};

export default TeachersTable;
