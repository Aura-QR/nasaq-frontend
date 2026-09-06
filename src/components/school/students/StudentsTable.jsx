import {
  DeleteOutlineRounded,
  EditRounded,
  KeyRounded,
  MoreHorizRounded,
  PauseCircleOutlineRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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

import {
  useState,
} from "react";

const StudentMoreActions = ({
  student,
  canSetPassword = false,
  canDelete = false,
  onSetPassword,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] =
    useState(null);

  const open = Boolean(anchorEl);

  if (!canSetPassword && !canDelete) {
    return null;
  }

  const closeMenu = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        type="button"
        aria-label="إجراءات أخرى للطالب"
        aria-haspopup="true"
        aria-expanded={
          open ? "true" : undefined
        }
        onClick={(event) =>
          setAnchorEl(
            event.currentTarget
          )
        }
        startIcon={
          <MoreHorizRounded />
        }
        sx={{
          minHeight: 34,
          minWidth: 38,
          px: 1,
          color: "#5f6973",
          backgroundColor:
            "rgba(95,105,115,0.08)",
          fontSize: "8px",
        }}
      >
        المزيد
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        transformOrigin={{
          horizontal: "left",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "left",
          vertical: "bottom",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 190,
              mt: 0.5,
              borderRadius: "12px",
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
            onClick={() => {
              closeMenu();
              onSetPassword?.(student);
            }}
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
                sx={{ fontSize: 18 }}
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

        {canDelete && (
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete?.(student);
            }}
            sx={{
              minHeight: 42,
              gap: 0.8,
              color: "#c94f4f",
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
              <DeleteOutlineRounded
                sx={{ fontSize: 18 }}
              />
            </ListItemIcon>
            <ListItemText
              primary="حذف الطالب"
              primaryTypographyProps={{
                fontFamily: "inherit",
                fontSize: "10px",
                fontWeight: 800,
              }}
            />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

const StudentsTable = ({
  students = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  canSetPassword = false,
  onView,
  onEdit,
  onToggleStatus,
  onSetPassword,
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

                        <StudentMoreActions
                          student={student}
                          canSetPassword={
                            canSetPassword
                          }
                          canDelete={
                            canDelete
                          }
                          onSetPassword={
                            onSetPassword
                          }
                          onDelete={onDelete}
                        />
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
