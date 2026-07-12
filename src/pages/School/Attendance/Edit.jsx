import {
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";
import { EditRounded } from "@mui/icons-material";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { editAttendance } from "../../../APIs/school/attendance";
import ClassSelector from "@/components/Selector/ClassSelector";
import StudentSelector from "@/components/Selector/StudentSelector";

const Edit = ({setItems , item}) => {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false)
    const [defaultValues, setDefaultValues] = useState(null);

    // Open Dialog
    const handleClickOpen = () => {
        setOpen(true);
    };
    // Close Dialog
    const handleClose = (event, reason) => {
        // Prevent closing on backdrop click or ESC key
        if (loading) {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                return;
            }
        }
        setOpen(false);
    };

    // USE FORM
    const { register, handleSubmit, reset , setValue , formState: { errors }} = useForm();

    // Get Current Item (for edit)
    useEffect(() => {
        if (item && open) {
            const formattedItem = {
                ...item,
                date: item.date.split("T")[0], // Format date to YYYY-MM-DD
                academicYear: item.class?.academicYear || "",
                classId: item.classId || item.class?._id,
                studentId: item.studentId || item.student?._id,
            };
            setDefaultValues(formattedItem);
            reset(formattedItem);
        }
    }, [item , reset , open]);

    // Handle Submit
    const onSubmit = async (data) => {
        setLoading(true);
        // Get only changed fields
        const changedData = getChangedValues(data, defaultValues, ["class" , "student"]);
        // Check If Something Changed
        if (Object.keys(changedData).length === 0) {
            toast.info("لم تحدث أي بيانات للتعديل");
            setLoading(false);
            return;
        }
        // Request to Edit Item
        delete changedData.academicYear;
        const response = await editAttendance(changedData , item._id);
        console.log(response)
        if (response.status) {
            toast.success("تم تعديل الغياب بنجاح");
            // Update Items List
            setItems((prevItems) =>
                prevItems.map((itm) =>
                    itm._id === item._id ? response.data : itm
                )
            );
            setOpen(false);
            setDefaultValues(null);
            reset({});
        } else {
            toast.error(response || "حدث خطأ ما!");
        }
        setLoading(false);
    };    

  return (
        <>
            <IconButton sx={{ color: "#32C652" }} onClick={handleClickOpen}> 
                <EditRounded /> 
            </IconButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>تعديل الغياب</DialogTitle>
                <DialogContent sx={{ minWidth : { xs: '300px', sm: '500px', md: '600px' } }}>
                    {defaultValues && (
                        <DataInputs 
                            register={register} 
                            errors={errors} 
                            setValue={setValue} 
                            defaultValues={defaultValues} 
                        />
                    )}
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

const DataInputs = ({ register, errors , setValue , defaultValues }) => {
  
  const [selectedClassId, setSelectedClassId] = useState(defaultValues.classId || "");

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setValue("studentId", ""); // Clear student when class changes
  };

  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12}>
        <ClassSelector
          register={register}
          errors={errors}
          setValue={setValue}
          onClassChange={handleClassChange}
          defaultAcademicYear={defaultValues?.class?.academicYear || ""}
          defaultClassId={defaultValues.classId || ""}
        />
      </Grid>

      <Grid item xs={12}>
        <StudentSelector
          register={register}
          errors={errors}
          classId={selectedClassId}
          setValue={setValue}
          defaultStudentId={defaultValues.studentId || ""}
        />
      </Grid>

      <Grid item xs={12}>
        <Input
          register={register}
          registerName={"date"}
          error={errors.date?.message}
          label={"تاريخ الغياب"}
          required={true}
          type={"date"}
          defaultValue={defaultValues.date}
        />
      </Grid>
    </Grid>
  );
};

export default Edit;