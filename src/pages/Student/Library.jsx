import { Grid, Typography, Paper, Stack} from "@mui/material";
import Container from "@/components/Container/Container";
import { useEffect, useState } from "react";
import { School, Subject } from "@mui/icons-material";
import useDebounce from "@/utils/hooks/useDebounce";
import Years from "@/utils/constants/Years";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import ListCard from "@/components/Cards/ListCard";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useLibraries } from "@/utils/hooks/apis/useLibraries";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";
import Back from "@/components/Back/Back";

const Library = () => {
  const [items, setItems] = useState([]);

  // Filter states
  const [itemName, setItemName] = useState("");
  const [subject, setSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [localPagination, setLocalPagination] = useState(null);

  // Debounced search
  const debouncedItemName = useDebounce(itemName, 1000);

  // Fetch subjects for filter using custom useSubjects hook
  const { subjects, loading: loadingSubjects } = useSubjects();

  // Map subjects to display both name and code
  const mappedSubjects = subjects.map((item) => ({
    id: item._id || item.id,
    subjectName: item.subjectCode 
      ? `${item.subjectName} - ${item.subjectCode}` 
      : item.subjectName,
  }));

  // Build filters object
  const filters = { 
    page, 
    limit,
    title: debouncedItemName || undefined, 
    subjectId: subject || undefined, 
    academicYear: academicYear || undefined 
  };

  // call the useLibraries custom hook to fetch libraries data
  const { libraries, loading, pagination } = useLibraries(filters);

  // Update items when libraries data changes
  useEffect(() => {
    if (libraries) {
      setItems(libraries);
      if(pagination){
        setLocalPagination(pagination);
      }
    }
  }, [libraries, pagination]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [limit, debouncedItemName, subject, academicYear]);

  //permissions
  const permissions = usePermissions("library");

  // Show loading state
  if (loading) {
    return <Loading/>;
  }

  return (
    <Container noSidebar={true}>
      {/* Back */}
      <Stack mb={12}><Back title={"المكتبة"} /></Stack>
      {/* Filter */}
      <Grid container my={8} spacing={{ xs: 4, sm: 6 }} alignItems={"center"}>
        <Grid item xs={12} sm={6} md={4}>
          <SearchFilter 
            value={itemName} 
            onChange={setItemName} 
            placeholder="اسم العنصر..."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={subject}
            onChange={setSubject}
            label="المادة"
            icon={Subject}
            allLabel="جميع المواد"
            disabled={loadingSubjects}
            options={mappedSubjects.map(item => ({ 
              value: item.id, 
              label: item.subjectName 
            }))}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SelectFilter
            value={academicYear}
            onChange={setAcademicYear}
            label="السنة الأكاديمية"
            icon={School}
            allLabel="جميع السنين"
            options={Years.map(year => ({ value: year, label: year }))}
          />
        </Grid>
      </Grid>
      {/* Items */}
      {items.length > 0 ? <Grid container spacing={8} my={8}>
        {items?.map((item, i) => {
          return (
            permissions.read && (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <ListCard item={item} setItems={setItems} type="library" setLocalPagination={setLocalPagination}/>
              </Grid>
            )
          )
        })}
      </Grid> : <Paper
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
          لا توجد عناصر في المكتبة لعرضها
        </Typography>
      </Paper>}
      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={localPagination}
          page={page}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      )}
    </Container>
  );
};

export default Library;