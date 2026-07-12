import { Grid, IconButton, Stack, Typography, Paper} from "@mui/material";
import Container from "@/components/Container/Container";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import Add from "./Add";
import useDebounce from "@/utils/hooks/useDebounce";
import SearchFilter from "@/components/Filters/SearchFilter";
import ClassFilter from "@/components/Filters/ClassFilter";
import DateRangeFilter from "@/components/Filters/DateRangeFilter";
import ListCard from "@/components/Cards/ListCard";
import PaginationControls from "@/components/Pagination";
import { useAttendances } from "@/utils/hooks/apis/useAttendances";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";

const List = () => {
  const [items, setItems] = useState([]);

  // Filter states
  const [studentName, setStudentName] = useState("");
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  // Debounced search
  const debouncedStudentName = useDebounce(studentName, 1000);

  // Build filters object
  const filters = { 
    page, 
    limit,
    name: debouncedStudentName || undefined,
    classId: classId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  };

  // Call the useAttendances custom hook to fetch attendance data
  const { attendances, loading, pagination } = useAttendances(filters);
  console.log("attendances", attendances);

  // Update items when attendances data changes
  useEffect(() => {
    if (attendances) {
      setItems(attendances);
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [attendances, pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedStudentName, classId, startDate, endDate]);
  
  //permissions
  const permissions = usePermissions("attendance");

  // Show loading state
  // if (loading) {
  //   return <Loading/>;
  // }


  return (
    <Container>
      {/* Filter */}
      <Grid container mb={8} spacing={{ xs: 4, sm: 6 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={2.5}>
          <SearchFilter 
            value={studentName} 
            onChange={setStudentName} 
            placeholder="اسم الطالب..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.5}>
          <ClassFilter classId={classId} setClassId={setClassId} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            startLabel="من تاريخ"
            endLabel="إلى تاريخ"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction={"row"} spacing={8} flex={"1"} width={"100%"} alignItems={"center"}>
            {permissions.add && (
              <Add setItems={setItems} setLocalPagination={setLocalPagination}/>
            )}
            <CSVLink data={items.length > 0 ? items : []}>
              <IconButton color="primary">
                <SaveAltIcon />
              </IconButton>
            </CSVLink>
          </Stack>
        </Grid>
      </Grid>
      {/* Items */}
      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 8, lg: 16 },
            borderRadius: "16px",
            borderColor: "primary.border",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Loading />
        </Paper>
      ) : items.length > 0 ? (
        <Grid container spacing={8} my={8}>
          {items?.map((item, i) => {
            return (
              permissions.read && (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <ListCard item={item} setItems={setItems} type="attendance" setLocalPagination={setLocalPagination}/>
                </Grid>
              )
            )
          })}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 8, lg: 16 },
            borderRadius: "16px",
            borderColor: "primary.border",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Typography color="text.secondary">
            لا توجد غيابات لعرضها
          </Typography>
        </Paper>
      )}
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
          label="عدد الغيابات"
        />
      )}
    </Container>
  );
};

export default List;