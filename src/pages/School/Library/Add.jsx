import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import { addLibrary } from "@/APIs/school/library";
import { useForm } from "react-hook-form";
import Input from "@/components/Input/Input";
import SubmitSection from "@/components/SubmitSection";
import { AddCircleOutlineOutlined } from "@mui/icons-material";
import Select from "@/components/Select/Select";
import Years from "@/utils/constants/Years";
import SubjectSelector from "@/components/Selector/SubjectSelector";


const Add = ({setItems}) => {

    // USE FORM
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false)

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        // Prevent closing on backdrop click or ESC key
        if (loading) {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                return;
            }
        }
        setOpen(false);
    };

    // Handle Submit
    const onSubmit = async (data) => {
        setLoading(true);
        // handle data if needed
        if (data.subjectId === "") {
            delete data.subjectId;
        }
        // Request to Add Item
        const response = await addLibrary(data);
        if (response.status) {
            toast.success("تم إضافة عنصر المكتبة بنجاح");
            setItems((prevItems) => [...prevItems, response.data ]);
            setOpen(false);
        } else {
            toast.error(response || "حدث خطأ ما!");
        }
        setLoading(false);
    };
    

  return (
        <>
            <Button startIcon={<AddCircleOutlineOutlined />} variant="contained" sx={{ p: "16px 40px", borderRadius: "8px" , width: "100%" }} onClick={handleClickOpen}>
                إضافة عنصر جديد
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>إضافة عنصر جديد للمكتبة</DialogTitle>
                <DialogContent sx={{ minWidth : { xs: '300px', sm: '500px', md: '600px' } }}>
                    <DataInputs register={register} errors={errors} />
                    <SubmitSection onSubmit={onSubmit} handleSubmit={handleSubmit} loading={loading} close={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}

const DataInputs = ({ register, errors }) => {
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
          label="المادة المتعلق بها العنصر"
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
        />
      </Grid>
    </Grid>
  );
};

export default Add;