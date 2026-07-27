import {
  DeleteOutlineRounded,
  EditRounded,
  PauseCircleOutlineRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  getClassAcademicYear,
  getClassCapacity,
  getClassDisplayName,
  getClassGenderLabel,
  getClassId,
  getClassRoomNumber,
  getClassStudentCount,
  getClassSubjectNames,
  getClassTeacherName,
  isClassActive,
} from "@/utils/school/classData";

const ClassesTable = ({
  classes = [],
  loading = false,
  canUpdate = false,
  canDelete = false,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}) => (
  <Box sx={{ overflowX: "auto" }}>
    <Box
      component="table"
      sx={{
        width: "100%",
        minWidth: 1180,
        borderCollapse: "collapse",
        "& th": {
          px: 1.45,
          py: 1.3,
          color: "#7e8791",
          backgroundColor: "rgba(36,74,112,0.035)",
          borderBottom: "1px solid #ded8cd",
          fontSize: "8.6px",
          fontWeight: 800,
          textAlign: "right",
        },
        "& td": {
          px: 1.45,
          py: 1.3,
          color: "#193754",
          borderBottom: "1px solid rgba(222,216,205,0.7)",
          fontSize: "9.4px",
        },
        "& tbody tr": { transition: "background-color 0.2s ease" },
        "& tbody tr:hover": { backgroundColor: "rgba(36,74,112,0.022)" },
      }}
    >
      <Box component="thead">
        <Box component="tr">
          <Box component="th">الفصل</Box>
          <Box component="th">السنة الدراسية</Box>
          <Box component="th">النوع</Box>
          <Box component="th">المعلم المسؤول</Box>
          <Box component="th">المواد</Box>
          <Box component="th">الإشغال</Box>
          <Box component="th">الحالة</Box>
          <Box component="th" sx={{ width: 315, textAlign: "center !important" }}>
            الإجراءات
          </Box>
        </Box>
      </Box>

      <Box component="tbody">
        {loading
          ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <Box component="tr" key={rowIndex}>
                {Array.from({ length: 8 }).map((__, cellIndex) => (
                  <Box component="td" key={cellIndex}><Skeleton /></Box>
                ))}
              </Box>
            ))
          : classes.map((classItem, index) => {
              const active = isClassActive(classItem);
              const capacity = getClassCapacity(classItem);
              const students = getClassStudentCount(classItem);
              const occupancy = capacity > 0 ? Math.min(100, Math.round((students / capacity) * 100)) : 0;
              const subjects = getClassSubjectNames(classItem);

              return (
                <Box component="tr" key={getClassId(classItem) || index}>
                  <Box component="td">
                    <Typography sx={{ color: "#122f4d", fontSize: "10px", fontWeight: 800 }}>
                      {getClassDisplayName(classItem)}
                    </Typography>
                    <Typography sx={{ mt: 0.15, color: "#7e8791", fontSize: "7.4px" }}>
                      الغرفة: {getClassRoomNumber(classItem)}
                    </Typography>
                  </Box>

                  <Box component="td">{getClassAcademicYear(classItem)}</Box>
                  <Box component="td">{getClassGenderLabel(classItem)}</Box>
                  <Box component="td">{getClassTeacherName(classItem)}</Box>
                  <Box component="td">
                    <Chip
                      size="small"
                      label={subjects.length ? `${subjects.length} مادة` : "بدون مواد"}
                      title={subjects.join("، ")}
                      sx={{
                        height: 24,
                        color: "#244a70",
                        backgroundColor: "rgba(36,74,112,0.07)",
                        fontSize: "7.3px",
                        fontWeight: 800,
                      }}
                    />
                  </Box>

                  <Box component="td">
                    <Box sx={{ width: 145 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.35 }}>
                        <Typography sx={{ color: "#122f4d", fontSize: "8px", fontWeight: 800 }}>
                          {students}/{capacity || "—"}
                        </Typography>
                        <Typography sx={{ color: "#7e8791", fontSize: "7px" }}>{occupancy}%</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={occupancy}
                        sx={{
                          height: 5,
                          borderRadius: "999px",
                          backgroundColor: "rgba(36,74,112,0.08)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: "999px",
                            backgroundColor: occupancy >= 90 ? "#c94f4f" : "#d3a44f",
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  <Box component="td">
                    <Chip
                      size="small"
                      label={active ? "نشط" : "موقوف"}
                      sx={{
                        height: 25,
                        color: active ? "#29734A" : "#A44343",
                        backgroundColor: active ? "rgba(116,201,154,0.17)" : "rgba(201,79,79,0.12)",
                        fontSize: "7.7px",
                        fontWeight: 800,
                      }}
                    />
                  </Box>

                  <Box component="td" sx={{ textAlign: "center !important" }}>
                    <Stack direction="row" justifyContent="center" spacing={0.55}>
                      <Button
                        onClick={() => onView?.(classItem)}
                        startIcon={<VisibilityRounded />}
                        sx={{ minHeight: 33, color: "#244a70", backgroundColor: "rgba(36,74,112,0.07)", fontSize: "7.7px" }}
                      >
                        عرض
                      </Button>

                      {canUpdate && (
                        <>
                          <Button
                            onClick={() => onEdit?.(classItem)}
                            startIcon={<EditRounded />}
                            sx={{ minHeight: 33, color: "#244a70", backgroundColor: "rgba(36,74,112,0.07)", fontSize: "7.7px" }}
                          >
                            تعديل
                          </Button>
                          <Button
                            onClick={() => onToggleStatus?.(classItem)}
                            startIcon={<PauseCircleOutlineRounded />}
                            sx={{
                              minHeight: 33,
                              color: active ? "#c94f4f" : "#29734A",
                              backgroundColor: active ? "rgba(201,79,79,0.08)" : "rgba(116,201,154,0.14)",
                              fontSize: "7.7px",
                            }}
                          >
                            {active ? "إيقاف" : "تفعيل"}
                          </Button>
                        </>
                      )}

                      {canDelete && (
                        <Button
                          onClick={() => onDelete?.(classItem)}
                          startIcon={<DeleteOutlineRounded />}
                          sx={{ minHeight: 33, color: "#c94f4f", backgroundColor: "rgba(201,79,79,0.08)", fontSize: "7.7px" }}
                        >
                          حذف
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Box>
              );
            })}
      </Box>
    </Box>
  </Box>
);

export default ClassesTable;
