import { Box, Paper, Stack, Typography, IconButton, Tooltip } from "@mui/material";
import Days from "../../utils/constants/Days";
import Slots from "../../utils/constants/Slots";
import { useEffect, useState } from "react";
import { fetchLectures} from "@/APIs/school/lectures";
import { toast } from "react-toastify";
import { translateGender } from "../../utils/helpers/translateGender";
import { useNavigate } from "react-router-dom";
import { Delete } from "@mui/icons-material";
import AlertDialog from "../Popup/Popup";
import { deleteLecture } from "../../APIs/school/lectures";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const Schedule = ({ classData , teacherData }) => {
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  //for adding not less than 6 lectures per class
  const [lecturesCount, setLecturesCount] = useState([]);
  

  const navigate = useNavigate()

  //fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      // Fetch lectures with filters
      const response = await fetchLectures( classData? { classId : classData._id }: teacherData? { teacherId : teacherData?._id } : {} );
      if (response?.status) {
        setLectures(response.data);

       if (classData) {
         // Initialize all days with count = 0
         const countByDay = Days.reduce((acc, item) => {
           acc[item.id] = {
             count: 0,
           };
           return acc;
         }, {});

         // Count the lectures
         response.data.forEach((lecture) => {
           if (countByDay[lecture.dayOfWeek]) {
             countByDay[lecture.dayOfWeek].count++;
           }
         });

         // Convert to array for UI
         const formatted = Days.map((item) => ({
           id: item.id,
           count: countByDay[item.id].count,
         }));

         setLecturesCount(formatted);
         console.log(formatted);
       }
       // Transform API data into schedule format
       const mappedSchedule = mapLecturesToSchedule(response.data);
        setWeeklySchedule(mappedSchedule);
      } else {
        toast.error(response?.message || "حدث خطأ ما أثناء جلب الجدول الدراسي");
        setWeeklySchedule([]);
      }
      setLoading(false);
    };

    if (classData?._id || teacherData?._id) {
      fetchScheduleData();
    } else {
      setLoading(false);
    }
  }, [classData, teacherData]);

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
          info: `${lecture.class?.academicYear} - ${
            lecture.class?.roomNumber
          } - ${
            translateGender(lecture.class?.gender, "class")
          }`,
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
      const updatedLectures = lectures.filter(lec => lec._id !== selectedLectureId);
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
    return <Loading/>;
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
          لا توجد محاضرات لهذا 
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
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} mb={{ xs: 8, md: 16 }}>
          {/* Title */}
          <Typography variant="h6" fontWeight={600}>
            الجدول الدراسي الأسبوعي
          </Typography>
          {/* Class */}
          {classData && <Typography variant="subtitle1" color={"text.secondary"}>
            {classData.academicYear} - {classData.roomNumber} - {translateGender(classData.gender, "class")}
          </Typography>}
          {/* Teacher */}
          {teacherData && <Typography variant="subtitle1" color={"text.secondary"}>
            أ\ {teacherData.name}
          </Typography>}
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
            <Stack flex={1} borderRight={"1px solid"} borderColor={"primary.border"}>
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
                    p: { xs: 6, md: 8 },
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
              const day = classData ? lecturesCount.find((day)=> dayObj.id === day.id) : null;
              const dayLecturesCount = classData ? day.count : 0;
              const isIncomplete = classData && dayLecturesCount < 6;
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
                    {classData && isIncomplete && (
                      <Tooltip title="برجاء اضافة ستة محاضرات علي الأقل">
                        <Typography
                          sx={{
                            // position: "absolute",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "error.main",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <ErrorOutlineIcon sx={{ fontSize: "15px" }} />
                          اليوم غير مكتمل
                        </Typography>
                      </Tooltip>
                    )}
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
                          p: { xs: 4, md: 8 },
                          minHeight: "120px",
                          bgcolor: hasLesson ? "white" : "#F6F8F9",
                          borderBottom: "1px solid #e8ebf0",
                          borderRight: "1px solid #e8ebf0",
                          transition: "0.2s",
                          cursor: hasLesson ? "pointer" : "crosshair",
                          "&:hover": {
                            bgcolor: "#f0f7ff",
                            boxShadow: "inset 0 0 0 2px #3B82F61F",
                          },
                        }}
                        onClick={() => {
                          classData
                            ? hasLesson
                              ? navigate(
                                  `/school/lectures/edit/${lesson.id}?isComingFromClass=true`
                                )
                              : navigate(
                                  `/school/lectures/add?classId=${
                                    classData._id
                                  }&day=${dayObj.id}&slot=${slotIndex + 1}`
                                )
                            : teacherData &&
                              (hasLesson
                                ? navigate(
                                    `/school/lectures/edit/${lesson.id}?isComingFromTeacher=true`
                                  )
                                : navigate(
                                    `/school/lectures/add?teacherId=${
                                      teacherData._id
                                    }&day=${dayObj.id}&slot=${slotIndex + 1}`
                                  ));
                        }}
                      >
                        {hasLesson && (
                          <Stack
                            spacing={{ xs: 2, md: 4 }}
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
                            {!teacherData && (
                              <Typography
                                fontWeight={600}
                                fontSize={{ xs: "11px", md: "13px" }}
                                color={"primary.main"}
                              >
                                {lesson.name}
                              </Typography>
                            )}
                            {teacherData && (
                              <Typography
                                fontSize={
                                  !teacherData
                                    ? { xs: "10px", md: "11px" }
                                    : { xs: "11px", md: "12px" }
                                }
                                color={
                                  !teacherData
                                    ? "text.secondary"
                                    : "primary.main"
                                }
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {lesson.info}
                              </Typography>
                            )}
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

export default Schedule;
