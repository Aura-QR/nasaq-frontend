import {
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardIosRounded,
  ManageAccountsRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import TeacherForm from "@/components/Teachers/TeacherForm";
import TeacherFormActions from "@/components/Teachers/TeacherFormActions";

import { editTeacher } from "@/APIs/users/teachers";
import { fetchTeacherAssignments } from "@/APIs/school/lectures";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useTeacher } from "@/utils/hooks/apis/useTeacher";
import { getTeacherSubjectOfferingIds } from "@/utils/school/teacherData";

const normalizeIds = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) =>
          String(
            value?._id ||
              value?.id ||
              value ||
              ""
          ).trim()
        )
        .filter(Boolean)
    )
  );

const sameIds = (first = [], second = []) => {
  const left = normalizeIds(first).sort();
  const right = normalizeIds(second).sort();

  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
};

const extractAssignments = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.assignments)) return data.assignments;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.records)) return data.records;

  return [];
};

const getAssignmentOfferingId = (assignment) => {
  const value =
    assignment?.subjectOfferingId ||
    assignment?.subjectOffering;

  return String(
    value?._id || value?.id || value || ""
  ).trim();
};

const Edit = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [loading, setLoading] =
    useState(false);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const [
    selectedSubjects,
    setSelectedSubjects,
  ] = useState([]);

  const [
    initialSubjectOfferingIds,
    setInitialSubjectOfferingIds,
  ] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    teacher,
    loading: teacherLoading,
  } = useTeacher(id);

  useEffect(() => {
    if (!teacher) return;

    const formattedTeacher = {
      ...teacher,
      hireDate: teacher.hireDate
        ? new Date(teacher.hireDate)
            .toISOString()
            .split("T")[0]
        : "",
      isActive: teacher.isActive
        ? 1
        : 0,
    };

    const assignedOfferingIds =
      normalizeIds(
        getTeacherSubjectOfferingIds(
          teacher
        )
      );

    setSelectedSubjects(
      assignedOfferingIds
    );
    setInitialSubjectOfferingIds(
      assignedOfferingIds
    );

    reset(formattedTeacher);
    setDefaultValues(
      formattedTeacher
    );
  }, [teacher, reset]);

  useEffect(() => {
    if (
      !teacher ||
      !id ||
      initialSubjectOfferingIds.length > 0
    ) {
      return undefined;
    }

    let active = true;

    const loadAssignments = async () => {
      const response =
        await fetchTeacherAssignments(
          { teacherId: id },
          { force: true }
        );

      if (
        !active ||
        response?.status === false
      ) {
        return;
      }

      const offeringIds =
        normalizeIds(
          extractAssignments(response)
            .map(
              getAssignmentOfferingId
            )
            .filter(Boolean)
        );

      if (offeringIds.length === 0) {
        return;
      }

      setSelectedSubjects(
        offeringIds
      );
      setInitialSubjectOfferingIds(
        offeringIds
      );
    };

    loadAssignments();

    return () => {
      active = false;
    };
  }, [
    teacher,
    id,
    initialSubjectOfferingIds.length,
  ]);

  const onSubmit = async (
    formData
  ) => {
    if (!defaultValues) return;

    try {
      setLoading(true);

      const changedData =
        getChangedValues(
          formData,
          defaultValues,
          [
            "subjects",
            "subject",
            "subjectOfferings",
            "subjectOfferingIds",
            "subjectIds",
          ]
        );

      const normalizedSelectedSubjects =
        normalizeIds(
          selectedSubjects
        );

      if (
        !sameIds(
          normalizedSelectedSubjects,
          initialSubjectOfferingIds
        )
      ) {
        changedData.subjectOfferingIds =
          normalizedSelectedSubjects;
      }

      if (
        Object.keys(changedData)
          .length === 0
      ) {
        toast.info(
          "لم يتم إجراء أي تغييرات على البيانات"
        );
        return;
      }

      if (
        "isActive" in changedData
      ) {
        changedData.isActive =
          changedData.isActive == 1;
      }

      const response =
        await editTeacher(
          changedData,
          id
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء تعديل بيانات المعلم"
        );
        return;
      }

      toast.success(
        "تم تعديل بيانات المعلم بنجاح"
      );

      const teacherId =
        response?.data?.teacher?._id ||
        id;

      navigate(
        `/users/teachers/${teacherId}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل بيانات المعلم"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(
          onSubmit
        )}
      >
        <Stack spacing={1}>
          <Button
            component={Link}
            to={`/users/teachers/${id}`}
            startIcon={
              <ArrowForwardIosRounded />
            }
            sx={{
              width: "fit-content",
              minHeight: 34,
              px: 1.1,

              color:
                "var(--color-navy)",
              backgroundColor:
                "rgba(36, 74, 112, 0.045)",
              borderRadius: "10px",

              fontSize: "10.5px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon":
                {
                  marginLeft: "5px",
                  marginRight: 0,
                },

              "& svg": {
                fontSize: "15px",
              },

              "&:hover": {
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
              },
            }}
          >
            العودة إلى تفاصيل المعلم
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 1.25,
                md: 1.5,
              },

              display: "flex",
              alignItems: "center",
              gap: 1,

              border:
                "1px solid rgba(36, 74, 112, 0.08)",
              borderRadius: "16px",

              background:
                "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.38))",

              boxShadow:
                "0 8px 20px rgba(18,47,77,0.05)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,

                display: "grid",
                placeItems: "center",
                flexShrink: 0,

                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",

                border:
                  "1px solid rgba(211,164,79,0.21)",
                borderRadius: "12px",

                "& svg": {
                  fontSize: 21,
                },
              }}
            >
              <ManageAccountsRounded />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: {
                    xs: "19px",
                    md: "22px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.25,
                }}
              >
                تعديل بيانات المعلم
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color:
                    "var(--color-muted)",
                  fontSize: "9.5px",
                  lineHeight: 1.5,
                }}
              >
                حدّث البيانات المطلوبة ثم
                احفظ التغييرات.
              </Typography>
            </Box>
          </Paper>

          {teacherLoading ||
          !defaultValues ? (
            <Stack spacing={1}>
              {[...Array(3)].map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    variant="rounded"
                    height={118}
                    sx={{
                      borderRadius:
                        "16px",
                    }}
                  />
                )
              )}
            </Stack>
          ) : (
            <>
              <TeacherForm
                mode="edit"
                register={register}
                errors={errors}
                defaultValues={
                  defaultValues
                }
                selectedSubjects={
                  selectedSubjects
                }
                setSelectedSubjects={
                  setSelectedSubjects
                }
                showSubjects
              />

              <TeacherFormActions
                loading={loading}
                submitLabel="حفظ التعديلات"
                cancelTo={`/users/teachers/${id}`}
              />
            </>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default Edit;
