import { ChevronLeft } from "@mui/icons-material";
import { IconButton, Stack, Typography } from "@mui/material";

const Back = ({ title }) => {
    return (
        <Stack direction={"row"} alignItems={"center"} spacing={2}>
            <IconButton color="secondary" onClick={() => history.back()}>
                <ChevronLeft fontSize="large" sx={{transition : "1s", scale : .8 , rotate : "180deg" , "&:hover" : {rotate : "540deg" , scale : "1" , color : "primary.main"}}} />
            </IconButton>
            <Typography variant="subtitle"> {title} </Typography>
        </Stack>
    );
};

export default Back;
