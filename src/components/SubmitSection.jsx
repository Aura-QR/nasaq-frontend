import { Button, Stack } from '@mui/material';

const SubmitSection = ({ onSubmit, handleSubmit, loading , close }) => {
    return (
        <Stack direction={{xs : "column" , sm : "row"}} spacing={12} justifyContent={"end"} my={20}>
            <Button
                variant="outlined"
                sx={{ p: "16px 80px", borderRadius: "8px" }}
                onClick={() => close ? close() : history.back()}
            >
                
                إلغاء
            </Button>
            <Button
                variant="contained"
                sx={{ p: "16px 80px", borderRadius: "8px" }}
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
            >
                حفظ
            </Button>
        </Stack>
    );
};

export default SubmitSection