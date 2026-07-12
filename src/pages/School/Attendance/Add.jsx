import { Button, Dialog, DialogContent, DialogTitle, Grid} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import { addAttendance } from "@/APIs/school/attendance";
import ClassSelector from "@/components/Selector/ClassSelector";
import StudentSelector from "@/components/Selector/StudentSelector";

const Add = ({setItems, setLocalPagination}) => {
  // USE FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    // Prevent closing on backdrop click or ESC key
    if (loading) {
      if (reason === "backdropClick" || reason === "escapeKeyDown") {
        return;
      }
    }
    setOpen(false);
  };

  // Map response data to match List component format
  const mappedItems = (item) => {
    return {
      id: item._id,
      _id: item._id,
      name: item.student?.name || "",
      student: item.student,
      studentId: item.studentId,
      class: item.class,
      classId: item.classId,
      date: item.date,
    };
  };

  // Handle Submit
  const onSubmit = async (data) => {
    setLoading(true);
    
    // Create submission data
    const submissionData = {
      classId: data.classId,
      studentId: data.studentId,
      date: new Date(data.date).toISOString().split("T")[0],
    };
    
    console.log("Submitting:", submissionData);
    
    const response = await addAttendance(submissionData);
    console.log("Response:", response);
    
    if (response.status) {
      toast.success("تم إضافة غياب الطالب بنجاح");
      // Add the new item to the beginning of the list with proper formatting
      setItems((prevItems) => [mappedItems(response.data), ...prevItems]);
      // Update pagination
      setLocalPagination((prev) => ({
        ...prev,
        totalDocs: prev.totalDocs + 1,
        totalPages: Math.ceil((prev.totalDocs + 1) / prev.limit)
      }));
      // Reset form to default values
      reset({
        date: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    } else {
      toast.error(response || "حدث خطأ ما!");
    }
    setLoading(false);
  };
  
  return (
    <>
      <Button
        startIcon={<AddCircleOutlineOutlined />}
        variant="contained"
        sx={{ p: "16px 40px", borderRadius: "8px", width: "100%" }}
        onClick={handleClickOpen}
      >
        إضافة غياب جديد
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>إضافة غياب جديد لطالب</DialogTitle>
        <DialogContent
          sx={{ minWidth: { xs: "300px", sm: "500px", md: "600px" } }}
        >
          <DataInputs register={register} errors={errors} setValue={setValue} />
          <SubmitSection
            onSubmit={onSubmit}
            handleSubmit={handleSubmit}
            loading={loading}
            close={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

const DataInputs = ({ register, errors, setValue }) => {
  const [selectedClassId, setSelectedClassId] = useState("");

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setValue("studentId", ""); // Reset student when class changes
  };

  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12}>
        <ClassSelector
          register={register}
          errors={errors}
          setValue={setValue}
          onClassChange={handleClassChange}
        />
      </Grid>

      <Grid item xs={12}>
        <StudentSelector
          register={register}
          errors={errors}
          classId={selectedClassId}
          setValue={setValue}
        />
      </Grid>

      <Grid item xs={12}>
        <Input
          register={register}
          registerName="date"
          error={errors.date?.message}
          label="تاريخ الغياب"
          required={true}
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
        />
      </Grid>
    </Grid>
  );
};

export default Add;