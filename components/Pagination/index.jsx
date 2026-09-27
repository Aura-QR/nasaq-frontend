import { Stack, Typography, Box, Pagination } from "@mui/material";
import LimitFilter from "@/components/Filters/LimitFilter";

const PaginationControls = ({
  pagination,
  page,
  onPageChange,
  limit,
  onLimitChange,
  label = "عدد العناصر",
}) => {
  return (
    <Stack
      direction={"row"}
      spacing={8}
      alignItems={"center"}
      justifyContent={"space-between"}
      mt={8}
      flexWrap="wrap"
    >
      <Typography fontWeight={500} color={"text.secondary"}>
        {label} : {pagination?.totalDocs || 0}
      </Typography>
      <Stack
        direction={"row"}
        spacing={4}
        alignItems={"center"}
        flexWrap="wrap"
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              "& .MuiOutlinedInput-root": {
                padding: "0 !important",
              },
              "& .MuiSelect-select": {
                padding: "8px 30px 8px 15px !important",
              },
            }}
          >
            <LimitFilter limit={limit} setLimit={onLimitChange} />
          </Box>
        </Box>
        <Pagination
          count={pagination?.totalPages || 1}
          page={page}
          onChange={(event, value) => onPageChange(value)}
          color="primary"
        />
      </Stack>
    </Stack>
  );
};
export default PaginationControls;
