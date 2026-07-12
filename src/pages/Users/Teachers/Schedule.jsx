import { useNavigate, useParams } from "react-router-dom";
import Container from "@/components/Container/Container";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "@/components/Loading";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Add, Delete, DeleteOutlineOutlined } from "@mui/icons-material";
import AlertDialog from "@/components/Popup/Popup";
import { deleteLecture, fetchLectures } from "@/APIs/school/lectures";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
import { translateGender } from "@/utils/helpers/translateGender";
import usePermissions from "@/utils/hooks/usePermissions";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { deletePreparation } from "@/APIs/school/preparation";
import { useTeacher } from "@/utils/hooks/apis/useTeacher";


const TeacherSchedule = () => {
  const { id } = useParams();

  // Fetch Teacher Data
  const {teacher , loading} = useTeacher(id);

  // Show loading while fetching teacher data
  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  // Show error if teacher data not found
  if (!teacher) {
    return (
      <Container>
        <Typography color="error" sx={{ mt: 10, textAlign: "center" }}>
          لم يتم العثور على بيانات المعلم
        </Typography>
      </Container>
    );
  }

  console.log(teacher)

  return (
    <Container>
      {/* Timetable */}
      <Schedule teacherData={teacher} />
    </Container>
  );
};

const Schedule = ({ teacherData }) => {
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      // Fetch lectures with filters
      const response = await fetchLectures({teacherId : teacherData._id});
      console.log(response)
      if (response?.status) {
        setLectures(response.data);

        // Transform API data into schedule format
        const mappedSchedule = mapLecturesToSchedule(response.data);
        setWeeklySchedule(mappedSchedule);
      } else {
        toast.error(response?.message || "حدث خطأ ما أثناء جلب الجدول الدراسي");
        setLectures([]);
        setWeeklySchedule([]);
      }
      setLoading(false);
    };

    if (teacherData?._id) {
      fetchScheduleData();
    }
  }, [teacherData]);

  // Transform lectures data to schedule
  const mapLecturesToSchedule = (lectures) => {
    // Initialize empty schedule using Slots
    const schedule = Slots.map((slot) => {
      const scheduleSlot = {
        time: slot.name,
      };
      // Add empty object for each day
      Days.forEach((day) => {
        scheduleSlot[day.day] = {};
      });
      return scheduleSlot;
    });

    // Fill schedule with lecture data
    lectures.forEach((lecture) => {
      // Find matching day in Arabic
      const dayObj = Days.find(
        (d) => d.id === lecture.dayOfWeek?.toLowerCase()
      );
      const slotIndex = lecture.slot - 1; // slot is 1-indexed
      if (dayObj && slotIndex >= 0 && slotIndex < schedule.length) {
        const teacherName = lecture.teacher.name;
        schedule[slotIndex][dayObj.day] = {
          id: lecture._id,
          name: teacherName,
          subject: lecture.subject?.subjectName,
          info: `${lecture.class?.academicYear} - ${lecture.class?.roomNumber} - ${translateGender(lecture.class?.gender, "class")}`,
          preparation: lecture.preparation,
        };
      }
    });

    return schedule;
  };


  // Handle Delete
  const [open, setOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState(null);
  const handleDelete = async () => {
    const response = await deleteLecture(selectedLectureId);
    if (response.status) {
      toast.success("تم الحذف بنجاح");
      // Refresh schedule
      const updatedLectures = lectures.filter(
        (lec) => lec._id !== selectedLectureId
      );
      setLectures(updatedLectures);
      const mappedSchedule = mapLecturesToSchedule(updatedLectures);
      setWeeklySchedule(mappedSchedule);
      setOpen(false);
    } else {
      toast.error("حدث خطأ ما اثناء حذف الحصة");
    }
  };

  // Permission
  const permissions = usePermissions("lectures");

  // showing loading state
  if (loading) {
    return <Loading />;
  }

  if (!weeklySchedule.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 8, lg: 16 },
          borderRadius: "16px",
          border: "1px solid",
          mt: 10,
          borderColor: "primary.border",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Typography color="text.secondary">
          {" "}
          لا توجد محاضرات لهذا المعلم
        </Typography>
      </Paper>
    );
  }

  return (
    <div>
      {/* Weekly Schedule Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 8, lg: 16 },
          borderRadius: "16px",
          border: "1px solid",
          mt: 10,
          borderColor: "primary.border",
        }}
      >
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
          mb={{ xs: 8, md: 16 }}
        >
          {/* Title */}
          <Typography variant="h6" fontWeight={600}>
            الجدول الدراسي الأسبوعي
          </Typography>
          {/* Teacher */}
          {teacherData && (
            <Typography variant="subtitle1" color={"text.secondary"}>
              أ/ {teacherData.name}
            </Typography>
          )}
        </Stack>

        <Box
          sx={{
            overflowX: "auto",
          }}
        >
          <Stack
            direction={"row"}
            sx={{
              "& > *": {
                minWidth: { xs: "100px", sm: "110px", md: "130px" },
              },
            }}
          >
            {/* Time Column */}
            <Stack
              flex={1}
              borderRight={"1px solid"}
              borderColor={"primary.border"}
            >
              <Box
                sx={{
                  position: "relative",
                  height: "60px",
                  bgcolor: "#F6F8F9",
                  borderRadius: "8px 0 0 0",
                  overflow: "hidden",
                }}
              >
                {/* Diagonal Line */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(to top right, transparent calc(50% - .5px), #DEE3E2 calc(50% - .5px), #d1d5db calc(50% + .5px), transparent calc(50% + .5px))",
                    },
                  }}
                />
                {/* الوقت*/}
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 8,
                    left: { xs: 6, md: 12 },
                    fontWeight: 600,
                    fontSize: { xs: "12px", md: "14px" },
                    color: "text.primary",
                  }}
                >
                  الوقت
                </Typography>
                {/* اليوم  */}
                <Typography
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: { xs: 6, md: 12 },
                    fontWeight: 600,
                    fontSize: { xs: "12px", md: "14px" },
                    color: "text.primary",
                  }}
                >
                  اليوم
                </Typography>
              </Box>
              {weeklySchedule.map((slot, index) => (
                <Box
                  key={index}
                  sx={{
                    p: { xs: 6, md: 7 },
                    minHeight: "120px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#F6F8F9",
                    borderBottom: "1px solid #e8ebf0",
                    fontWeight: 600,
                    color: "text.secondary",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "11px", md: "14px" },
                      fontWeight: 600,
                      mb: 1,
                      textAlign: "center",
                    }}
                  >
                    {slot.time}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {/* Day Columns */}
            {Days.map((dayObj) => {
              console.log(dayObj.id);
              return (
                <Stack key={dayObj.id} flex={2}>
                  <Box
                    sx={{
                      p: { xs: 2, md: 8 },
                      height: "60px",
                      bgcolor: "#F6F8F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: { xs: "12px", md: "14px" },
                      color: "text.primary",
                      borderBottom: "1px solid",
                      borderColor: "primary.border",
                      position: "relative",
                      flexDirection: "column",
                    }}
                  >
                    {dayObj.day}
                  </Box>
                  {weeklySchedule.map((slot, slotIndex) => {
                    const lesson = slot[dayObj.day];
                    const hasLesson =
                      lesson?.name && lesson.name !== "غير محدد";
                    return (
                      <Box
                        key={slotIndex}
                        sx={{
                          position: "relative",
                          textAlign: "center",
                          p: { xs: 4, md: 6 },
                          minHeight: "120px",
                          bgcolor: hasLesson ? "white" : "#F6F8F9",
                          borderBottom: "1px solid #e8ebf0",
                          borderRight: "1px solid #e8ebf0",
                          transition: "0.2s",
                          cursor: hasLesson ? "pointer" : "default",
                          "&:hover": {
                            bgcolor: "#f0f7ff",
                            boxShadow: "inset 0 0 0 2px #3B82F61F",
                          }, 
                        }}
                        onClick={() => {
                          teacherData &&
                            (hasLesson
                              ? permissions.edit && navigate(
                                  `/school/lectures/edit/${lesson.id}?isComingFromTeacher=true`
                                )
                              : permissions.add && navigate(
                                  `/school/lectures/add?teacherId=${
                                    teacherData._id
                                  }&day=${dayObj.id}&slot=${slotIndex + 1}`
                                ));
                        }}
                      >
                        {hasLesson && (
                          <Stack
                            spacing={{ xs: 2, md: 2 }}
                            alignItems="center"
                            justifyContent={"center"}
                            height={"100%"}
                          >
                            <Typography
                              fontWeight={600}
                              fontSize={{ xs: "12px", md: "14px" }}
                              color={"text.primary"}
                              noWrap
                            >
                              {lesson.subject}
                            </Typography>
                            {teacherData && (
                              <Typography
                                fontSize={"10px"}
                                color={"primary.main"}
                                sx={{paddingY:{xs:"4px",md:"8px"}, marginTop:"0px !important"}}
                              >
                                {lesson.info}
                              </Typography>
                            )}
                            <LecturePreparation lectureId={lesson.id} preparation={lesson.preparation}/>
                          </Stack>
                        )}
                        {/* Delete Icon */}
                        {hasLesson && permissions.delete && (
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLectureId(lesson.id);
                              setOpen(true);
                            }}
                            color="error"
                            sx={{
                              position: "absolute",
                              left: 4,
                              top: 4,
                            }}
                          >
                            {" "}
                            <Delete sx={{ width: 16, height: 16 }} />{" "}
                          </IconButton>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Paper>
      {/* Pop up delete */}
      <AlertDialog
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف هذه الحصة؟"}
        type={"delete"}
        fn={handleDelete}
      />
    </div>
  );
};

 // to get preparation data
  const LecturePreparation = ({ lectureId, preparation }) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const permissions = usePermissions("preparation");

  const hasPreparation = preparation && Object.keys(preparation).length !== 0;

  const handleClick = (e, path) => {
    e.stopPropagation();
    navigate(path);
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    setLoading(true);

    const response = await deletePreparation(preparation[0]._id);

    if (response.status) {
      toast.success("تم حذف التحضير بنجاح");
      setDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(response?.message || "حدث خطأ أثناء حذف التحضير");
    }
    setLoading(false);
  };

  if (!preparation) {
    return (
      <Typography fontSize="10px" color="text.secondary">
        جاري التحميل...
      </Typography>
    );
  }

  return (
    <>
      {hasPreparation && (
        <Box
          sx={{
            display: "flex",
            gap: {xs:1,md:3},
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
          }}
        >
          {permissions.edit && (
            <Button
              size="small"
              variant="contained"
              startIcon={
                <VisibilityIcon sx={{ fontSize: "14px !important" }} />
              }
              onClick={(e) =>
                handleClick(e, `/school/preparation/edit/${preparation[0]._id}`)
              }
              sx={{
                flex: 1,
                px: {xs:2,md:5},
                py: {xs:2, md:2.5},
                fontSize: {xs: "10px",sm:"12px", md:"12px"},
                fontWeight: 500,
                textTransform: "none",
                bgcolor: "primary.success",
                color: "white",
                "&:hover": {
                  transition: "all 0.4s",
                  bgcolor: "primary.dark",
                },
                "& .MuiButton-startIcon": {
                  mr: {
                    xs: "5px",
                    sm: "4px", // small tablets
                    md: "4px", // medium screens
                    lg: "8px", // keep default on large
                  },
                },
              }}
            >
              التحضير
            </Button>
          )}

          {permissions.delete && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              disabled={loading}
              sx={{
                color: "error.main",
                border: {
                  xs: "none",   // phones
                  md: "1px solid",
                },
                borderColor: "error.main",
                borderRadius: "4px",
                padding: "2.5px",
                "&:hover": {
                  borderColor: "error.dark",
                },
              }}
            >
              <DeleteOutlineOutlined sx={{ fontSize: "21px" }} />
            </IconButton>
          )}
        </Box>
      )}

      {!hasPreparation && permissions.add && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<Add sx={{ fontSize: {xs:"13px !important",md:"16px !important" }}} />}
          onClick={(e) =>
            handleClick(e, `/school/preparation/add/?lectureId=${lectureId}`)
          }
          sx={{
            width: "50%",
            px: 5,
            py: {xs:2,sm:2, md:2.5},
            fontSize: {xs: "10px",sm:"12px", md:"12px"},
            fontWeight: 500,
            textTransform: "none",
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              transition: "all 0.4s",
              borderColor: "primary.dark",
              bgcolor: "primary.light",
              color: "white",
            },
            "& .MuiButton-startIcon": {
              mr: {
                xs: "2px",
                sm: "2px", // small tablets
                md: "3px", // medium screens
                lg: "4px", // keep default on large
              },
            },
          }}
        >
          التحضير
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        message={"هل أنت متأكد من حذف هذا التحضير؟"}
        type={"delete"}
        fn={handleDelete}
      />
    </>
  );
};

export default TeacherSchedule;

