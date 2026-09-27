import { Stack, Chip, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Person } from "@mui/icons-material";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { Suspense } from "react";
import React from "react";
import usePermissions from "@/utils/hooks/usePermissions";

/* ---------------- Dynamic Imports ---------------- */
const EditMap = {
  attendance: React.lazy(() => import("@/pages/School/Attendance/Edit")),
  library: React.lazy(() => import("@/pages/School/Library/Edit")),
};
const DeleteMap = {
  attendance: React.lazy(() => import("@/pages/School/Attendance/Delete")),
  library: React.lazy(() => import("@/pages/School/Library/Delete")),
};

const ListCard = ({ item, setItems, type, setLocalPagination }) => { //type = attendance || library
  
  const isAttendanceCard = type === "attendance";
  const isLibraryCard = type === "library"

  const Edit = EditMap[type];
  const Delete = DeleteMap[type];

  // Colors and Icons based on type
  const iconBgColor = isAttendanceCard ? "#FF000026" : "#3B82F626";
  const iconColor = isAttendanceCard ? "error.main" : "primary.main";
  const Icon = isAttendanceCard ? Person : MenuBookIcon;

  //permissions
  const currentPermissions = usePermissions(type); // "attendance" or "library"
  const classPermissions = usePermissions("classes");
  const studentsPermissions = usePermissions("students");

  return (
    <Stack 
      borderRadius={"20px"} 
      border={"1px solid"} 
      boxShadow={""} 
      pt={24} 
      p={12} 
      overflow={"hidden"} 
      borderColor={"primary.border"} 
      alignItems={"center"} 
      position={"relative"}
    >
      {/* Icon */}
      <Stack 
        width={64} 
        height={64} 
        borderRadius={"50%"} 
        bgcolor={iconBgColor} 
        alignItems={"center"} 
        justifyContent={"center"}
      >
        <Icon sx={{ fontSize: 30, color: iconColor }} />
      </Stack>

      {/* Attendance Card */}
      {isAttendanceCard && (
        <>
          {/* Student Name */}
            {studentsPermissions.read && (
              <Link to={"/users/students/" + item.studentId}>
                <Typography 
                  fontWeight={600} 
                  fontSize={16} 
                  mt={4} 
                  textAlign={"center"} 
                  color={"secondary"}
                >
                  {item.student?.name}
                </Typography>
              </Link>
            )}

          {/* Class */}
          {classPermissions.read && (
            <Link to={"/school/classes/" + item.classId}>
              <Typography 
                fontSize={14} 
                fontWeight={500} 
                mb={4} 
                textAlign={"center"} 
                color={"#4B5563"}
              >
                {`${item.class?.academicYear} - ${item.class?.roomNumber}`}
              </Typography>
            </Link>
          )}

          {/* Date */}
          <Chip 
            color="error" 
            variant="outlined" 
            label={format(new Date(item.date), "eee, d MMM yyyy", { locale: ar })} 
          />
        </>
      )}

      {/* Library Card */}
      {isLibraryCard && (
        <>
          {/* Title */}
          <Typography 
            fontWeight={600} 
            fontSize={16} 
            mt={4} 
            textAlign={"center"} 
            color={"secondary"}
          >
            {item.title}
          </Typography>

          {/* Subject */}
          <Typography 
            fontSize={14} 
            fontWeight={500} 
            textAlign={"center"} 
            color={"#4B5563"}
          >
            المادة: {item.subject?.subjectName || "بدون مادة"}
          </Typography>

          {/* Academic Year */}
          <Typography 
            fontSize={14} 
            fontWeight={500} 
            mb={4}
            textAlign={"center"} 
            color={"#4B5563"}
          >
            السنة الأكاديمية: {item.academicYear || "غير محددة"}
          </Typography>

          {/* Open Button */}
          {currentPermissions.read && (
            <Link to={item.link} target="_blank" style={{ width: "100%" }}>
              <Button 
                variant="contained" 
                sx={{ py: 6, borderRadius: "12px" }} 
                fullWidth
              >
                فتح الملف
              </Button>
            </Link>
          )}
        </>
      )}

      {/* Actions */}
      {/* render the edit and delete action buttons once the lazy components finish */}
      {(currentPermissions.edit || currentPermissions.delete) && (
        <Suspense fallback={null}>
          <Stack 
            direction={"row"} 
            spacing={2} 
            position={"absolute"} 
            top={12} 
            right={12} 
            left={12} 
            justifyContent={"space-between"}
          >
            {/* Only render Edit if user has edit permission */}
            {currentPermissions.edit && <Edit item={item} setItems={setItems} />}
            
            {/* Only render Delete if user has delete permission */}
            {currentPermissions.delete && <Delete id={item._id} setItems={setItems} setLocalPagination={setLocalPagination}/>}
          </Stack>
        </Suspense>
      )}
    </Stack>
  );
};
export default ListCard;