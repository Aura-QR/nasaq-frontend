import {
  DeleteOutlineRounded,
  EditRounded,
  MoreHorizRounded,
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
  formatStudentDate,
  getStudentAcademicYear,
  getStudentClassName,
  getStudentEmail,
  getStudentId,
  getStudentName,
  getStudentPhone,
  isStudentActive,
} from "@/utils/school/studentData";

const StudentsTable = ({
  students = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  onView,
  onEdit,
  onToggleStatus,
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
        minWidth: 1080,
        borderCollapse:
          "collapse",
        "& th": {
          px: 1.55,
          py: 1.35,
          color:
            "#7e8791",
          backgroundColor:
            "rgba(36,74,112,0.035)",
          borderBottom:
            "1px solid #ded8cd",
          fontSize:
            "8.7px",
          fontWeight:
            800,
          textAlign:
            "right",
        },
        "& td": {
          px: 1.55,
          py: 1.35,
          color:
            "#193754",
          borderBottom:
            "1px solid rgba(222,216,205,0.7)",
          fontSize:
            "9.5px",
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
            الطالب
          </Box>
          <Box component="th">
            التواصل
          </Box>
          <Box component="th">
            السنة الدراسية
          </Box>
          <Box component="th">
            الفصل
          </Box>
          <Box component="th">
            تاريخ التسجيل
          </Box>
          <Box component="th">
            الحالة
          </Box>
          <Box
            component="th"
            sx={{
              textAlign:
                "center !important",
              width: 300,
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
                    length: 7,
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
          : students.map(
              (
                student,
                index
              ) => {
                const active =
                  isStudentActive(
                    student
                  );

                return (
                  <Box
                    component="tr"
                    key={
                      getStudentId(
                        student
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
                          {getStudentName(
                            student
                          )
                            .trim()
                            .charAt(0)}
                        </Box>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            noWrap
                            sx={{
                              color:
                                "#122f4d",
                              fontSize:
                                "10px",
                              fontWeight:
                                800,
                            }}
                          >
                            {getStudentName(
                              student
                            )}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              mt: 0.15,
                              color:
                                "#7e8791",
                              fontSize:
                                "7.5px",
                            }}
                          >
                            {student?.nationality ||
                              "—"}
                          </Typography>
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
                            "9px",
                        }}
                      >
                        {getStudentEmail(
                          student
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
                            "7.6px",
                        }}
                      >
                        {getStudentPhone(
                          student
                        )}
                      </Typography>
                    </Box>

                    <Box component="td">
                      {getStudentAcademicYear(
                        student
                      )}
                    </Box>

                    <Box component="td">
                      {getStudentClassName(
                        student
                      )}
                    </Box>

                    <Box component="td">
                      {formatStudentDate(
                        student?.registrationDate ||
                          student?.createdAt
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
                        spacing={0.65}
                      >
                        <Button
                          onClick={() =>
                            onView?.(
                              student
                            )
                          }
                          startIcon={
                            <VisibilityRounded />
                          }
                          sx={{
                            minHeight: 34,
                            color:
                              "#244a70",
                            backgroundColor:
                              "rgba(36,74,112,0.07)",
                            fontSize:
                              "8px",
                          }}
                        >
                          عرض
                        </Button>

                        {canUpdate && (
                          <>
                            <Button
                              onClick={() =>
                                onEdit?.(
                                  student
                                )
                              }
                              startIcon={
                                <EditRounded />
                              }
                              sx={{
                                minHeight: 34,
                                color:
                                  "#244a70",
                                backgroundColor:
                                  "rgba(36,74,112,0.07)",
                                fontSize:
                                  "8px",
                              }}
                            >
                              تعديل
                            </Button>

                            <Button
                              onClick={() =>
                                onToggleStatus?.(
                                  student
                                )
                              }
                              startIcon={
                                <PauseCircleOutlineRounded />
                              }
                              sx={{
                                minHeight: 34,
                                color:
                                  active
                                    ? "#c94f4f"
                                    : "#29734A",
                                backgroundColor:
                                  active
                                    ? "rgba(201,79,79,0.08)"
                                    : "rgba(116,201,154,0.14)",
                                fontSize:
                                  "8px",
                              }}
                            >
                              {active
                                ? "إيقاف"
                                : "تفعيل"}
                            </Button>
                          </>
                        )}

                        {canDelete && (
                          <Button
                            onClick={() =>
                              onDelete?.(
                                student
                              )
                            }
                            startIcon={
                              <DeleteOutlineRounded />
                            }
                            sx={{
                              minHeight: 34,
                              color:
                                "#c94f4f",
                              backgroundColor:
                                "rgba(201,79,79,0.08)",
                              fontSize:
                                "8px",
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

export default StudentsTable;
