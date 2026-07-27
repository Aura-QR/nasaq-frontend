import {
  AdminPanelSettingsRounded,
  DeleteOutlineRounded,
  EditRounded,
  PauseCircleOutlineRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

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

const TeachersTable = ({
  teachers = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  canManageRole = false,
  onView,
  onEdit,
  onToggleStatus,
  onToggleManagerRole,
  onDelete,
}) => (
  <Box
    sx={{
      overflowX:
        "auto",
    }}
  >
    <Box
      component="table"
      sx={{
        width: "100%",
        minWidth: 1250,
        borderCollapse:
          "collapse",
        "& th": {
          px: 1.45,
          py: 1.3,
          color:
            "#7e8791",
          backgroundColor:
            "rgba(36,74,112,0.035)",
          borderBottom:
            "1px solid #ded8cd",
          fontSize:
            "8.6px",
          fontWeight:
            800,
          textAlign:
            "right",
        },
        "& td": {
          px: 1.45,
          py: 1.3,
          color:
            "#193754",
          borderBottom:
            "1px solid rgba(222,216,205,0.7)",
          fontSize:
            "9.4px",
        },
        "& tbody tr": {
          transition:
            "background-color 0.2s ease",
        },
        "& tbody tr:hover": {
          backgroundColor:
            "rgba(36,74,112,0.022)",
        },
      }}
    >
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
              width: 410,
            }}
          >
            الإجراءات
          </Box>
        </Box>
      </Box>

      <Box component="tbody">
        {loading
          ? Array.from({
              length: 6,
            }).map(
              (_, rowIndex) => (
                <Box
                  component="tr"
                  key={rowIndex}
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
                        <Skeleton />
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

                const subjects =
                  getTeacherSubjectNames(
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
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.9}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            display:
                              "grid",
                            placeItems:
                              "center",
                            borderRadius:
                              "11px",
                            color:
                              "#ffffff",
                            backgroundColor:
                              "#244a70",
                            fontSize:
                              "11px",
                            fontWeight:
                              800,
                          }}
                        >
                          {getTeacherName(
                            teacher
                          )
                            .trim()
                            .charAt(0)}
                        </Box>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            <Typography
                              noWrap
                              sx={{
                                maxWidth:
                                  180,
                                color:
                                  "#122f4d",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  800,
                              }}
                            >
                              {getTeacherName(
                                teacher
                              )}
                            </Typography>

                            {manager && (
                              <Chip
                                size="small"
                                label="مدير"
                                sx={{
                                  height: 21,
                                  color:
                                    "#8a5a00",
                                  backgroundColor:
                                    "#fbf0d8",
                                  fontSize:
                                    "6.8px",
                                  fontWeight:
                                    800,
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>

                    <Box component="td">
                      <Typography
                        noWrap
                        sx={{
                          maxWidth: 220,
                          direction:
                            "ltr",
                          textAlign:
                            "right",
                          fontSize:
                            "8.8px",
                        }}
                      >
                        {getTeacherEmail(
                          teacher
                        )}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.2,
                          direction:
                            "ltr",
                          textAlign:
                            "right",
                          color:
                            "#7e8791",
                          fontSize:
                            "7.5px",
                        }}
                      >
                        {getTeacherPhone(
                          teacher
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      {getTeacherSpecialization(
                        teacher
                      )}
                    </Box>

                    <Box component="td">
                      {getTeacherExperience(
                        teacher
                      )}
                    </Box>

                    <Box component="td">
                      <Chip
                        size="small"
                        label={
                          subjects.length
                            ? `${subjects.length} مادة`
                            : "بدون مواد"
                        }
                        title={
                          subjects.join(
                            "، "
                          )
                        }
                        sx={{
                          height: 24,
                          color:
                            "#244a70",
                          backgroundColor:
                            "rgba(36,74,112,0.07)",
                          fontSize:
                            "7.3px",
                          fontWeight:
                            800,
                        }}
                      />
                    </Box>

                    <Box component="td">
                      {formatTeacherDate(
                        teacher?.hireDate ||
                          teacher?.createdAt
                      )}
                    </Box>

                    <Box component="td">
                      <Chip
                        size="small"
                        label={
                          active
                            ? "نشط"
                            : "موقوف"
                        }
                        sx={{
                          height: 25,
                          color:
                            active
                              ? "#29734A"
                              : "#A44343",
                          backgroundColor:
                            active
                              ? "rgba(116,201,154,0.17)"
                              : "rgba(201,79,79,0.12)",
                          fontSize:
                            "7.7px",
                          fontWeight:
                            800,
                        }}
                      />
                    </Box>

                    <Box
                      component="td"
                      sx={{
                        textAlign:
                          "center !important",
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={0.55}
                      >
                        <Button
                          onClick={() =>
                            onView?.(
                              teacher
                            )
                          }
                          startIcon={
                            <VisibilityRounded />
                          }
                          sx={{
                            minHeight: 33,
                            color:
                              "#244a70",
                            backgroundColor:
                              "rgba(36,74,112,0.07)",
                            fontSize:
                              "7.7px",
                          }}
                        >
                          عرض
                        </Button>

                        {canUpdate && (
                          <>
                            <Button
                              onClick={() =>
                                onEdit?.(
                                  teacher
                                )
                              }
                              startIcon={
                                <EditRounded />
                              }
                              sx={{
                                minHeight: 33,
                                color:
                                  "#244a70",
                                backgroundColor:
                                  "rgba(36,74,112,0.07)",
                                fontSize:
                                  "7.7px",
                              }}
                            >
                              تعديل
                            </Button>

                            <Button
                              onClick={() =>
                                onToggleStatus?.(
                                  teacher
                                )
                              }
                              startIcon={
                                <PauseCircleOutlineRounded />
                              }
                              sx={{
                                minHeight: 33,
                                color:
                                  active
                                    ? "#c94f4f"
                                    : "#29734A",
                                backgroundColor:
                                  active
                                    ? "rgba(201,79,79,0.08)"
                                    : "rgba(116,201,154,0.14)",
                                fontSize:
                                  "7.7px",
                              }}
                            >
                              {active
                                ? "إيقاف"
                                : "تفعيل"}
                            </Button>
                          </>
                        )}

                        {canManageRole && (
                          <Button
                            onClick={() =>
                              onToggleManagerRole?.(
                                teacher
                              )
                            }
                            startIcon={
                              <AdminPanelSettingsRounded />
                            }
                            sx={{
                              minHeight: 33,
                              color:
                                manager
                                  ? "#A44343"
                                  : "#8a5a00",
                              backgroundColor:
                                manager
                                  ? "rgba(201,79,79,0.08)"
                                  : "#fbf0d8",
                              fontSize:
                                "7.7px",
                            }}
                          >
                            {manager
                              ? "إلغاء الإدارة"
                              : "ترقية"}
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            onClick={() =>
                              onDelete?.(
                                teacher
                              )
                            }
                            startIcon={
                              <DeleteOutlineRounded />
                            }
                            sx={{
                              minHeight: 33,
                              color:
                                "#c94f4f",
                              backgroundColor:
                                "rgba(201,79,79,0.08)",
                              fontSize:
                                "7.7px",
                            }}
                          >
                            حذف
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                );
              }
            )}
      </Box>
    </Box>
  </Box>
);

export default TeachersTable;
