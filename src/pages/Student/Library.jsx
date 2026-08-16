import {
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  School,
  Subject,
} from "@mui/icons-material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Container from "@/components/Container/Container";
import SearchFilter from "@/components/Filters/SearchFilter";
import SelectFilter from "@/components/Filters/SelectFilter";
import PaginationControls from "@/components/Pagination";
import ListCard from "@/components/Cards/ListCard";
import Loading from "@/components/Loading";
import Back from "@/components/Back/Back";

import useDebounce from "@/utils/hooks/useDebounce";
import { useSubjects } from "@/utils/hooks/apis/useSubjects";
import { useLibraries } from "@/utils/hooks/apis/useLibraries";
import { useAcademicYears } from "@/utils/hooks/apis/useAcademicYears";
import usePermissions from "@/utils/hooks/usePermissions";

const Library = () => {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    itemName,
    setItemName,
  ] = useState("");

  const [
    subject,
    setSubject,
  ] = useState("");

  /*
   * Store the real AcademicYear Mongo ID.
   */
  const [
    academicYearId,
    setAcademicYearId,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    limit,
    setLimit,
  ] = useState(10);

  const [
    localPagination,
    setLocalPagination,
  ] = useState(null);

  const debouncedItemName =
    useDebounce(
      itemName,
      1000
    );

  const {
    subjects = [],
    loading:
      loadingSubjects,
  } = useSubjects();

  const {
    academicYears = [],
    loadingAcademicYears,
  } = useAcademicYears();

  const mappedSubjects =
    useMemo(
      () =>
        subjects.map(
          (item) => ({
            id:
              item._id ||
              item.id,

            subjectName:
              item.subjectCode
                ? `${item.subjectName} - ${item.subjectCode}`
                : item.subjectName,
          })
        ),
      [subjects]
    );

  const academicYearOptions =
    useMemo(
      () =>
        academicYears.map(
          (year) => ({
            value:
              year.id,

            label:
              year.status ===
              "active"
                ? `${year.name} - الحالية`
                : year.name,
          })
        ),
      [academicYears]
    );

  /*
   * Digital Library API uses academicYearId.
   */
  const filters =
    useMemo(
      () => ({
        page,
        limit,

        title:
          debouncedItemName ||
          undefined,

        subjectId:
          subject ||
          undefined,

        academicYearId:
          academicYearId ||
          undefined,
      }),
      [
        page,
        limit,
        debouncedItemName,
        subject,
        academicYearId,
      ]
    );

  const {
    libraries,
    loading,
    pagination,
  } = useLibraries(
    filters
  );

  useEffect(() => {
    if (libraries) {
      setItems(
        libraries
      );

      if (pagination) {
        setLocalPagination(
          pagination
        );
      }
    }
  }, [
    libraries,
    pagination,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    limit,
    debouncedItemName,
    subject,
    academicYearId,
  ]);

  const permissions =
    usePermissions(
      "library"
    );

  if (loading) {
    return <Loading />;
  }

  return (
    <Container
      noSidebar={true}
    >
      <Stack mb={12}>
        <Back
          title="المكتبة"
        />
      </Stack>

      <Grid
        container
        my={8}
        spacing={{
          xs: 4,
          sm: 6,
        }}
        alignItems="center"
      >
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
        >
          <SearchFilter
            value={
              itemName
            }
            onChange={
              setItemName
            }
            placeholder="اسم العنصر..."
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
        >
          <SelectFilter
            value={
              subject
            }
            onChange={
              setSubject
            }
            label="المادة"
            icon={Subject}
            allLabel="جميع المواد"
            disabled={
              loadingSubjects
            }
            options={mappedSubjects.map(
              (item) => ({
                value:
                  item.id,

                label:
                  item.subjectName,
              })
            )}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={4}
        >
          <SelectFilter
            value={
              academicYearId
            }
            onChange={
              setAcademicYearId
            }
            label="السنة الأكاديمية"
            icon={School}
            allLabel="جميع السنين"
            disabled={
              loadingAcademicYears
            }
            options={
              academicYearOptions
            }
          />
        </Grid>
      </Grid>

      {items.length > 0 ? (
        <Grid
          container
          spacing={8}
          my={8}
        >
          {items.map(
            (item, index) =>
              permissions.read && (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={
                    item?._id ||
                    item?.id ||
                    index
                  }
                >
                  <ListCard
                    item={
                      item
                    }
                    setItems={
                      setItems
                    }
                    type="library"
                    setLocalPagination={
                      setLocalPagination
                    }
                  />
                </Grid>
              )
          )}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: {
              xs: 3,
              md: 8,
              lg: 16,
            },
            borderRadius:
              "16px",
            borderColor:
              "primary.border",
            display:
              "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            minHeight:
              "400px",
          }}
        >
          <Typography
            color="text.secondary"
          >
            لا توجد عناصر في
            المكتبة لعرضها
          </Typography>
        </Paper>
      )}

      {localPagination && (
        <PaginationControls
          pagination={
            localPagination
          }
          page={page}
          onPageChange={
            setPage
          }
          limit={limit}
          onLimitChange={
            setLimit
          }
        />
      )}
    </Container>
  );
};

export default Library;
