import { Stack, Paper, CircularProgress, Typography } from "@mui/material";
const Loading = () => {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 8, lg: 16 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            جاري تحميل البيانات ...
          </Typography>
        </Stack>
      </Paper>
    );
};
export default Loading;
