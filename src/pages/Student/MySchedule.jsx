import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import {
  Box,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
import { translateGender } from "@/utils/helpers/translateGender";
import { useStudentLectures } from "@/utils/hooks/apis/student/useStudent";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";


const MySchedule = ({ teacherData }) => {

  const [weeklySchedule, setWeeklySchedule] = useState([]);

  const { lectures, loading } = useStudentLectures();

  const myClass = lectures?.[0]?.class;
  
  useEffect(() => {
    if (lectures) {
      const schedule = mapLecturesToSchedule(lectures);
      setWeeklySchedule(schedule);
    }
  }, [lectures]);

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
        };
      }
    });

    return schedule;
  };

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
          لا توجد محاضرات في الجدول الدراسي
        </Typography>
      </Paper>
    );
  }

  return (
    <Container noSidebar={true}>
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
          <Back title={"الجدول الدراسي الاسبوعي"} />
          {/* Class */}
          <Typography variant="subtitle1" color={"text.secondary"}>
            {myClass?.academicYear} - {myClass?.roomNumber} - {translateGender(myClass?.gender, "class")}
          </Typography>
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
                          p: { xs: 4, md: 8 },
                          minHeight: "120px",
                          bgcolor: hasLesson ? "white" : "#F6F8F9",
                          borderBottom: "1px solid #e8ebf0",
                          borderRight: "1px solid #e8ebf0",
                          transition: "0.2s",
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
                      </Box>
                    );
                  })}
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default MySchedule;

