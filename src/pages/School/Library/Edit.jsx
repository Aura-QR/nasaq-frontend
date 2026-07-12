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
import Select from "@/components/Select/Select";
import Years from "@/utils/constants/Years";
import { editLibrary } from "@/APIs/school/library";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import SubjectSelector from "@/components/Selector/SubjectSelector";


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
    const { register, handleSubmit, reset , formState: { errors }} = useForm();

    // Get Current Item (for edit)
    useEffect(() => {
        if (item && open) {
            setDefaultValues(item);
            reset(item)
        }
    }, [item , reset , open]);

    // Handle Submit
    const onSubmit = async (data) => {
        setLoading(true);
        // Get only changed fields
        const changedData = getChangedValues(data, defaultValues, ["subject"]);
        // Check If Something Changed
        if (Object.keys(changedData).length === 0) {
            toast.info("لم تحدث أي بيانات للتعديل");
            setLoading(false);
            return;
        }
        // Request to Edit Item
        const response = await editLibrary(changedData , item._id);
        console.log(response)
        if (response.status) {
            toast.success("تم تعديل العنصر بنجاح");
            // Update Items List
            setItems((prevItems) =>
                prevItems.map((itm) =>
                    itm._id === item._id ? response.data : itm
                )
            );
            setOpen(false);
            setDefaultValues({})
            reset({});
        } else {
            toast.error(response || "حدث خطأ ما!");
        }
        setLoading(false);
    };    

  return (
        <>
            <IconButton color="primary" onClick={handleClickOpen}> <EditRounded /> </IconButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>تعديل عنصر في المكتبة</DialogTitle>
                <DialogContent sx={{ minWidth : { xs: '300px', sm: '500px', md: '600px' } }}>
                    {defaultValues && <DataInputs register={register} errors={errors} defaultValues={defaultValues} />}
                    <SubmitSection onSubmit={onSubmit} handleSubmit={handleSubmit} loading={loading} close={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}

const DataInputs = ({ register, errors , defaultValues }) => {

  return (
    <Grid container mt={8} spacing={8}>
      <Grid item xs={12} sm={6}>
        <Input
          register={register}
          registerName={"title"}
          error={errors.title?.message}
          label={"عنوان العنصر"}
          required={true}
          type={"text"}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Input
          register={register}
          registerName={"link"}
          error={errors.link?.message}
          label={"رابط العنصر"}
          type={"text"}
          required={true}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <SubjectSelector
          register={register}
          errors={errors}
          defaultSubjectId={defaultValues.subjectId || ""}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Select
          register={register}
          registerName={"academicYear"}
          data={Years}
          error={errors.academicYear?.message}
          label={"السنة الدراسية التي ينتمي إليها العنصر"}
          type={"text"}
          defaultValue={defaultValues?.academicYear}
        />
      </Grid>
    </Grid>
  );
};

export default Edit;