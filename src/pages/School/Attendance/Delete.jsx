import {IconButton} from "@mui/material";
import { useState } from "react";
import { DeleteOutlineRounded } from "@mui/icons-material";
import Popup from "@/components/Popup/Popup";
import { toast } from "react-toastify";
import { deleteAttendance } from "../../../APIs/school/attendance";

const Delete = ({setItems , id, setLocalPagination}) => {

    // Delete
    const [open, setOpen] = useState(false);

    // Delete Item
    const handleDelete = async () => {
        const response = await deleteAttendance(id);
        console.log(response)
        if (response.status) {
            toast.success("تم الحذف بنجاح");
            setItems((prevItems) => prevItems.filter((item) => item._id !== id));
            // Update local pagination
            setLocalPagination((prevPagination) => ({
                ...prevPagination,
                totalDocs: prevPagination.totalDocs - 1,
            }));
            setOpen(false);
        } else {
            toast.error(response || "حدث خطأ ما!");
        }
    };
    
    return (
        <>
            <IconButton color="error" onClick={() => setOpen(true)}> <DeleteOutlineRounded/> </IconButton>
            <Popup open={open} setOpen={setOpen} message={"هل انت متأكد انك تريد حذف غياب الطالب؟"} type="delete" fn={handleDelete} />
        </>
    )
}

export default Delete;