import {
  Button,
  Stack,
  Typography,
} from "@mui/material";

import {
  RefreshRounded,
} from "@mui/icons-material";

import {
  useSubjectsList,
} from "@/utils/hooks/apis/useSubjectsList";

import Checkboxes from "../Checkboxes";

const SubjectCheckBoxes = ({
  selectedSubjects = [],
  setSelectedSubjects,
}) => {
  const {
    subjects,
    loading,
    error,
    refetch,
  } =
    useSubjectsList();

  if (loading) {
    return (
      <Typography
        color="text.secondary"
        sx={{
          py: 1,
          fontSize:
            "11px",
        }}
      >
        جاري تحميل المواد...
      </Typography>
    );
  }

  if (error) {
    return (
      <Stack
        alignItems="flex-start"
        spacing={0.8}
        sx={{
          py: 0.5,
        }}
      >
        <Typography
          color="error.main"
          sx={{
            fontSize:
              "10px",
            fontWeight:
              700,
          }}
        >
          {error}
        </Typography>

        <Button
          type="button"
          size="small"
          onClick={() =>
            refetch({
              force: true,
            })
          }
          startIcon={
            <RefreshRounded />
          }
          sx={{
            minHeight: 32,
            fontSize:
              "9px",
            fontWeight:
              800,
          }}
        >
          إعادة المحاولة
        </Button>
      </Stack>
    );
  }

  if (
    subjects.length === 0
  ) {
    return (
      <Typography
        color="text.secondary"
        sx={{
          py: 1,
          fontSize:
            "10px",
        }}
      >
        لا توجد مواد دراسية متاحة للاختيار.
      </Typography>
    );
  }

  return (
    <Checkboxes
      items={
        subjects
      }
      selectedData={
        selectedSubjects
      }
      setSelectedData={
        setSelectedSubjects
      }
    />
  );
};

export default SubjectCheckBoxes;
